from __future__ import annotations

import json
import logging
from pathlib import Path

from pipelines.model_clients import ModelRouter
from pipelines.renderers import write_field_guide_docx, write_handout_docx, write_simple_pdf
from pipelines.schemas import (
    DeliverableTrace,
    DeliverableTraceUnit,
    FieldGuideArtifact,
    FieldGuideBlock,
    FieldGuideVersion,
    HandoutArtifact,
    HandoutSection,
    ManualArtifact,
    NormalizedChunk,
)
from pipelines.settings import SettingsBundle
from pipelines.utils import choose_top_sentences, dump_json, dump_text, ensure_dir, normalize_whitespace, read_text, stable_id, strip_structural_noise, word_count


LOGGER = logging.getLogger(__name__)

STANDARD_RULE_OF_LAW_DEFINITION = (
    "The Rule of Law means power is exercised through known rules and fair institutions rather than arbitrary will. "
    "In practice, that means everyone, including public officials, is subject to the same law; laws are clear and public; "
    "and disputes are handled through fair, accountable processes rather than favoritism or force."
)


VERSION_PLANS = {
    20: [
        ("Opening and Purpose", 2, ["Introductory Letter from Ted Schmidt"]),
        ("What the Rule of Law Is", 4, ["What the Rule of Law Is", "Core Principles of the Rule of Law"]),
        ("Why It Matters", 5, ["Why the Rule of Law Matters", "What Happens When It Weakens"]),
        ("Why Lawyers Must Lead", 4, ["Why Lawyers Must Lead", "The Ambassador Role"]),
        ("Communicating with the Audience", 3, ["How to Communicate the Rule of Law Effectively"]),
        ("Closing and Call to Action", 2, ["Ambassador Toolkit", "Arizona-Specific Civic Resources"]),
    ],
    45: [
        ("Opening and Purpose", 4, ["Introductory Letter from Ted Schmidt"]),
        ("Program Orientation", 4, ["How to Use This Manual"]),
        ("Definition and Core Concepts", 7, ["What the Rule of Law Is"]),
        ("Four Core Principles", 7, ["Core Principles of the Rule of Law"]),
        ("Why It Matters", 6, ["Why the Rule of Law Matters"]),
        ("What Happens When It Weakens", 5, ["What Happens When It Weakens"]),
        ("Why Lawyers Must Lead", 5, ["Why Lawyers Must Lead", "The Ambassador Role"]),
        ("Communicating Effectively", 4, ["How to Communicate the Rule of Law Effectively", "Audience-Specific Communication Tips"]),
        ("Toolkit and Resources", 3, ["Ambassador Toolkit", "Arizona-Specific Civic Resources"]),
    ],
    60: [
        ("Opening and Purpose", 5, ["Introductory Letter from Ted Schmidt"]),
        ("How to Use the Session", 4, ["How to Use This Manual"]),
        ("Definition and Core Concepts", 8, ["What the Rule of Law Is"]),
        ("Principle One and Two", 7, ["Core Principles of the Rule of Law"]),
        ("Principle Three and Four", 7, ["Core Principles of the Rule of Law"]),
        ("Why It Matters", 7, ["Why the Rule of Law Matters"]),
        ("What Happens When It Weakens", 6, ["What Happens When It Weakens"]),
        ("Why Lawyers Must Lead", 6, ["Why Lawyers Must Lead", "The Ambassador Role"]),
        ("Audience Engagement and Discussion", 5, ["How to Communicate the Rule of Law Effectively", "Handling Questions and Difficult Conversations"]),
        ("Toolkit, Resources, and Close", 5, ["Ambassador Toolkit", "Arizona-Specific Civic Resources"]),
    ],
}


class FieldGuideGenerator:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.manual_path = root_dir / "outputs" / "intermediate" / "manual.json"
        self.normalized_path = root_dir / settings.pipeline.directories["normalized"] / "chunks.json"
        self.intermediate_dir = ensure_dir(root_dir / "outputs" / "intermediate")
        self.prompts_dir = root_dir / settings.pipeline.directories["prompts"]

    def run(self) -> tuple[FieldGuideArtifact, HandoutArtifact]:
        if not self.manual_path.exists():
            raise FileNotFoundError("Run manual generation before field guide generation.")
        manual = ManualArtifact.model_validate(json.loads(self.manual_path.read_text(encoding="utf-8")))
        normalized_chunks = []
        if self.normalized_path.exists():
            normalized_chunks = [NormalizedChunk.model_validate(item) for item in json.loads(self.normalized_path.read_text(encoding="utf-8"))["chunks"]]
        field_guide, handout = self._build_outputs(manual, normalized_chunks)
        field_trace = DeliverableTrace(
            deliverable_id="field_guide",
            artifact_type="speaker_field_guide",
            generated_at=__import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
            units=[
                DeliverableTraceUnit(
                    unit_id=f"field_{version.minutes}",
                    title=f"{version.minutes}-minute field guide",
                    source_support=sorted({support for block in version.blocks for support in block.source_support}),
                )
                for version in field_guide.versions
            ],
        )
        handout_trace = DeliverableTrace(
            deliverable_id="handout",
            artifact_type="audience_handout",
            generated_at=field_trace.generated_at,
            units=[
                DeliverableTraceUnit(unit_id=stable_id(section.title, prefix="handout"), title=section.title, source_support=section.source_support)
                for section in handout.sections
            ],
        )
        dump_json(self.intermediate_dir / "field_guide.json", field_guide.model_dump())
        dump_json(self.intermediate_dir / "handout.json", handout.model_dump())
        dump_text(self.root_dir / "outputs" / "field_guide" / "arizona_rule_of_law_field_guide.md", self._field_guide_to_markdown(field_guide))
        dump_text(self.root_dir / "outputs" / "handout" / "arizona_rule_of_law_handout.md", self._handout_to_markdown(handout))
        dump_json(self.root_dir / self.settings.pipeline.packaging["field_guide_trace"], field_trace.model_dump())
        dump_json(self.root_dir / self.settings.pipeline.packaging["handout_trace"], handout_trace.model_dump())
        write_field_guide_docx(field_guide, self.root_dir / self.settings.pipeline.packaging["field_guide_docx"])
        write_simple_pdf(
            "Arizona Rule of Law Ambassador Speaker Field Guide",
            self._field_guide_pdf_sections(field_guide),
            self.root_dir / self.settings.pipeline.packaging["field_guide_pdf"],
        )
        write_handout_docx(handout, self.root_dir / self.settings.pipeline.packaging["handout_docx"])
        write_simple_pdf(handout.title, [(section.title, section.body) for section in handout.sections], self.root_dir / self.settings.pipeline.packaging["handout_pdf"])
        return field_guide, handout

    def _build_outputs(self, manual: ManualArtifact, normalized_chunks: list[NormalizedChunk]) -> tuple[FieldGuideArtifact, HandoutArtifact]:
        deterministic_field_guide = FieldGuideArtifact(versions=[self._build_version(minutes, manual, normalized_chunks) for minutes in self.settings.pipeline.qa["field_guide_required_versions"]])
        deterministic_handout = self._build_handout(manual)
        if not self.router.is_route_live("field_guide_generation"):
            return self._polish_field_guide(deterministic_field_guide), self._polish_handout(deterministic_handout, manual)
        prompt = read_text(self.prompts_dir / "field_guide_generation.txt")
        script_evidence = [
            {
                "source": chunk.source_filename,
                "heading": chunk.heading_path[-1] if chunk.heading_path else "",
                "text": chunk.text[:900],
            }
            for chunk in normalized_chunks
            if "speaker" in chunk.source_filename.lower() or chunk.content_type == "script"
        ][:12]
        user_prompt = json.dumps(
            {
                "field_guide": deterministic_field_guide.model_dump(),
                "handout": deterministic_handout.model_dump(),
                "manual_sections": [section.model_dump() for section in manual.sections],
                "script_evidence": script_evidence,
            },
            indent=2,
        )
        model_result = self.router.try_generate_json("field_guide_generation", prompt, user_prompt)
        if model_result:
            try:
                field_guide = FieldGuideArtifact.model_validate(model_result["field_guide"])
                handout = HandoutArtifact.model_validate(model_result["handout"])
                return self._polish_field_guide(self._ensure_required_versions(field_guide, deterministic_field_guide)), self._polish_handout(handout, manual)
            except Exception:  # noqa: BLE001
                LOGGER.warning("API field guide result failed validation, using deterministic draft.")
        return self._polish_field_guide(self._ensure_required_versions(deterministic_field_guide, deterministic_field_guide)), self._polish_handout(deterministic_handout, manual)

    def _build_version(self, minutes: int, manual: ManualArtifact, normalized_chunks: list[NormalizedChunk]) -> FieldGuideVersion:
        script_chunks = [chunk for chunk in normalized_chunks if "speaker" in chunk.source_filename.lower() or chunk.content_type == "script"]
        blocks = []
        for title, block_minutes, section_titles in VERSION_PLANS[minutes]:
            sections = [section for section in manual.sections if section.title in section_titles]
            combined = strip_structural_noise("\n\n".join(section.body_markdown for section in sections))
            script_support = "\n\n".join(chunk.text for chunk in script_chunks if any(keyword.lower() in chunk.text.lower() for keyword in title.split()))
            chosen = choose_top_sentences(f"{combined}\n\n{script_support}", limit=4)
            script = " ".join(chosen) or combined[:800]
            transition = self._transition_for_block(title)
            engagement_prompt = self._engagement_prompt_for_block(title)
            likely_questions = self._likely_questions_for_block(title)
            speaker_tip = self._speaker_tip_for_block(title)
            blocks.append(
                FieldGuideBlock(
                    title=title,
                    minutes=block_minutes,
                    script=script,
                    transition=transition,
                    engagement_prompt=engagement_prompt,
                    likely_questions=likely_questions,
                    speaker_tip=speaker_tip,
                    source_support=[section.section_id for section in sections],
                )
            )
        return FieldGuideVersion(minutes=minutes, blocks=blocks)

    def _build_handout(self, manual: ManualArtifact) -> HandoutArtifact:
        section_map = {section.title: section for section in manual.sections}
        sections = [
            HandoutSection(
                title="What the Rule of Law Means",
                body=" ".join(choose_top_sentences(strip_structural_noise(section_map["What the Rule of Law Is"].body_markdown), limit=2)),
                source_support=[section_map["What the Rule of Law Is"].section_id],
            ),
            HandoutSection(
                title="Four Core Principles",
                body=" ".join(choose_top_sentences(strip_structural_noise(section_map["Core Principles of the Rule of Law"].body_markdown), limit=3)),
                source_support=[section_map["Core Principles of the Rule of Law"].section_id],
            ),
            HandoutSection(
                title="Why It Matters",
                body=" ".join(choose_top_sentences(strip_structural_noise(section_map["Why the Rule of Law Matters"].body_markdown), limit=2))
                + " It helps people trust that rights, duties, and disputes will be handled through fair process rather than arbitrary power.",
                source_support=[section_map["Why the Rule of Law Matters"].section_id],
            ),
            HandoutSection(
                title="What Citizens Can Do",
                body="Stay informed, support fair processes, engage respectfully, and use trusted civic institutions when questions or disputes arise. Ask how rules are made, whether they are applied fairly, and whether disagreements are being handled through lawful process instead of raw pressure or favoritism.",
                source_support=[section_map["Ambassador Toolkit"].section_id],
            ),
            HandoutSection(
                title="Arizona Resources",
                body="Arizona Bar Foundation [link]\n\nSandra Day O'Connor Institute [link]\n\nState Bar of Arizona [link]\n\nUse these placeholders for staff-reviewed links, event contacts, and audience follow-up resources.",
                source_support=[section_map["Arizona-Specific Civic Resources"].section_id],
            ),
        ]
        handout = HandoutArtifact(title="Arizona Rule of Law Ambassador Handout", sections=sections)
        if word_count(self._handout_to_markdown(handout)) > self.settings.pipeline.qa["handout_word_count"]["max"]:
            for section in handout.sections:
                section.body = " ".join(choose_top_sentences(section.body, limit=1))
        return handout

    def _transition_for_block(self, title: str) -> str:
        return {
            "Opening and Purpose": "With that shared purpose in mind, we can define the Rule of Law in plain English.",
            "What the Rule of Law Is": "Once we have the definition in place, we can look at the principles that make it concrete.",
            "Why It Matters": "Those principles matter because they shape everyday civic life, not just legal theory.",
        }.get(title, "That leads naturally to the next part of the conversation.")

    def _engagement_prompt_for_block(self, title: str) -> str:
        return {
            "Opening and Purpose": "Ask the audience what fairness and predictability look like in everyday life.",
            "What the Rule of Law Is": "Invite a short response to the question: what should it mean for no one to be above the law?",
            "Why It Matters": "Ask where people most rely on fair processes in ordinary community life.",
        }.get(title, "Invite the audience to connect the principle to a concrete civic setting.")

    def _likely_questions_for_block(self, title: str) -> list[str]:
        return {
            "What the Rule of Law Is": [
                "Is the Rule of Law the same thing as any law that gets passed?",
                "How is the Rule of Law different from simple majority power?",
            ],
            "Why Lawyers Must Lead": [
                "Why should lawyers speak publicly about this issue?",
                "How do lawyers stay nonpartisan while discussing institutional concerns?",
            ],
        }.get(title, ["How does this principle apply in everyday civic life?"])

    def _speaker_tip_for_block(self, title: str) -> str:
        return {
            "Opening and Purpose": "Set a respectful tone early and avoid implying that the audience already agrees on current events.",
            "Audience Engagement and Discussion": "Acknowledge emotionally charged questions, then redirect to shared constitutional principles and fair process.",
        }.get(title, "Use plain English and return to shared civic principles if the discussion becomes political.")

    def _field_guide_to_markdown(self, field_guide: FieldGuideArtifact) -> str:
        parts = ["# Arizona Rule of Law Ambassador Speaker Field Guide", ""]
        for version in field_guide.versions:
            parts.append(f"## {version.minutes}-Minute Version")
            parts.append("")
            for block in version.blocks:
                parts.append(f"### {block.title} ({block.minutes} min)")
                parts.append(block.script)
                parts.append("")
                parts.append(f"- Transition: {block.transition}")
                parts.append(f"- Engagement prompt: {block.engagement_prompt}")
                parts.append(f"- Speaker tip: {block.speaker_tip}")
                for question in block.likely_questions:
                    parts.append(f"- Likely question: {question}")
                parts.append("")
        return "\n".join(parts).strip() + "\n"

    def _handout_to_markdown(self, handout: HandoutArtifact) -> str:
        parts = [f"# {handout.title}", ""]
        for section in handout.sections:
            parts.append(f"## {section.title}")
            parts.append(section.body)
            parts.append("")
        return "\n".join(parts).strip() + "\n"

    def _field_guide_pdf_sections(self, field_guide: FieldGuideArtifact) -> list[tuple[str, str]]:
        sections = []
        for version in field_guide.versions:
            body_parts = []
            for block in version.blocks:
                body_parts.append(
                    f"{block.title} ({block.minutes} min)\n\n{block.script}\n\nTransition: {block.transition}\n\nAudience prompt: {block.engagement_prompt}\n\nSpeaker tip: {block.speaker_tip}"
                )
            sections.append((f"{version.minutes}-Minute Version", "\n\n".join(body_parts)))
        return sections

    def _polish_field_guide(self, field_guide: FieldGuideArtifact) -> FieldGuideArtifact:
        for version in field_guide.versions:
            for block in version.blocks:
                block.script = strip_structural_noise(normalize_whitespace(block.script))
                block.transition = normalize_whitespace(block.transition)
                block.engagement_prompt = normalize_whitespace(block.engagement_prompt)
                block.speaker_tip = normalize_whitespace(block.speaker_tip)
                block.likely_questions = [normalize_whitespace(question) for question in block.likely_questions]
        return field_guide

    def _polish_handout(self, handout: HandoutArtifact, manual: ManualArtifact) -> HandoutArtifact:
        for section in handout.sections:
            section.body = strip_structural_noise(normalize_whitespace(section.body))
        definition = next((section for section in handout.sections if section.title == "What the Rule of Law Means"), None)
        if definition:
            definition.body = (
                STANDARD_RULE_OF_LAW_DEFINITION
                + " It gives people confidence that the same rules will apply tomorrow as they do today, and that disputes can be addressed through lawful, accountable institutions."
            )
        minimum = self.settings.pipeline.qa["handout_word_count"]["min"]
        total_words = word_count(self._handout_to_markdown(handout))
        if total_words < minimum:
            why_it_matters = next((section for section in handout.sections if section.title == "Why It Matters"), None)
            if why_it_matters:
                why_it_matters.body += " It helps communities know what to expect from institutions and gives people a fair framework for resolving disputes. It also supports civic trust by showing that public power should be exercised through rules, not personal preference or pressure."
            citizens = next((section for section in handout.sections if section.title == "What Citizens Can Do"), None)
            if citizens:
                citizens.body += " Citizens can also ask how local institutions maintain fairness, transparency, and accountability in ordinary civic life. Small actions-like asking questions, sharing trusted resources, and encouraging respectful discussion-help strengthen the civic culture around the Rule of Law."
        total_words = word_count(self._handout_to_markdown(handout))
        if total_words < minimum:
            resources = next((section for section in handout.sections if section.title == "Arizona Resources"), None)
            if resources:
                resources.body += " Staff can customize this section with local presentation contacts, court outreach programs, classroom opportunities, and civic-learning events. These resources give audiences a next step after the presentation and help turn a one-time talk into continued civic learning."
        total_words = word_count(self._handout_to_markdown(handout))
        if total_words < minimum:
            resources = next((section for section in handout.sections if section.title == "Arizona Resources"), None)
            if resources:
                resources.body += " Ambassadors can also add local court tours, volunteer opportunities, and vetted civics materials that help audiences continue learning after the session."
        total_words = word_count(self._handout_to_markdown(handout))
        if total_words < minimum:
            resources = next((section for section in handout.sections if section.title == "Arizona Resources"), None)
            if resources:
                resources.body += " These partners can help audiences find credible next steps."
        return handout

    def _ensure_required_versions(self, candidate: FieldGuideArtifact, fallback: FieldGuideArtifact) -> FieldGuideArtifact:
        required = self.settings.pipeline.qa["field_guide_required_versions"]
        candidate_map = {version.minutes: version for version in candidate.versions}
        fallback_map = {version.minutes: version for version in fallback.versions}
        versions = [candidate_map.get(minutes) or fallback_map[minutes] for minutes in required]
        return FieldGuideArtifact(versions=versions)
