from __future__ import annotations

import json
import logging
import re
from pathlib import Path

from pipelines.model_clients import ModelRouter
from pipelines.renderers import write_deck_pptx
from pipelines.schemas import DeckArtifact, DeliverableTrace, DeliverableTraceUnit, ManualArtifact, SlideArtifact
from pipelines.settings import SettingsBundle
from pipelines.utils import choose_top_sentences, dump_json, dump_text, ensure_dir, normalize_whitespace, read_text, strip_structural_noise


LOGGER = logging.getLogger(__name__)


SLIDE_TO_SECTION = {
    "Title": ["Introductory Letter from Ted Schmidt"],
    "Why We're Here": ["Why the Rule of Law Matters", "Arizona-Specific Civic Resources"],
    "What Is the Rule of Law?": ["What the Rule of Law Is"],
    "Why It Matters": ["Why the Rule of Law Matters"],
    "Core Principle 1": ["Core Principles of the Rule of Law"],
    "Core Principle 2": ["Core Principles of the Rule of Law"],
    "Core Principle 3": ["Core Principles of the Rule of Law"],
    "Core Principle 4": ["Core Principles of the Rule of Law"],
    "What Happens When It Weakens": ["What Happens When It Weakens"],
    "Why Lawyers Must Lead": ["Why Lawyers Must Lead"],
    "The Ambassador Role": ["The Ambassador Role"],
    "Communicating Effectively": ["How to Communicate the Rule of Law Effectively", "Audience-Specific Communication Tips"],
    "What Citizens Can Do": ["Ambassador Toolkit"],
    "Arizona-Specific Resources": ["Arizona-Specific Civic Resources"],
    "Call to Action": ["Ambassador Toolkit", "Arizona-Specific Civic Resources"],
    "Closing / Additional Resources": ["How to Use This Manual", "Appendices"],
}


VISUAL_HINTS = {
    "Title": "Arizona desert horizon watermark, subtle constitutional icon, and strong title treatment.",
    "Why We're Here": "Courthouse or civic gathering imagery with Arizona color accents.",
    "What Is the Rule of Law?": "Simple icon set showing fairness, rules, and institutions.",
    "Why It Matters": "People, institutions, and public trust connected through clean civic graphics.",
    "Core Principle 1": "Accountability icon paired with concise definition.",
    "Core Principle 2": "Clear laws and rights imagery with gold accent rule.",
    "Core Principle 3": "Open-government motif with document or public-record visual.",
    "Core Principle 4": "Balanced justice imagery with accessible courts framing.",
    "What Happens When It Weakens": "Muted warning slide with institutional stress imagery, not alarmist.",
    "Why Lawyers Must Lead": "Professional oath or courthouse detail with public-service framing.",
    "The Ambassador Role": "Speaker silhouette, classroom or community audience, restrained civic branding.",
    "Communicating Effectively": "Conversation flow visual with audience-centered prompts.",
    "What Citizens Can Do": "Checklist or path graphic showing civic action steps.",
    "Arizona-Specific Resources": "Arizona map, local civic institutions, and resource cards.",
    "Call to Action": "Clean close with organization placeholders and space for live links.",
    "Closing / Additional Resources": "Quiet closing slide with contact and further-reading area.",
}

SLIDE_BRIEFS = {
    "Title": "Program opener that establishes credibility, tone, and civic purpose.",
    "Why We're Here": "Set the stakes and explain why civic understanding matters now.",
    "What Is the Rule of Law?": "Give the plain-English definition the audience should remember.",
    "Why It Matters": "Translate the principle into public value and everyday relevance.",
    "Core Principle 1": "Land accountability as a memorable first pillar.",
    "Core Principle 2": "Land clarity, stability, and rights-protection as the second pillar.",
    "Core Principle 3": "Land transparency as a public-trust pillar.",
    "Core Principle 4": "Land fair, impartial access to justice as the fourth pillar.",
    "What Happens When It Weakens": "Show consequences without sounding alarmist or partisan.",
    "Why Lawyers Must Lead": "Frame lawyers as civic translators and stewards of lawful process.",
    "The Ambassador Role": "Clarify what the speaker is there to do and not do.",
    "Communicating Effectively": "Give the audience and speaker a clean communication framework.",
    "What Citizens Can Do": "Offer practical civic actions for nonlawyers.",
    "Arizona-Specific Resources": "Point to trusted Arizona institutions and follow-up paths.",
    "Call to Action": "End with a concrete public-service invitation and partner placeholders.",
    "Closing / Additional Resources": "Close calmly and direct people to follow-up materials.",
}

BODY_OVERRIDES = {
    "Title": ["Ambassador Program"],
    "Why We're Here": [
        "Build civic understanding.",
        "Protect fair process.",
        "Keep trust anchored in law.",
    ],
    "What Is the Rule of Law?": [
        "Rules over arbitrary power.",
        "Fair process over favoritism.",
        "Rights protected through accountable institutions.",
    ],
    "Why It Matters": [
        "It protects liberty.",
        "It disciplines power.",
        "It keeps disagreement peaceful.",
    ],
    "Core Principle 1": [
        "Accountability",
        "No person or institution is above the law.",
    ],
    "Core Principle 2": [
        "Just Law",
        "Laws should be clear, public, stable, and rights-protecting.",
    ],
    "Core Principle 3": [
        "Open Government",
        "Legal rules and processes should be transparent.",
    ],
    "Core Principle 4": [
        "Accessible, Impartial Justice",
        "Disputes should be resolved fairly by independent decision-makers.",
    ],
    "What Happens When It Weakens": [
        "Trust erodes.",
        "Rights feel less secure.",
        "Power starts replacing process.",
    ],
    "Why Lawyers Must Lead": [
        "Explain the principle.",
        "Model civic restraint.",
        "Defend lawful process.",
    ],
    "The Ambassador Role": [
        "Clarify the issue.",
        "Stay nonpartisan.",
        "Invite civic responsibility.",
    ],
    "Communicating Effectively": [
        "Start in plain English.",
        "Use examples people recognize.",
        "Return to shared principles.",
    ],
    "What Citizens Can Do": [
        "Learn the principle.",
        "Expect fair process.",
        "Use trusted civic institutions.",
    ],
    "Arizona-Specific Resources": [
        "State Bar of Arizona",
        "Arizona Bar Foundation [placeholder]",
        "O'Connor Institute [placeholder]",
    ],
    "Call to Action": [
        "Teach the principle.",
        "Model respectful civic dialogue.",
        "Arizona Bar Foundation: [link]",
        "O'Connor Institute: [link]",
    ],
    "Closing / Additional Resources": [
        "Teach the principle.",
        "Protect fair process.",
        "Keep the conversation civic.",
    ],
}

SLIDE_QUOTES = {
    "Why We're Here": "I do solemnly swear (or affirm) that I will support the constitution and laws of the United States and the State of Arizona.",
    "What Is the Rule of Law?": "If we don't protect the Rule of Law, we cannot expect the law to protect us.",
    "Arizona-Specific Resources": "I do solemnly swear (or affirm) that I will support the constitution and laws of the United States and the State of Arizona.",
}


class DeckGenerator:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.manual_path = root_dir / "outputs" / "intermediate" / "manual.json"
        self.output_dir = ensure_dir(root_dir / "outputs" / "deck_src")
        self.intermediate_dir = ensure_dir(root_dir / "outputs" / "intermediate")
        self.prompts_dir = root_dir / settings.pipeline.directories["prompts"]

    def run(self) -> DeckArtifact:
        if not self.manual_path.exists():
            raise FileNotFoundError("Run manual generation before deck generation.")
        manual = ManualArtifact.model_validate(json.loads(self.manual_path.read_text(encoding="utf-8")))
        deck = self._build_deck(manual)
        trace = DeliverableTrace(
            deliverable_id="deck",
            artifact_type="presentation_deck",
            generated_at=__import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
            units=[
                DeliverableTraceUnit(unit_id=f"slide_{slide.slide_number}", title=slide.title, source_support=slide.source_support)
                for slide in deck.slides
            ],
        )
        dump_json(self.intermediate_dir / "deck.json", deck.model_dump())
        dump_text(self.root_dir / self.settings.pipeline.packaging["deck_markdown"], self._deck_to_markdown(deck))
        dump_json(self.root_dir / self.settings.pipeline.packaging["deck_trace"], trace.model_dump())
        write_deck_pptx(deck, self.root_dir / self.settings.pipeline.packaging["deck_pptx"])
        return deck

    def _build_deck(self, manual: ManualArtifact) -> DeckArtifact:
        deterministic = DeckArtifact(slides=[self._build_slide(index + 1, title, manual) for index, title in enumerate(self.settings.pipeline.deck_structure)])
        if not self.router.is_route_live("deck_generation"):
            return self._polish_deck(deterministic)
        prompt = read_text(self.prompts_dir / "deck_generation.txt")
        user_prompt = json.dumps(
            {
                "slide_sequence": self.settings.pipeline.deck_structure,
                "slide_briefs": SLIDE_BRIEFS,
                "slides": [slide.model_dump() for slide in deterministic.slides],
                "manual_sections": [section.model_dump() for section in manual.sections],
                "design_direction": {
                    "palette": ["#AB1827", "#F5BB42", "#16294B", "#F4ECDB"],
                    "visual_language": "Arizona desert watermark, civic polish, clean sans-serif, restrained justice iconography",
                },
            },
            indent=2,
        )
        model_result = self.router.try_generate_json("deck_generation", prompt, user_prompt)
        if model_result and "slides" in model_result:
            try:
                return self._polish_deck(DeckArtifact(slides=[SlideArtifact.model_validate(item) for item in model_result["slides"]]))
            except Exception:  # noqa: BLE001
                LOGGER.warning("API deck result failed validation, using deterministic deck.")
        return self._polish_deck(deterministic if not model_result or "slides" not in model_result else DeckArtifact(slides=[SlideArtifact.model_validate(item) for item in model_result["slides"]]))

    def _build_slide(self, slide_number: int, title: str, manual: ManualArtifact) -> SlideArtifact:
        relevant_sections = [section for section in manual.sections if section.title in SLIDE_TO_SECTION[title]]
        combined_text = strip_structural_noise("\n\n".join(section.body_markdown for section in relevant_sections))
        lines = list(BODY_OVERRIDES.get(title, []))
        if not lines:
            for sentence in choose_top_sentences(combined_text, limit=4):
                cleaned = re.sub(r"\s*\([^)]*\)", "", sentence).strip()
                cleaned = cleaned.replace("\n", " ")
                if len(cleaned) > 100:
                    cleaned = cleaned[:97].rstrip() + "..."
                if cleaned and cleaned not in lines:
                    lines.append(cleaned)
        speaker_notes = self._build_speaker_notes(title, relevant_sections)
        optional_quote = self._select_optional_quote(title, relevant_sections)
        source_support = [section.section_id for section in relevant_sections]
        return SlideArtifact(
            slide_number=slide_number,
            title=title,
            body_lines=lines[: self.settings.pipeline.qa["max_bullets_per_slide"]],
            speaker_notes=speaker_notes,
            visual_suggestion=VISUAL_HINTS[title],
            optional_quote=optional_quote,
            source_support=source_support,
        )

    def _deck_to_markdown(self, deck: DeckArtifact) -> str:
        parts = ["# Arizona Rule of Law Ambassador Deck", ""]
        for slide in deck.slides:
            parts.append(f"## Slide {slide.slide_number}: {slide.title}")
            for line in slide.body_lines:
                parts.append(f"- {line}")
            parts.append("")
            parts.append("**Speaker Notes**")
            parts.append(slide.speaker_notes)
            parts.append("")
            parts.append(f"**Visual Suggestion**: {slide.visual_suggestion}")
            if slide.optional_quote:
                parts.append(f"**Optional Quote**: {slide.optional_quote}")
            parts.append("")
        return "\n".join(parts).strip() + "\n"

    def _polish_deck(self, deck: DeckArtifact) -> DeckArtifact:
        for slide in deck.slides:
            slide.title = normalize_whitespace(slide.title)
            slide.body_lines = [normalize_whitespace(line) for line in slide.body_lines if line.strip()][:4]
            slide.speaker_notes = strip_structural_noise(normalize_whitespace(slide.speaker_notes))
            slide.visual_suggestion = normalize_whitespace(slide.visual_suggestion)
            if slide.optional_quote:
                slide.optional_quote = normalize_whitespace(slide.optional_quote)
        return deck

    def _build_speaker_notes(self, title: str, relevant_sections: list) -> str:
        raw_notes = strip_structural_noise("\n\n".join(section.body_markdown for section in relevant_sections))
        curated_notes = {
            "Title": (
                "Welcome the audience and frame the session as a civic conversation, not a political debate. "
                "Explain that the presentation will define the Rule of Law, show why it matters in daily public life, "
                "and offer practical ways to discuss it constructively in Arizona communities."
            ),
            "Why We're Here": (
                "Emphasize that the goal is not to win an argument, but to strengthen public understanding of the rules, "
                "institutions, and habits that let disagreement stay peaceful. Connect the session to public trust, "
                "fair process, and the legal profession's service role."
            ),
            "What Is the Rule of Law?": (
                "Give the plain-English definition first, then pause. Make clear that the Rule of Law is about how power is exercised, "
                "how rights are protected, and how fairness becomes reliable instead of discretionary."
            ),
            "Why It Matters": (
                "Translate the principle into everyday value: stable expectations, fair treatment, and a way to resolve disagreement "
                "without force or favoritism. Keep the tone civic and concrete."
            ),
            "What Happens When It Weakens": (
                "Avoid alarmist examples. Focus on the steady civic consequences: less trust, less confidence in fairness, "
                "and more temptation to treat power as the answer."
            ),
            "Why Lawyers Must Lead": (
                "Frame lawyers as translators and stewards, not as partisan advocates. Connect professional duty, oath, "
                "and public service in accessible language."
            ),
            "The Ambassador Role": (
                "Clarify that ambassadors explain, model, and invite reflection. They do not referee current political disputes "
                "or offer partisan talking points."
            ),
            "Communicating Effectively": (
                "Encourage the speaker to define terms early, use familiar examples, and keep returning to fairness, accountability, "
                "and equal application of law when questions drift."
            ),
            "What Citizens Can Do": (
                "Make the close practical. Audiences do not need a law degree to support fair process, ask better questions, "
                "and use trusted civic institutions."
            ),
            "Arizona-Specific Resources": (
                "Name the organizations slowly and invite follow-up. If live links or local event details are available, "
                "this is the place to personalize them."
            ),
            "Call to Action": (
                "Close with one clear invitation: teach the principle, model constructive dialogue, and connect others to trusted institutions. "
                "This should sound like a public-service invitation, not a campaign ask."
            ),
            "Closing / Additional Resources": (
                "End calmly and confidently. Point the audience to the manual, handout, and Arizona resources for continued learning."
            ),
        }
        if title in curated_notes:
            return curated_notes[title]
        return raw_notes[:1800]

    def _select_optional_quote(self, title: str, relevant_sections: list) -> str | None:
        if title in SLIDE_QUOTES:
            return SLIDE_QUOTES[title]
        unique_quotes: list[str] = []
        for section in relevant_sections:
            for quote in section.pull_quotes:
                if quote and quote not in unique_quotes and len(quote.split()) > 3:
                    unique_quotes.append(quote)
        return unique_quotes[0] if unique_quotes and title in {"Closing / Additional Resources"} else None
