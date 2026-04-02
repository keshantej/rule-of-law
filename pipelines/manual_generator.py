from __future__ import annotations

import json
import logging
from pathlib import Path

from pipelines.model_clients import ModelRouter
from pipelines.renderers import write_manual_docx
from pipelines.schemas import CanonicalUnit, DeliverableTrace, DeliverableTraceUnit, ManualArtifact, ManualChecklist, ManualSection
from pipelines.settings import SettingsBundle
from pipelines.utils import dump_json, dump_text, ensure_dir, normalize_whitespace, read_text, stable_id, strip_structural_noise


LOGGER = logging.getLogger(__name__)

STANDARD_RULE_OF_LAW_DEFINITION = (
    "The Rule of Law means power is exercised through known rules and fair institutions rather than arbitrary will. "
    "It requires that everyone, including public officials, is subject to the law; that laws are clear, public, and stable; "
    "and that disputes are handled through fair, accountable processes rather than favoritism or force."
)


SECTION_BUCKETS = {
    "Introductory Letter from Ted Schmidt": ["Why It Matters", "Lawyer's Role", "Arizona-Specific Context"],
    "How to Use This Manual": ["Public Communication", "Resources / Calls to Action"],
    "What the Rule of Law Is": ["Definition / Core Concept"],
    "Core Principles of the Rule of Law": ["Definition / Core Concept", "Appendices / Supporting Texts"],
    "Why the Rule of Law Matters": ["Why It Matters"],
    "What Happens When It Weakens": ["Institutional / Civic Stakes"],
    "Why Lawyers Must Lead": ["Lawyer's Role"],
    "The Ambassador Role": ["Lawyer's Role", "Public Communication"],
    "How to Communicate the Rule of Law Effectively": ["Public Communication"],
    "Audience-Specific Communication Tips": ["Public Communication"],
    "Handling Questions and Difficult Conversations": ["Public Communication"],
    "Ambassador Toolkit": ["Resources / Calls to Action", "Public Communication"],
    "Arizona-Specific Civic Resources": ["Arizona-Specific Context", "Resources / Calls to Action"],
    "Presentation Preparation Checklist": ["Resources / Calls to Action", "Public Communication"],
    "Appendices": ["Appendices / Supporting Texts"],
}

SECTION_KEYWORDS = {
    "What the Rule of Law Is": ["rule of law", "defined", "definition", "known rules"],
    "Core Principles of the Rule of Law": ["accountability", "just law", "open government", "impartial justice"],
    "Why the Rule of Law Matters": ["stability", "rights", "predictability", "trust", "peaceful"],
    "What Happens When It Weakens": ["weakens", "erosion", "rights become", "power", "disorder"],
    "Why Lawyers Must Lead": ["lawyers", "judges", "oath", "public trust", "professional obligation"],
    "The Ambassador Role": ["ambassador", "public communication", "public servant", "teach"],
    "How to Communicate the Rule of Law Effectively": ["communicate", "plain english", "audience", "questions"],
    "Ambassador Toolkit": ["resources", "toolkit", "checklist", "what citizens can do"],
    "Arizona-Specific Civic Resources": ["arizona", "state bar", "supreme court", "bar foundation", "o'connor"],
}


class ManualGenerator:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.canonical_dir = root_dir / settings.pipeline.directories["canonical"]
        self.output_dir = ensure_dir(root_dir / "outputs" / "manual")
        self.intermediate_dir = ensure_dir(root_dir / "outputs" / "intermediate")
        self.prompts_dir = root_dir / settings.pipeline.directories["prompts"]

    def run(self) -> ManualArtifact:
        corpus_path = self.canonical_dir / "canonical_corpus.json"
        if not corpus_path.exists():
            raise FileNotFoundError("Run canonicalization before manual generation.")
        corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
        units = [CanonicalUnit.model_validate(item) for item in corpus["units"]]
        manual = self._build_manual(units)
        trace = DeliverableTrace(
            deliverable_id="manual",
            artifact_type="manual_backbone",
            generated_at=__import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
            units=[
                DeliverableTraceUnit(
                    unit_id=section.section_id,
                    title=section.title,
                    source_support=section.source_support,
                    generated_scaffolding=section.generated_scaffolding,
                )
                for section in manual.sections
            ],
        )
        markdown = self._manual_to_markdown(manual)
        dump_json(self.intermediate_dir / "manual.json", manual.model_dump())
        dump_text(self.root_dir / self.settings.pipeline.packaging["manual_markdown"], markdown)
        dump_json(self.root_dir / self.settings.pipeline.packaging["manual_trace"], trace.model_dump())
        write_manual_docx(manual, self.root_dir / self.settings.pipeline.packaging["manual_docx"])
        return manual

    def _build_manual(self, units: list[CanonicalUnit]) -> ManualArtifact:
        deterministic_sections = [self._build_section(title, units) for title in self.settings.pipeline.manual_structure]
        if not self.router.is_route_live("manual_generation"):
            return self._polish_manual(ManualArtifact(title="Arizona Rule of Law Ambassador Manual", sections=deterministic_sections))
        prompt = read_text(self.prompts_dir / "manual_generation.txt")
        section_packs = []
        for title in self.settings.pipeline.manual_structure:
            relevant = self._usable_units([unit for unit in units if unit.bucket in SECTION_BUCKETS[title] and unit.validation.supported] or self._fallback_units(title, units))
            section_packs.append(
                {
                    "section_title": title,
                    "evidence": [
                        {
                            "canonical_id": unit.canonical_id,
                            "title": unit.title,
                            "bucket": unit.bucket,
                            "summary": unit.summary,
                            "key_points": unit.key_points,
                            "quotes": unit.quotes,
                            "sources": unit.supporting_sources,
                        }
                        for unit in relevant[:6]
                    ],
                }
            )
        user_prompt = json.dumps(
            {
                "manual_structure": self.settings.pipeline.manual_structure,
                "sections": [section.model_dump() for section in deterministic_sections],
                "section_source_packs": section_packs,
                "source_hierarchy": [
                    "Tier 1: Combined files including President Messages.pdf",
                    "Tier 2: Speaker Script Guide.pdf and speaker_script.pdf",
                    "Tier 3: Search history as of 2-12-26.pdf for structure only",
                ],
            },
            indent=2,
        )
        model_result = self.router.try_generate_json("manual_generation", prompt, user_prompt)
        if model_result and "sections" in model_result:
            try:
                sections = [ManualSection.model_validate(item) for item in model_result["sections"]]
                return self._polish_manual(ManualArtifact(title=model_result.get("title", "Arizona Rule of Law Ambassador Manual"), sections=sections))
            except Exception:  # noqa: BLE001
                LOGGER.warning("API manual result failed validation, using deterministic draft.")
        return self._polish_manual(ManualArtifact(title="Arizona Rule of Law Ambassador Manual", sections=deterministic_sections))

    def _build_section(self, title: str, units: list[CanonicalUnit]) -> ManualSection:
        relevant_units = [unit for unit in units if unit.bucket in SECTION_BUCKETS[title] and unit.validation.supported]
        if not relevant_units:
            relevant_units = self._fallback_units(title, units)
        relevant_units = self._usable_units(relevant_units)
        section_id = stable_id(title, prefix="manual")
        generated_scaffolding: list[str] = []
        if title == "Introductory Letter from Ted Schmidt":
            body = (
                "This manual begins from a simple civic premise: if the Rule of Law is to remain strong, it must be explained clearly, defended responsibly, "
                "and carried into public life by people who understand both its principles and its practical value.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("The opening framing paragraph was generated to unify the source material into a printable letter format.")
        elif title == "How to Use This Manual":
            body = (
                "This manual is designed to help ambassadors move from legal principle to public explanation. "
                "It can support a short civic presentation, a longer classroom conversation, or a community event.\n\n"
                "Each section is written so you can teach from it directly, adapt it to your audience, or use it to prepare a slide-based talk. "
                "The most authoritative substance comes from the primary source materials, while brief connective text has been added to improve flow and usability."
            )
            generated_scaffolding.append("Usage instructions and connective language were generated from the overall pipeline design.")
        elif title == "What the Rule of Law Is":
            body = (
                "At its core, the Rule of Law means that power is exercised through known rules and fair institutions rather than through arbitrary will. "
                "It gives people confidence that laws will be applied predictably, publicly, and through processes that can be trusted.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("The lead definition paragraph was generated to translate supported source language into plain English.")
        elif title == "Core Principles of the Rule of Law":
            body = (
                "The source materials repeatedly frame the Rule of Law around four connected ideas: accountability, just law, open government, and accessible, impartial justice.\n\n"
                "Accountability means public officials and private actors alike remain subject to law. "
                "Just law means laws should be clear, publicized, stable, and protective of fundamental rights. "
                "Open government means legal rules and decision-making processes should be transparent. "
                "Accessible, impartial justice means disputes should be resolved fairly by competent, ethical, and independent decision-makers.\n\n"
                f"{self._summaries(relevant_units, limit=1)}"
            )
            generated_scaffolding.append("The four-principles paragraph was generated from supported source language for teachability.")
        elif title == "Why the Rule of Law Matters":
            body = (
                "The Rule of Law matters because it turns conflict into process, power into responsibility, and rights into something more durable than aspiration. "
                "It helps communities trust that rules will be applied fairly and that disagreements can be resolved without force or favoritism.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("The lead paragraph was generated to connect supported source claims into a readable section.")
        elif title == "What Happens When It Weakens":
            body = (
                "When the Rule of Law weakens, public confidence in fairness and accountability weakens with it. Rights become less secure, institutions lose legitimacy, "
                "and civic disagreement is more likely to be treated as a contest of power rather than a process governed by rules.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("The lead paragraph was generated to connect supported warnings into plain English.")
        elif title == "Why Lawyers Must Lead":
            body = (
                "Lawyers occupy a special position in this work because their professional obligations are tied not only to advocacy, but also to law, constitutional order, "
                "and public trust. That makes lawyers natural translators between legal principle and public understanding.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("The lead paragraph was generated to unify the oath and public-service themes.")
        elif title == "The Ambassador Role":
            body = (
                "An ambassador does more than deliver slides. The role is to explain the Rule of Law clearly, stay nonpartisan, invite civic reflection, and help audiences see why lawful process matters in everyday life.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("The ambassador-role framing was generated for operational clarity.")
        elif title == "How to Communicate the Rule of Law Effectively":
            body = (
                "Effective communication starts with plain English. Define the Rule of Law before analyzing it, use examples that emphasize fairness and predictability, "
                "and return to shared civic principles whenever a discussion begins to drift into partisan dispute.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("Communication guidance was generated from supported delivery themes.")
        elif title == "Audience-Specific Communication Tips":
            body = (
                "Different audiences need different entry points. Students often respond to everyday examples of fairness and predictability. "
                "Community groups may want to understand how legal institutions affect public trust. Professional audiences may be ready for a more explicit discussion of duty, oath, and institutional stewardship.\n\n"
                "Across all audiences, ambassadors should define terms early, avoid legal shorthand, and return to shared civic principles rather than current partisan disputes."
            )
            generated_scaffolding.append("Audience adaptation guidance was generated to support delivery.")
        elif title == "Handling Questions and Difficult Conversations":
            body = (
                "When a conversation becomes political, the ambassador's task is not to referee ideology. The task is to return the discussion to constitutional process, fairness, equal application of law, and the institutions that allow disagreement to remain peaceful.\n\n"
                "Helpful moves include acknowledging the concern, clarifying the question, distinguishing principle from policy preference, and redirecting toward the Rule of Law as a shared civic framework."
            )
            generated_scaffolding.append("Difficult-conversation guidance was generated from delivery best practices.")
        elif title == "Ambassador Toolkit":
            body = (
                "A useful toolkit helps ambassadors stay concise, accurate, and prepared. At minimum, it should include a clear definition, a short explanation of why the Rule of Law matters, "
                "audience-appropriate examples, and a few trusted follow-up resources.\n\n"
                f"{self._summaries(relevant_units, limit=1)}"
            )
            generated_scaffolding.append("Toolkit framing was generated for practical use.")
        elif title == "Arizona-Specific Civic Resources":
            body = (
                "Arizona-specific resources should help ambassadors connect legal principles to local civic institutions and trusted educational partners. "
                "Where exact URLs or program details are still being finalized, placeholders should remain clearly labeled for staff review.\n\n"
                f"{self._summaries(relevant_units, limit=1)}"
            )
            generated_scaffolding.append("Arizona resource framing includes generated placeholder guidance for staff editing.")
        elif title == "Presentation Preparation Checklist":
            body = (
                "Preparation matters because strong civic teaching is both substantive and practical. A well-prepared ambassador understands the material, anticipates the room, and knows how to keep the conversation respectful and useful."
            )
            generated_scaffolding.append("Checklist framing was generated for usability.")
        elif title == "Appendices":
            body = (
                "The appendices collect concise reference texts and definitions that ambassadors may want to quote, adapt, or keep on hand while preparing talks and trainings.\n\n"
                f"{self._summaries(relevant_units, limit=2)}"
            )
            generated_scaffolding.append("Appendix introduction was generated for readability.")
        else:
            paragraphs = []
            seen: set[str] = set()
            for unit in relevant_units[:5]:
                if unit.summary not in seen:
                    paragraphs.append(unit.summary)
                    seen.add(unit.summary)
            body = "\n\n".join(paragraphs[:4]) if paragraphs else "Section narrative should be refined once additional supported content is available."
            if not paragraphs:
                generated_scaffolding.append("This section currently relies on generated placeholder guidance because supported content was sparse.")

        callouts = self._build_callouts(title, relevant_units)
        checklists = self._build_checklists(title)
        pull_quotes = [quote for unit in relevant_units for quote in unit.quotes][:2]
        source_support = [unit.canonical_id for unit in relevant_units[:8]]
        return ManualSection(
            section_id=section_id,
            title=title,
            body_markdown=strip_structural_noise(body),
            callouts=callouts,
            checklists=checklists,
            pull_quotes=pull_quotes,
            source_support=source_support,
            generated_scaffolding=generated_scaffolding,
        )

    def _fallback_units(self, title: str, units: list[CanonicalUnit]) -> list[CanonicalUnit]:
        keywords = SECTION_KEYWORDS.get(title, [])
        fallback = []
        for unit in units:
            if not unit.validation.supported:
                continue
            combined = f"{unit.title} {unit.summary}".lower()
            if any(keyword in combined for keyword in keywords):
                fallback.append(unit)
        return fallback[:6]

    def _summaries(self, units: list[CanonicalUnit], limit: int = 2) -> str:
        summaries = []
        for unit in units:
            cleaned = strip_structural_noise(unit.summary)
            if cleaned and cleaned not in summaries:
                summaries.append(cleaned)
            if len(summaries) >= limit:
                break
        return "\n\n".join(summaries)

    def _usable_units(self, units: list[CanonicalUnit]) -> list[CanonicalUnit]:
        blocked_titles = {
            "ARIZONA RULE OF LAW",
            "Presentation Formats",
            "How to Use This Guide",
        }
        blocked_fragments = [
            "hitler",
            "franco",
            "stalin",
            "beyond your bubble",
            "9 ways to respond",
            "toci",
            "96% of democrats",
            "task force met twice",
        ]
        cleaned = []
        for unit in sorted(units, key=lambda item: (min([3] + [1 if "Combined files" in source else 2 for source in item.supporting_sources]), item.title)):
            if unit.title in blocked_titles or unit.title.startswith("SLIDE "):
                continue
            summary_lower = unit.summary.lower()
            title_lower = unit.title.lower()
            if any(fragment in summary_lower or fragment in title_lower for fragment in blocked_fragments):
                continue
            cleaned.append(unit)
        return cleaned

    def _polish_manual(self, manual: ManualArtifact) -> ManualArtifact:
        blocked_quote_fragments = ["bubble", "9 ways to respond", "commented", "formatted:"]
        for section in manual.sections:
            section.body_markdown = strip_structural_noise(normalize_whitespace(section.body_markdown))
            section.callouts = [strip_structural_noise(normalize_whitespace(callout)) for callout in section.callouts if callout.strip()]
            section.pull_quotes = [
                normalize_whitespace(quote)
                for quote in section.pull_quotes
                if quote.strip() and not any(fragment in quote.lower() for fragment in blocked_quote_fragments)
            ][:2]
            if section.title == "What the Rule of Law Is":
                paragraphs = [part.strip() for part in section.body_markdown.split("\n\n") if part.strip()]
                remainder = [
                    part
                    for part in paragraphs[1:]
                    if "the rule of law is defined by four core principles" not in part.lower()
                ]
                section.body_markdown = "\n\n".join([STANDARD_RULE_OF_LAW_DEFINITION, *remainder[:2]])
            elif section.title == "Core Principles of the Rule of Law":
                section.body_markdown = (
                    "The Rule of Law is often explained through four connected principles that make the concept concrete in public life.\n\n"
                    "Accountability means public officials and private actors alike remain subject to law. "
                    "Just law means laws should be clear, publicized, stable, and protective of fundamental rights. "
                    "Open government means legal rules and decision-making processes should be transparent. "
                    "Accessible, impartial justice means disputes should be resolved fairly by competent, ethical, and independent decision-makers."
                )
                section.callouts = [
                    "Together, these four principles show that the Rule of Law is about more than having rules on paper. It is about how power is limited, how rights are protected, and how justice is actually administered."
                ]
            elif section.title in {"Why Lawyers Must Lead", "The Ambassador Role", "Introductory Letter from Ted Schmidt"}:
                section.body_markdown = section.body_markdown.replace(
                    "In an era of heightened polarization, lawyers can lead by establishing ground rules for respectful conversation, focusing on listening and understanding rather than persuading or winning arguments.",
                    "In periods of civic disagreement, lawyers can lead by establishing ground rules for respectful conversation, focusing on listening and understanding rather than persuading or winning arguments.",
                )
            elif section.title == "What Happens When It Weakens":
                section.body_markdown = (
                    "When the Rule of Law weakens, public confidence in fairness and accountability weakens with it. Rights become less secure, institutions lose legitimacy, and civic disagreement is more likely to be treated as a contest of power rather than a process governed by rules.\n\n"
                    "People begin to doubt whether the same rules apply to everyone. Public decisions can feel less transparent, lawful outcomes less predictable, and institutions less worthy of trust. Over time, that erosion makes it harder for communities to resolve conflict peacefully, to trust public authority, and to believe that rights will be protected consistently.\n\n"
                    "These changes often appear gradually rather than all at once. That is why ambassadors should help audiences recognize the everyday value of lawful process before its absence becomes more visible and more damaging."
                )
        return manual

    def _build_callouts(self, title: str, units: list[CanonicalUnit]) -> list[str]:
        if title == "Core Principles of the Rule of Law":
            principle_units = [unit for unit in units if "principle" in unit.summary.lower() or "accountability" in unit.summary.lower()]
            if principle_units:
                return [principle_units[0].summary]
        if title == "Why Lawyers Must Lead":
            return ["Lawyers serve the public not only by advising clients, but by strengthening the civic culture that makes rights, process, and accountability meaningful."]
        return []

    def _build_checklists(self, title: str) -> list[ManualChecklist]:
        if title == "Ambassador Toolkit":
            return [
                ManualChecklist(
                    title="Toolkit Essentials",
                    items=[
                        "A clear plain-English definition of the Rule of Law",
                        "A short explanation of why it matters in everyday civic life",
                        "A few audience-appropriate examples that stay nonpartisan",
                        "A closing invitation to learn more and stay engaged",
                    ],
                )
            ]
        if title == "Presentation Preparation Checklist":
            return [
                ManualChecklist(
                    title="Before You Present",
                    items=[
                        "Confirm audience type, room format, and time available.",
                        "Review the four core principles and your opening definition.",
                        "Choose one or two examples that fit the audience and remain nonpartisan.",
                        "Prepare a calm redirect for politically framed questions.",
                        "Bring resource links or handouts for follow-up.",
                    ],
                )
            ]
        if title == "Handling Questions and Difficult Conversations":
            return [
                ManualChecklist(
                    title="Redirection Checklist",
                    items=[
                        "Acknowledge the question respectfully.",
                        "Separate principle from current political disagreement.",
                        "Return to fairness, accountability, process, and equal application of law.",
                        "Invite follow-up resources if the question goes beyond the session's scope.",
                    ],
                )
            ]
        return []

    def _manual_to_markdown(self, manual: ManualArtifact) -> str:
        parts = [f"# {manual.title}", ""]
        for section in manual.sections:
            parts.append(f"## {section.title}")
            parts.append("")
            parts.append(section.body_markdown)
            if section.callouts:
                parts.append("")
                parts.append("**Callouts**")
                for callout in section.callouts:
                    parts.append(f"- {callout}")
            if section.checklists:
                for checklist in section.checklists:
                    parts.append("")
                    parts.append(f"**{checklist.title}**")
                    for item in checklist.items:
                        parts.append(f"- {item}")
            if section.pull_quotes:
                parts.append("")
                parts.append("**Pull Quotes**")
                for quote in section.pull_quotes:
                    parts.append(f"> {quote}")
            parts.append("")
        return "\n".join(parts).strip() + "\n"
