from __future__ import annotations

import json
import logging
import shutil
from pathlib import Path

from pipelines.model_clients import ModelRouter
from pipelines.schemas import (
    DeliverableTrace,
    DeliverableTraceUnit,
    DownloadAsset,
    FieldGuideArtifact,
    HandoutArtifact,
    ManualArtifact,
    ProvenanceEntry,
    QAAnnotation,
    ResourceGroup,
    ResourceLink,
    SpeakerOnlyBlock,
    SpeakerTrack,
    SpeakerTrackStep,
    ToolkitItem,
    WebExperienceArtifact,
    WebPresentation,
    WebScene,
)
from pipelines.settings import SettingsBundle
from pipelines.utils import dump_json, dump_text, ensure_dir, normalize_whitespace, read_text, slugify, stable_id, strip_structural_noise


LOGGER = logging.getLogger(__name__)


SCENE_TO_SECTION = {
    "Opening": ["Introductory Letter from Ted Schmidt"],
    "Why We're Here": ["Why the Rule of Law Matters", "How to Use This Manual"],
    "What Is the Rule of Law?": ["What the Rule of Law Is"],
    "Why It Matters": ["Why the Rule of Law Matters"],
    "Accountability": ["Core Principles of the Rule of Law"],
    "Just Law": ["Core Principles of the Rule of Law"],
    "Open Government": ["Core Principles of the Rule of Law"],
    "Accessible, Impartial Justice": ["Core Principles of the Rule of Law"],
    "What Happens When It Weakens": ["What Happens When It Weakens"],
    "Why Lawyers Must Lead": ["Why Lawyers Must Lead"],
    "The Ambassador Role": ["The Ambassador Role"],
    "Communicating Effectively": ["How to Communicate the Rule of Law Effectively", "Audience-Specific Communication Tips"],
    "What Citizens Can Do": ["Ambassador Toolkit"],
    "Arizona-Specific Resources": ["Arizona-Specific Civic Resources"],
    "Call to Action": ["Ambassador Toolkit", "Arizona-Specific Civic Resources"],
    "Closing / Further Learning": ["How to Use This Manual", "Appendices"],
}

SCENE_KICKERS = {
    "Opening": "Arizona Rule of Law Ambassador Program",
    "Why We're Here": "Civic Purpose",
    "What Is the Rule of Law?": "Plain-English Definition",
    "Why It Matters": "Shared Public Value",
    "Accountability": "Core Principle One",
    "Just Law": "Core Principle Two",
    "Open Government": "Core Principle Three",
    "Accessible, Impartial Justice": "Core Principle Four",
    "What Happens When It Weakens": "Institutional Stakes",
    "Why Lawyers Must Lead": "Professional Duty",
    "The Ambassador Role": "Public Service in Practice",
    "Communicating Effectively": "How to Speak About It",
    "What Citizens Can Do": "Public Role",
    "Arizona-Specific Resources": "Local Institutions",
    "Call to Action": "Closing Invitation",
    "Closing / Further Learning": "Continue the Work",
}

SCENE_VISUALS = {
    "Opening": "Full-bleed Arizona desert horizon with restrained civic typography and a red-gold sun mark.",
    "Why We're Here": "Editorial civic collage with courthouse geometry, desert light, and strong typographic hierarchy.",
    "What Is the Rule of Law?": "Minimal legal iconography with a calm, bright content field and disciplined spacing.",
    "Why It Matters": "Panoramic civic composition with human scale, institutional lines, and warm atmospheric gradient.",
    "Accountability": "Principle chapter slide with oversized numeral, gold rule, and one dominant message.",
    "Just Law": "Principle chapter slide with editorial document texture and clear visual hierarchy.",
    "Open Government": "Principle chapter slide with openness motif, transparency overlays, and desert light.",
    "Accessible, Impartial Justice": "Principle chapter slide with courtroom silhouette, grounded contrast, and generous whitespace.",
    "What Happens When It Weakens": "Muted warning composition with faded institutional forms and tension without alarmism.",
    "Why Lawyers Must Lead": "Confident professional portrait treatment without hero worship; oath and service framing.",
    "The Ambassador Role": "Speaker-in-room composition with audience silhouette and clear facilitation cues.",
    "Communicating Effectively": "Conversation-focused layout with sequence cues and emphasis on listening, clarity, and redirection.",
    "What Citizens Can Do": "Action-oriented editorial checklist with clean civic pathways and practical next steps.",
    "Arizona-Specific Resources": "Resource grid with Arizona map fragments, partner slots, and easy scanning.",
    "Call to Action": "Elegant closing scene with strong CTA hierarchy and partner links anchored at the edge.",
    "Closing / Further Learning": "Quiet final scene with soft horizon, concise recap, and clear follow-up paths.",
}

DISPLAY_LINES = {
    "Opening": ["Defending the Rule of Law", "Arizona's civic commitment"],
    "Why We're Here": ["Build civic understanding.", "Protect fair process.", "Keep trust anchored in law."],
    "What Is the Rule of Law?": ["Rules over arbitrary power.", "Fair process over favoritism.", "Rights protected through accountable institutions."],
    "Why It Matters": ["It protects liberty.", "It disciplines power.", "It keeps disagreement peaceful."],
    "Accountability": ["No person or institution is above the law."],
    "Just Law": ["Laws should be clear, public, stable, and rights-protecting."],
    "Open Government": ["Legal rules and processes should be transparent."],
    "Accessible, Impartial Justice": ["Disputes should be resolved fairly by independent decision-makers."],
    "What Happens When It Weakens": ["Trust erodes.", "Rights feel less secure.", "Power starts replacing process."],
    "Why Lawyers Must Lead": ["Explain the principle.", "Model civic restraint.", "Defend lawful process."],
    "The Ambassador Role": ["Clarify the issue.", "Stay nonpartisan.", "Invite civic responsibility."],
    "Communicating Effectively": ["Start in plain English.", "Use examples people recognize.", "Return to shared principles."],
    "What Citizens Can Do": ["Learn the principle.", "Expect fair process.", "Use trusted civic institutions."],
    "Arizona-Specific Resources": ["State Bar of Arizona", "Arizona Bar Foundation [placeholder]", "O'Connor Institute [placeholder]"],
    "Call to Action": ["Teach the principle.", "Model respectful civic dialogue.", "Connect people to trusted institutions."],
    "Closing / Further Learning": ["Teach the principle.", "Protect fair process.", "Keep the conversation civic."],
}

TRACK_SCENE_TITLES = {
    20: ["Opening", "What Is the Rule of Law?", "Why It Matters", "Why Lawyers Must Lead", "Call to Action", "Closing / Further Learning"],
    45: ["Opening", "Why We're Here", "What Is the Rule of Law?", "Accountability", "Just Law", "Open Government", "Accessible, Impartial Justice", "Why It Matters", "What Happens When It Weakens", "Why Lawyers Must Lead", "Communicating Effectively", "Arizona-Specific Resources", "Call to Action", "Closing / Further Learning"],
    60: ["Opening", "Why We're Here", "What Is the Rule of Law?", "Accountability", "Just Law", "Open Government", "Accessible, Impartial Justice", "Why It Matters", "What Happens When It Weakens", "Why Lawyers Must Lead", "The Ambassador Role", "Communicating Effectively", "What Citizens Can Do", "Arizona-Specific Resources", "Call to Action", "Closing / Further Learning"],
}


class WebExperienceGenerator:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.intermediate_dir = ensure_dir(root_dir / "outputs" / "intermediate")
        self.output_dir = ensure_dir(root_dir / "outputs" / "web_export")
        self.web_generated_dir = ensure_dir(root_dir / "web" / "content" / "generated")
        self.web_downloads_dir = ensure_dir(root_dir / "web" / "public" / "downloads")
        self.prompts_dir = root_dir / settings.pipeline.directories["prompts"]

    def run(self) -> WebExperienceArtifact:
        manual = self._load_artifact("manual.json", ManualArtifact)
        field_guide = self._load_artifact("field_guide.json", FieldGuideArtifact)
        handout = self._load_artifact("handout.json", HandoutArtifact)
        artifact = self._build_artifact(manual, field_guide, handout)
        trace = DeliverableTrace(
            deliverable_id="web_experience",
            artifact_type="web_presentation",
            generated_at=__import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
            units=[
                DeliverableTraceUnit(
                    unit_id=scene.scene_id,
                    title=scene.title,
                    source_support=scene.source_support,
                    generated_scaffolding=scene.generated_scaffolding,
                )
                for scene in artifact.presentation.scenes
            ],
        )

        payload = artifact.model_dump()
        dump_json(self.root_dir / self.settings.pipeline.packaging["web_experience_json"], payload)
        dump_text(self.root_dir / self.settings.pipeline.packaging["web_experience_markdown"], self._to_markdown(artifact))
        dump_json(self.root_dir / self.settings.pipeline.packaging["web_experience_trace"], trace.model_dump())
        dump_json(self.intermediate_dir / "web_experience.json", payload)
        dump_json(self.web_generated_dir / "web-experience.json", payload)
        dump_text(self.web_generated_dir / "web-experience.md", self._to_markdown(artifact))
        self._sync_downloads(artifact)
        return artifact

    def _load_artifact(self, filename: str, model_type):
        path = self.intermediate_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Expected artifact not found: {filename}")
        return model_type.model_validate(json.loads(path.read_text(encoding="utf-8")))

    def _build_artifact(self, manual: ManualArtifact, field_guide: FieldGuideArtifact, handout: HandoutArtifact) -> WebExperienceArtifact:
        deterministic = WebExperienceArtifact(
            presentation=WebPresentation(
                title="Arizona Rule of Law Ambassador Presentation",
                scenes=[self._build_scene(title, manual, field_guide) for title in self.settings.pipeline.presentation_structure],
            ),
            speaker_tracks=self._build_speaker_tracks(field_guide),
            speaker_toolkit=self._build_toolkit(manual, field_guide, handout),
            resource_library=self._build_resource_library(manual),
            downloads=self._build_downloads(),
            provenance_index=[],
            qa_annotations=[],
        )
        deterministic.provenance_index = self._build_provenance_index(deterministic)
        deterministic.qa_annotations = self._build_annotations(deterministic)

        if not self.router.is_route_live("web_experience_generation"):
            return self._polish_artifact(deterministic)

        prompt = read_text(self.prompts_dir / "web_experience_generation.txt")
        user_prompt = json.dumps(
            {
                "presentation_structure": self.settings.pipeline.presentation_structure,
                "deterministic_web_experience": deterministic.model_dump(),
                "manual": manual.model_dump(),
                "field_guide": field_guide.model_dump(),
                "handout": handout.model_dump(),
            },
            indent=2,
        )
        model_result = self.router.try_generate_json("web_experience_generation", prompt, user_prompt)
        if model_result:
            try:
                candidate = self._polish_artifact(WebExperienceArtifact.model_validate(model_result))
                polished = self._refine_with_api(candidate, manual, field_guide, handout)
                return self._polish_artifact(polished)
            except Exception:  # noqa: BLE001
                LOGGER.warning("API web experience result failed validation, using deterministic draft.")
        return self._polish_artifact(deterministic)

    def _refine_with_api(
        self,
        artifact: WebExperienceArtifact,
        manual: ManualArtifact,
        field_guide: FieldGuideArtifact,
        handout: HandoutArtifact,
    ) -> WebExperienceArtifact:
        if not self.router.is_route_live("consistency_review"):
            return artifact
        prompt = read_text(self.prompts_dir / "web_experience_polish.txt")
        user_prompt = json.dumps(
            {
                "candidate_web_experience": artifact.model_dump(),
                "manual": manual.model_dump(),
                "field_guide": field_guide.model_dump(),
                "handout": handout.model_dump(),
            },
            indent=2,
        )
        model_result = self.router.try_generate_json("consistency_review", prompt, user_prompt)
        if not model_result:
            return artifact
        try:
            return WebExperienceArtifact.model_validate(model_result)
        except Exception:  # noqa: BLE001
            LOGGER.warning("API web experience polish result failed validation; keeping first-pass artifact.")
            return artifact

    def _build_scene(self, title: str, manual: ManualArtifact, field_guide: FieldGuideArtifact) -> WebScene:
        sections = [section for section in manual.sections if section.title in SCENE_TO_SECTION[title]]
        scene_id = stable_id(title, prefix="scene")
        return WebScene(
            scene_id=scene_id,
            slug=slugify(title),
            title=title,
            kicker=SCENE_KICKERS[title],
            display_lines=DISPLAY_LINES[title],
            speaker_notes=self._speaker_notes_for_scene(title, sections),
            duration_tags=self._duration_tags_for_scene(scene_id),
            audience_mode="public",
            visual_treatment=SCENE_VISUALS[title],
            speaker_only_blocks=self._speaker_block_for_scene(title, field_guide),
            resource_refs=self._resource_refs_for_scene(title),
            source_support=[section.section_id for section in sections],
            generated_scaffolding=self._generated_scaffolding_for_scene(title),
        )

    def _generated_scaffolding_for_scene(self, title: str) -> list[str]:
        notes = ["Scene framing and visual treatment were generated from manual and field guide content for web presentation use."]
        if title in {"Opening", "Call to Action", "Closing / Further Learning"}:
            notes.append("Display-language compression was generated to fit the scene-based presentation format.")
        return notes

    def _speaker_notes_for_scene(self, title: str, sections: list) -> str:
        combined = strip_structural_noise("\n\n".join(section.body_markdown for section in sections))
        curated = {
            "Opening": "Welcome the audience and frame the session as a civic conversation, not a political debate. Explain that the presentation will define the Rule of Law, show why it matters in daily public life, and offer practical ways to discuss it constructively in Arizona communities.",
            "Why We're Here": "Connect the session to public trust, fair process, and the legal profession's service role. Make clear that the aim is civic understanding, not partisan persuasion.",
            "What Is the Rule of Law?": "Give the plain-English definition first: the Rule of Law means power is exercised through known rules and fair institutions rather than arbitrary will. Then emphasize that it protects rights, governs power, and makes fairness reliable instead of discretionary.",
            "Why It Matters": "Translate the principle into everyday value: stable expectations, fair treatment, and a way to resolve disagreement without force or favoritism.",
            "Accountability": "Land the first pillar clearly: everyone is subject to the law. Keep it memorable and grounded.",
            "Just Law": "Stress clarity, visibility, stability, and rights protection. Avoid abstract legal jargon.",
            "Open Government": "Connect transparency to public trust and accountability. Explain why visibility into process matters.",
            "Accessible, Impartial Justice": "Emphasize that justice must be fair, competent, independent, and available to ordinary people.",
            "What Happens When It Weakens": "Avoid alarmism. Focus on the civic consequences of weakened lawful process: less trust, less legitimacy, and more raw power.",
            "Why Lawyers Must Lead": "Frame lawyers as civic translators and stewards, not partisan advocates. Connect oath, public service, and public understanding.",
            "The Ambassador Role": "Clarify what the speaker is here to do and not do: explain clearly, stay nonpartisan, and invite responsibility.",
            "Communicating Effectively": "Use simple language, practical examples, and redirection to shared principles whenever the discussion drifts.",
            "What Citizens Can Do": "Give the audience practical civic actions. Make it feel realistic and attainable.",
            "Arizona-Specific Resources": "Slow down and point clearly to follow-up institutions, partner resources, and local next steps.",
            "Call to Action": "Close with a public-service invitation, not a campaign ask. Encourage people to teach the principle, model the tone, and connect to trusted institutions.",
            "Closing / Further Learning": "End calmly and confidently. Point people to the handout, manual, and Arizona partner resources for follow-up.",
        }
        return curated.get(title, combined[:1400])

    def _speaker_block_for_scene(self, title: str, field_guide: FieldGuideArtifact) -> list[SpeakerOnlyBlock]:
        matches = []
        for version in field_guide.versions:
            for block in version.blocks:
                if any(keyword in block.title.lower() for keyword in title.lower().split()) or (
                    title in {"Opening", "Call to Action"} and block.title in {"Opening and Purpose", "Closing and Call to Action"}
                ):
                    matches.append(block)
        blocks: list[SpeakerOnlyBlock] = []
        if matches:
            primary = matches[0]
            blocks.append(SpeakerOnlyBlock(title="Facilitation Cue", body=primary.engagement_prompt))
            if primary.likely_questions:
                blocks.append(SpeakerOnlyBlock(title="Likely Audience Question", body=primary.likely_questions[0]))
            blocks.append(SpeakerOnlyBlock(title="Transition", body=primary.transition))
        return blocks[:3]

    def _duration_tags_for_scene(self, scene_id: str) -> list[int]:
        tags = [minutes for minutes, scene_titles in TRACK_SCENE_TITLES.items() if scene_id in {stable_id(title, prefix="scene") for title in scene_titles}]
        return tags or [45, 60]

    def _resource_refs_for_scene(self, title: str) -> list[str]:
        if title in {"Arizona-Specific Resources", "Call to Action", "Closing / Further Learning"}:
            return ["resources_arizona-partners", "resources_follow-up"]
        if title in {"Communicating Effectively", "The Ambassador Role"}:
            return ["resources_speaker-toolkit"]
        return []

    def _build_speaker_tracks(self, field_guide: FieldGuideArtifact) -> list[SpeakerTrack]:
        tracks: list[SpeakerTrack] = []
        for version in field_guide.versions:
            scene_ids = [stable_id(title, prefix="scene") for title in TRACK_SCENE_TITLES.get(version.minutes, [])]
            steps = []
            for block, scene_id in zip(version.blocks, scene_ids, strict=False):
                steps.append(SpeakerTrackStep(scene_id=scene_id, minutes=block.minutes, cue=block.title))
            tracks.append(
                SpeakerTrack(
                    minutes=version.minutes,
                    title=f"{version.minutes}-minute presenter flow",
                    scene_ids=scene_ids,
                    steps=steps,
                    transition_note="Use the presenter drawer for transitions, questions, and timing prompts.",
                )
            )
        return tracks

    def _build_toolkit(self, manual: ManualArtifact, field_guide: FieldGuideArtifact, handout: HandoutArtifact) -> list[ToolkitItem]:
        items: list[ToolkitItem] = []
        for version in field_guide.versions:
            script = "\n\n".join(f"{block.title} ({block.minutes} min): {block.script}" for block in version.blocks[:4])
            items.append(
                ToolkitItem(
                    toolkit_id=stable_id(str(version.minutes), "talk-track", prefix="toolkit"),
                    type="talk_track",
                    title=f"{version.minutes}-minute talk track",
                    body=script,
                    audience="speaker",
                    speaker_only=True,
                    source_support=sorted({support for block in version.blocks for support in block.source_support}),
                )
            )
        manual_map = {section.title: section for section in manual.sections}
        for title in ["Handling Questions and Difficult Conversations", "Presentation Preparation Checklist", "Ambassador Toolkit"]:
            section = manual_map.get(title)
            if not section:
                continue
            items.append(
                ToolkitItem(
                    toolkit_id=stable_id(title, prefix="toolkit"),
                    type="guidance" if "Checklist" not in title else "checklist",
                    title=title,
                    body=section.body_markdown,
                    audience="speaker",
                    speaker_only=True,
                    source_support=section.source_support,
                )
            )
        handout_body = "\n\n".join(f"{section.title}: {section.body}" for section in handout.sections)
        items.append(
            ToolkitItem(
                toolkit_id=stable_id("audience-handout", prefix="toolkit"),
                type="handout_summary",
                title="Audience handout summary",
                body=handout_body,
                audience="public",
                speaker_only=False,
                source_support=[support for section in handout.sections for support in section.source_support],
            )
        )
        return items

    def _build_resource_library(self, manual: ManualArtifact) -> list[ResourceGroup]:
        resource_section = next((section for section in manual.sections if section.title == "Arizona-Specific Civic Resources"), None)
        support = resource_section.source_support if resource_section else []
        return [
            ResourceGroup(
                resource_group_id="resources_arizona-partners",
                title="Arizona civic partners",
                description="Trusted institutions that can extend learning, support presentations, and provide follow-up opportunities.",
                links=[
                    ResourceLink(label="State Bar of Arizona", href="https://www.azbar.org", description="Professional and public-facing legal resources."),
                    ResourceLink(label="Arizona Bar Foundation", href="[placeholder]", description="Replace with the staff-approved partner link.", is_placeholder=True),
                    ResourceLink(label="O'Connor Institute", href="[placeholder]", description="Replace with the staff-approved partner link.", is_placeholder=True),
                ],
                source_support=support,
            ),
            ResourceGroup(
                resource_group_id="resources_speaker-toolkit",
                title="Speaker support",
                description="Resources for preparing, adapting, and delivering a nonpartisan presentation.",
                links=[
                    ResourceLink(label="Presentation preparation checklist", href="/toolkit#preparation", description="Operational prep guidance for presenters."),
                    ResourceLink(label="Handling questions", href="/toolkit#questions", description="Nonpartisan facilitation prompts and redirect language."),
                ],
                source_support=support,
            ),
            ResourceGroup(
                resource_group_id="resources_follow-up",
                title="Follow-up and downloads",
                description="Printable documents and learning materials that extend the presentation.",
                links=[
                    ResourceLink(label="Manual download", href="/downloads/arizona_rule_of_law_ambassador_manual.docx", description="Editable manual backbone."),
                    ResourceLink(label="Audience handout", href="/downloads/arizona_rule_of_law_handout.pdf", description="Printable 1-2 page handout."),
                    ResourceLink(label="Speaker field guide", href="/downloads/arizona_rule_of_law_field_guide.pdf", description="Timed talk tracks and facilitation support."),
                ],
                source_support=support,
            ),
        ]

    def _build_downloads(self) -> list[DownloadAsset]:
        return [
            DownloadAsset(
                asset_id="download_manual_docx",
                title="Ambassador manual",
                format="docx",
                href="/downloads/arizona_rule_of_law_ambassador_manual.docx",
                description="Editable substantive manual.",
                source_path=str(self.root_dir / self.settings.pipeline.packaging["manual_docx"]),
            ),
            DownloadAsset(
                asset_id="download_field_guide_pdf",
                title="Speaker field guide",
                format="pdf",
                href="/downloads/arizona_rule_of_law_field_guide.pdf",
                description="Printable timed speaker guide.",
                source_path=str(self.root_dir / self.settings.pipeline.packaging["field_guide_pdf"]),
            ),
            DownloadAsset(
                asset_id="download_handout_pdf",
                title="Audience handout",
                format="pdf",
                href="/downloads/arizona_rule_of_law_handout.pdf",
                description="Printable audience summary.",
                source_path=str(self.root_dir / self.settings.pipeline.packaging["handout_pdf"]),
            ),
            DownloadAsset(
                asset_id="download_lms_docx",
                title="LMS modules",
                format="docx",
                href="/downloads/arizona_rule_of_law_lms_modules.docx",
                description="Editable LMS-ready training text.",
                source_path=str(self.root_dir / self.settings.pipeline.packaging["lms_docx"]),
            ),
        ]

    def _build_provenance_index(self, artifact: WebExperienceArtifact) -> list[ProvenanceEntry]:
        entries = []
        for scene in artifact.presentation.scenes:
            entries.append(
                ProvenanceEntry(
                    ref_id=scene.scene_id,
                    title=scene.title,
                    source_support=scene.source_support,
                    generated_scaffolding=scene.generated_scaffolding,
                )
            )
        for item in artifact.speaker_toolkit:
            entries.append(
                ProvenanceEntry(
                    ref_id=item.toolkit_id,
                    title=item.title,
                    source_support=item.source_support,
                    generated_scaffolding=[],
                )
            )
        return entries

    def _build_annotations(self, artifact: WebExperienceArtifact) -> list[QAAnnotation]:
        annotations = []
        placeholder_refs = [
            group.resource_group_id
            for group in artifact.resource_library
            if any(link.is_placeholder for link in group.links)
        ]
        if placeholder_refs:
            annotations.append(
                QAAnnotation(
                    annotation_id="qa_placeholder_resources",
                    level="warning",
                    message="One or more Arizona partner links remain placeholders and require staff review before publication.",
                    ref_ids=placeholder_refs,
                )
            )
        annotations.append(
            QAAnnotation(
                annotation_id="qa_presenter_mode",
                level="info",
                message="Speaker-only content is structurally separated for presenter mode and should remain hidden in public presentation routes.",
                ref_ids=[scene.scene_id for scene in artifact.presentation.scenes if scene.speaker_only_blocks],
            )
        )
        return annotations

    def _sync_downloads(self, artifact: WebExperienceArtifact) -> None:
        manifest = []
        for asset in artifact.downloads:
            source_path = Path(asset.source_path)
            if not source_path.exists():
                LOGGER.warning("Download asset source is missing: %s", source_path)
                continue
            destination = self.web_downloads_dir / Path(asset.href).name
            shutil.copy2(source_path, destination)
            manifest.append({**asset.model_dump(), "synced_path": str(destination)})
        dump_json(self.web_generated_dir / "downloads-manifest.json", {"downloads": manifest})

    def _to_markdown(self, artifact: WebExperienceArtifact) -> str:
        parts = ["# Arizona Rule of Law Web Experience", ""]
        parts.append("## Presentation")
        parts.append("")
        for scene in artifact.presentation.scenes:
            parts.append(f"### {scene.kicker} | {scene.title}")
            for line in scene.display_lines:
                parts.append(f"- {line}")
            parts.append("")
            parts.append(f"**Speaker Notes**: {scene.speaker_notes}")
            if scene.speaker_only_blocks:
                parts.append("")
                parts.append("**Speaker-Only Blocks**")
                for block in scene.speaker_only_blocks:
                    parts.append(f"- {block.title}: {block.body}")
            parts.append("")
        parts.append("## Speaker Toolkit")
        parts.append("")
        for item in artifact.speaker_toolkit:
            parts.append(f"### {item.title}")
            parts.append(item.body)
            parts.append("")
        parts.append("## Resource Library")
        parts.append("")
        for group in artifact.resource_library:
            parts.append(f"### {group.title}")
            parts.append(group.description)
            for link in group.links:
                marker = " [placeholder]" if link.is_placeholder else ""
                parts.append(f"- {link.label}: {link.href}{marker}")
            parts.append("")
        return "\n".join(parts).strip() + "\n"

    def _polish_artifact(self, artifact: WebExperienceArtifact) -> WebExperienceArtifact:
        for scene in artifact.presentation.scenes:
            scene.title = normalize_whitespace(scene.title)
            scene.kicker = normalize_whitespace(scene.kicker)
            scene.display_lines = [normalize_whitespace(line) for line in scene.display_lines if line.strip()]
            scene.speaker_notes = strip_structural_noise(normalize_whitespace(scene.speaker_notes))
            scene.visual_treatment = normalize_whitespace(scene.visual_treatment)
            scene.speaker_only_blocks = [
                SpeakerOnlyBlock(title=normalize_whitespace(block.title), body=strip_structural_noise(normalize_whitespace(block.body)))
                for block in scene.speaker_only_blocks
                if block.title.strip() and block.body.strip()
            ]
        for track in artifact.speaker_tracks:
            track.title = normalize_whitespace(track.title)
            track.transition_note = normalize_whitespace(track.transition_note)
            track.steps = [
                SpeakerTrackStep(scene_id=step.scene_id, minutes=step.minutes, cue=normalize_whitespace(step.cue))
                for step in track.steps
            ]
        for item in artifact.speaker_toolkit:
            item.title = normalize_whitespace(item.title)
            item.body = strip_structural_noise(normalize_whitespace(item.body))
        for group in artifact.resource_library:
            group.title = normalize_whitespace(group.title)
            group.description = normalize_whitespace(group.description)
            group.links = [
                ResourceLink(
                    label=normalize_whitespace(link.label),
                    href=normalize_whitespace(link.href),
                    description=normalize_whitespace(link.description),
                    is_placeholder=link.is_placeholder,
                )
                for link in group.links
            ]
        return artifact
