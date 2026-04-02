from __future__ import annotations

import json
import logging
import re
from pathlib import Path

from jsonschema import Draft202012Validator

from pipelines.model_clients import ModelRouter
from pipelines.schemas import CanonicalUnit, FieldGuideArtifact, HandoutArtifact, LMSArtifact, ManualArtifact, QAItem, QAReport, WebExperienceArtifact
from pipelines.settings import SettingsBundle
from pipelines.utils import dump_json, dump_text, read_text, utc_now_iso, word_count


LOGGER = logging.getLogger(__name__)


class QAEngine:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter, run_id: str) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.run_id = run_id
        self.outputs_dir = root_dir / "outputs" / "intermediate"
        self.prompts_dir = root_dir / settings.pipeline.directories["prompts"]

    def run(self) -> QAReport:
        manual = self._load_model("manual.json", ManualArtifact)
        field_guide = self._load_model("field_guide.json", FieldGuideArtifact)
        handout = self._load_model("handout.json", HandoutArtifact)
        web_experience = self._load_model("web_experience.json", WebExperienceArtifact)
        lms = self._load_model("lms.json", LMSArtifact)
        canonical_units = self._load_canonical_units()

        checks = [
            self._check_required_artifacts(),
            self._check_web_contract(),
            self._check_partisan_language(),
            self._check_presentation_scene_count(web_experience),
            self._check_field_guide_timings(field_guide),
            self._check_web_tracks(web_experience),
            self._check_handout_length(handout),
            self._check_lms_requirements(lms),
            self._check_appendices(manual),
            self._check_definition_consistency(manual, handout, web_experience, lms),
            self._check_web_alignment(web_experience, manual),
            self._check_presenter_separation(web_experience),
            self._check_resource_links(web_experience),
            self._check_supported_traceability(manual, web_experience, field_guide, handout, lms, canonical_units),
        ]
        checks.extend(self._llm_review_if_available())
        overall = "pass"
        if any(item.status == "fail" for item in checks):
            overall = "fail"
        elif any(item.status == "warning" for item in checks):
            overall = "warning"
        report = QAReport(
            run_id=self.run_id,
            generated_at=utc_now_iso(),
            overall_status=overall,
            checks=checks,
            summary=self._summary_text(overall, checks),
        )
        dump_json(self.root_dir / self.settings.pipeline.packaging["qa_json"], report.model_dump())
        dump_text(self.root_dir / self.settings.pipeline.packaging["qa_markdown"], self._report_to_markdown(report))
        return report

    def _load_model(self, filename: str, model_type):
        path = self.outputs_dir / filename
        if not path.exists():
            raise FileNotFoundError(f"Expected artifact not found: {filename}")
        return model_type.model_validate(json.loads(path.read_text(encoding="utf-8")))

    def _load_canonical_units(self) -> dict[str, CanonicalUnit]:
        corpus_path = self.root_dir / self.settings.pipeline.directories["canonical"] / "canonical_corpus.json"
        corpus = json.loads(corpus_path.read_text(encoding="utf-8"))
        return {item["canonical_id"]: CanonicalUnit.model_validate(item) for item in corpus["units"]}

    def _check_required_artifacts(self) -> QAItem:
        missing = []
        required_keys = [
            "manual_docx",
            "manual_markdown",
            "manual_trace",
            "field_guide_docx",
            "field_guide_pdf",
            "field_guide_trace",
            "handout_docx",
            "handout_pdf",
            "handout_trace",
            "web_experience_json",
            "web_experience_markdown",
            "web_experience_trace",
            "lms_docx",
            "lms_markdown",
            "lms_trace",
        ]
        for key in required_keys:
            rel_path = self.settings.pipeline.packaging[key]
            path = self.root_dir / rel_path
            if not path.exists():
                missing.append(rel_path)
        if missing:
            return QAItem(name="required_artifacts", status="fail", message="Some expected artifact files are missing.", details=missing)
        return QAItem(name="required_artifacts", status="pass", message="All configured artifact files are present.")

    def _check_web_contract(self) -> QAItem:
        schema_path = self.root_dir / self.settings.pipeline.directories["schemas"] / "web_experience.schema.json"
        artifact_path = self.outputs_dir / "web_experience.json"
        validator = Draft202012Validator(json.loads(schema_path.read_text(encoding="utf-8")))
        errors = sorted(validator.iter_errors(json.loads(artifact_path.read_text(encoding="utf-8"))), key=lambda error: list(error.absolute_path))
        if errors:
            details = [f"{'/'.join(str(part) for part in error.absolute_path)}: {error.message}" for error in errors[:10]]
            return QAItem(name="web_experience_contract", status="fail", message="Web experience JSON does not match its schema.", details=details)
        return QAItem(name="web_experience_contract", status="pass", message="Web experience JSON matches its schema.")

    def _check_partisan_language(self) -> QAItem:
        text_paths = [
            self.root_dir / self.settings.pipeline.packaging["manual_markdown"],
            self.root_dir / "outputs" / "field_guide" / "arizona_rule_of_law_field_guide.md",
            self.root_dir / "outputs" / "handout" / "arizona_rule_of_law_handout.md",
            self.root_dir / self.settings.pipeline.packaging["web_experience_markdown"],
            self.root_dir / self.settings.pipeline.packaging["lms_markdown"],
        ]
        violations = []
        prohibited = [term.lower() for term in self.settings.pipeline.qa["prohibited_language"]]
        for path in text_paths:
            content = path.read_text(encoding="utf-8").lower() if path.exists() else ""
            for term in prohibited:
                if term in content:
                    violations.append(f"{path.name}: found '{term}'")
        if violations:
            return QAItem(name="nonpartisan_language", status="fail", message="Prohibited partisan language was detected.", details=violations)
        return QAItem(name="nonpartisan_language", status="pass", message="No prohibited partisan language detected.")

    def _check_presentation_scene_count(self, web_experience: WebExperienceArtifact) -> QAItem:
        expected = self.settings.pipeline.qa["presentation_required_scene_count"]
        found = len(web_experience.presentation.scenes)
        if found != expected:
            return QAItem(name="presentation_scene_count", status="fail", message=f"Web presentation has {found} scenes, expected {expected}.")
        return QAItem(name="presentation_scene_count", status="pass", message=f"Web presentation contains the expected {expected} scenes.")

    def _check_field_guide_timings(self, field_guide: FieldGuideArtifact) -> QAItem:
        issues = []
        for version in field_guide.versions:
            total = sum(block.minutes for block in version.blocks)
            if total != version.minutes:
                issues.append(f"{version.minutes}-minute version totals {total} minutes.")
        if issues:
            return QAItem(name="field_guide_timings", status="warning", message="One or more field guide timings do not add up exactly.", details=issues)
        return QAItem(name="field_guide_timings", status="pass", message="Field guide timings are internally consistent.")

    def _check_web_tracks(self, web_experience: WebExperienceArtifact) -> QAItem:
        issues = []
        known_scene_ids = {scene.scene_id for scene in web_experience.presentation.scenes}
        required_minutes = set(self.settings.pipeline.qa["field_guide_required_versions"])
        found_minutes = {track.minutes for track in web_experience.speaker_tracks}
        if required_minutes != found_minutes:
            issues.append(f"Expected speaker tracks for {sorted(required_minutes)}, found {sorted(found_minutes)}.")
        for track in web_experience.speaker_tracks:
            total = sum(step.minutes for step in track.steps)
            if total != track.minutes:
                issues.append(f"{track.minutes}-minute web track totals {total} minutes.")
            missing_refs = [scene_id for scene_id in track.scene_ids if scene_id not in known_scene_ids]
            if missing_refs:
                issues.append(f"{track.minutes}-minute web track references unknown scenes: {', '.join(missing_refs)}.")
        if issues:
            return QAItem(name="web_speaker_tracks", status="warning", message="Web speaker tracks need review.", details=issues)
        return QAItem(name="web_speaker_tracks", status="pass", message="Web speaker tracks are structurally consistent.")

    def _check_handout_length(self, handout: HandoutArtifact) -> QAItem:
        total_words = word_count("\n\n".join(section.body for section in handout.sections))
        bounds = self.settings.pipeline.qa["handout_word_count"]
        if total_words < bounds["min"] or total_words > bounds["max"]:
            return QAItem(name="handout_length", status="warning", message=f"Handout is {total_words} words; target range is {bounds['min']}-{bounds['max']}.")
        return QAItem(name="handout_length", status="pass", message=f"Handout length is within the target range at {total_words} words.")

    def _check_lms_requirements(self, lms: LMSArtifact) -> QAItem:
        issues = []
        min_quiz = self.settings.pipeline.qa["lms_quiz_range"]["min"]
        max_quiz = self.settings.pipeline.qa["lms_quiz_range"]["max"]
        for module in lms.modules:
            if not module.learning_objectives:
                issues.append(f"{module.title}: missing learning objectives.")
            if not (min_quiz <= len(module.quiz_questions) <= max_quiz):
                issues.append(f"{module.title}: expected {min_quiz}-{max_quiz} quiz questions, found {len(module.quiz_questions)}.")
        if issues:
            return QAItem(name="lms_requirements", status="fail", message="One or more LMS modules are incomplete.", details=issues)
        return QAItem(name="lms_requirements", status="pass", message="All LMS modules include objectives and quiz questions.")

    def _check_appendices(self, manual: ManualArtifact) -> QAItem:
        appendix = next((section for section in manual.sections if section.title == "Appendices"), None)
        if appendix is None:
            return QAItem(name="appendices_labeling", status="fail", message="Appendices section is missing from the manual.")
        if "appendices" not in appendix.title.lower():
            return QAItem(name="appendices_labeling", status="warning", message="Appendices section title may be mislabeled.")
        return QAItem(name="appendices_labeling", status="pass", message="Appendices section is present and labeled.")

    def _check_definition_consistency(self, manual: ManualArtifact, handout: HandoutArtifact, web_experience: WebExperienceArtifact, lms: LMSArtifact) -> QAItem:
        manual_text = next(section.body_markdown for section in manual.sections if section.title == "What the Rule of Law Is")
        handout_text = next(section.body for section in handout.sections if section.title == "What the Rule of Law Means")
        web_text = next(scene.speaker_notes for scene in web_experience.presentation.scenes if scene.title == "What Is the Rule of Law?")
        lms_text = next(module.lesson_body_markdown for module in lms.modules if module.title == "What the Rule of Law Is")
        if (
            self._token_overlap(manual_text, handout_text) < 0.18
            or self._token_overlap(manual_text, web_text) < 0.18
            or self._token_overlap(manual_text, lms_text) < 0.18
        ):
            return QAItem(name="definition_consistency", status="warning", message="Definition language differs more than expected across deliverables.")
        return QAItem(name="definition_consistency", status="pass", message="Definition language is consistent across manual, web presentation, handout, and LMS.")

    def _check_web_alignment(self, web_experience: WebExperienceArtifact, manual: ManualArtifact) -> QAItem:
        manual_ids = {section.section_id for section in manual.sections}
        missing = []
        for scene in web_experience.presentation.scenes:
            if not scene.source_support:
                missing.append(f"Scene '{scene.title}' lacks manual support.")
            elif not set(scene.source_support).issubset(manual_ids):
                missing.append(f"Scene '{scene.title}' references unknown manual sections.")
        if missing:
            return QAItem(name="web_alignment", status="fail", message="Some web scenes are not aligned to known manual sections.", details=missing)
        return QAItem(name="web_alignment", status="pass", message="Every web scene is linked to one or more manual sections.")

    def _check_presenter_separation(self, web_experience: WebExperienceArtifact) -> QAItem:
        issues = []
        for scene in web_experience.presentation.scenes:
            for block in scene.speaker_only_blocks:
                block_text = block.body.lower()
                if any(line.lower() in block_text for line in scene.display_lines):
                    issues.append(f"Scene '{scene.title}' duplicates display copy inside speaker-only blocks.")
        if issues:
            return QAItem(name="presenter_separation", status="warning", message="Some presenter-only content duplicates public scene content.", details=issues)
        return QAItem(name="presenter_separation", status="pass", message="Presenter-only content is structurally separated from public scene content.")

    def _check_resource_links(self, web_experience: WebExperienceArtifact) -> QAItem:
        issues = []
        for group in web_experience.resource_library:
            for link in group.links:
                href = link.href.strip()
                if not href:
                    issues.append(f"{group.title}: link '{link.label}' is empty.")
                elif "[" in href and not link.is_placeholder:
                    issues.append(f"{group.title}: link '{link.label}' looks like a placeholder but is not flagged.")
        if issues:
            return QAItem(name="resource_links", status="warning", message="Some web resource links need review.", details=issues)
        return QAItem(name="resource_links", status="pass", message="Web resource links are present and placeholder flags are consistent.")

    def _check_supported_traceability(self, manual: ManualArtifact, web_experience: WebExperienceArtifact, field_guide: FieldGuideArtifact, handout: HandoutArtifact, lms: LMSArtifact, canonical_units: dict[str, CanonicalUnit]) -> QAItem:
        unsupported = []
        for section in manual.sections:
            if not section.source_support and not section.generated_scaffolding:
                unsupported.append(f"Manual section '{section.title}' has no source support.")
            for support in section.source_support:
                unit = canonical_units.get(support)
                if unit and not unit.validation.supported:
                    unsupported.append(f"Manual section '{section.title}' relies on unsupported unit '{unit.title}'.")
        for scene in web_experience.presentation.scenes:
            if not scene.source_support and not scene.generated_scaffolding:
                unsupported.append(f"Web scene '{scene.title}' has no source support.")
        if unsupported:
            return QAItem(name="traceability_support", status="warning", message="Some content depends on unsupported or weakly supported material.", details=unsupported)
        return QAItem(name="traceability_support", status="pass", message="Manual sections and web scenes maintain source support or explicit generated-scaffolding labels.")

    def _llm_review_if_available(self) -> list[QAItem]:
        if not self.router.is_route_live("consistency_review"):
            return []
        prompt = read_text(self.prompts_dir / "qa_review.txt")
        summary_payload = {
            "manual": json.loads((self.outputs_dir / "manual.json").read_text(encoding="utf-8")),
            "web_experience": json.loads((self.outputs_dir / "web_experience.json").read_text(encoding="utf-8")),
            "handout": json.loads((self.outputs_dir / "handout.json").read_text(encoding="utf-8")),
            "lms": json.loads((self.outputs_dir / "lms.json").read_text(encoding="utf-8")),
        }
        result = self.router.try_generate_json("consistency_review", prompt, json.dumps(summary_payload, indent=2)[:10000])
        if not result:
            return []
        items = []
        for finding in result.get("findings", []):
            status = "warning" if finding.get("severity") in {"warning", "error"} else "pass"
            items.append(
                QAItem(
                    name=f"llm_review::{finding.get('check', 'review')}",
                    status=status,
                    artifact=finding.get("artifact"),
                    message=finding.get("message", "LLM review finding."),
                    details=[finding.get("suggested_fix", "")] if finding.get("suggested_fix") else [],
                )
            )
        return items

    def _summary_text(self, overall: str, checks: list[QAItem]) -> str:
        total = len(checks)
        failures = len([item for item in checks if item.status == "fail"])
        warnings = len([item for item in checks if item.status == "warning"])
        return f"QA status is {overall}. {total} checks ran with {failures} failures and {warnings} warnings."

    def _report_to_markdown(self, report: QAReport) -> str:
        parts = ["# Pipeline QA Report", ""]
        parts.append(f"- Run ID: `{report.run_id}`")
        parts.append(f"- Generated At: `{report.generated_at}`")
        parts.append(f"- Overall Status: `{report.overall_status}`")
        parts.append("")
        for check in report.checks:
            parts.append(f"## {check.name}")
            parts.append(f"- Status: `{check.status}`")
            parts.append(f"- Message: {check.message}")
            if check.details:
                for detail in check.details:
                    parts.append(f"- Detail: {detail}")
            parts.append("")
        return "\n".join(parts).strip() + "\n"

    def _token_overlap(self, left: str, right: str) -> float:
        left_tokens = set(re.findall(r"[a-z]+", left.lower()))
        right_tokens = set(re.findall(r"[a-z]+", right.lower()))
        if not left_tokens or not right_tokens:
            return 0.0
        return len(left_tokens & right_tokens) / len(left_tokens | right_tokens)
