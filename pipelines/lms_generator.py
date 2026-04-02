from __future__ import annotations

import json
import logging
from pathlib import Path

from pipelines.model_clients import ModelRouter
from pipelines.renderers import write_lms_docx
from pipelines.schemas import CanonicalUnit, DeliverableTrace, DeliverableTraceUnit, LMSArtifact, LMSModule, ManualArtifact, QuizQuestion
from pipelines.settings import SettingsBundle
from pipelines.utils import choose_top_sentences, dump_json, dump_text, ensure_dir, normalize_whitespace, read_text, stable_id, strip_structural_noise


LOGGER = logging.getLogger(__name__)


MODULE_TO_BUCKETS = {
    "What the Rule of Law Is": ["Definition / Core Concept"],
    "Why the Rule of Law Matters": ["Why It Matters", "Institutional / Civic Stakes"],
    "Why Lawyers Must Lead": ["Lawyer's Role"],
    "How to Communicate It Effectively": ["Public Communication"],
    "Ambassador Toolkit": ["Resources / Calls to Action"],
    "Arizona-Specific Context": ["Arizona-Specific Context", "Appendices / Supporting Texts"],
}


class LMSGenerator:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.manual_path = root_dir / "outputs" / "intermediate" / "manual.json"
        self.corpus_path = root_dir / settings.pipeline.directories["canonical"] / "canonical_corpus.json"
        self.intermediate_dir = ensure_dir(root_dir / "outputs" / "intermediate")
        self.prompts_dir = root_dir / settings.pipeline.directories["prompts"]
        self.web_generated_dir = ensure_dir(root_dir / "web" / "content" / "generated")

    def run(self) -> LMSArtifact:
        if not self.manual_path.exists() or not self.corpus_path.exists():
            raise FileNotFoundError("Run manual generation and canonicalization before LMS generation.")
        manual = ManualArtifact.model_validate(json.loads(self.manual_path.read_text(encoding="utf-8")))
        corpus = json.loads(self.corpus_path.read_text(encoding="utf-8"))
        units = [CanonicalUnit.model_validate(item) for item in corpus["units"]]
        lms = self._build_lms(manual, units)
        trace = DeliverableTrace(
            deliverable_id="lms",
            artifact_type="lms_modules",
            generated_at=__import__("datetime").datetime.utcnow().replace(microsecond=0).isoformat() + "Z",
            units=[
                DeliverableTraceUnit(
                    unit_id=module.module_id,
                    title=module.title,
                    source_support=module.source_support,
                    generated_scaffolding=module.generated_scaffolding,
                )
                for module in lms.modules
            ],
        )
        dump_json(self.intermediate_dir / "lms.json", lms.model_dump())
        dump_json(self.web_generated_dir / "lms.json", lms.model_dump())
        dump_text(Path(self.settings.pipeline.packaging["lms_markdown"]), self._lms_to_markdown(lms))
        dump_json(self.root_dir / self.settings.pipeline.packaging["lms_trace"], trace.model_dump())
        write_lms_docx(lms, self.root_dir / self.settings.pipeline.packaging["lms_docx"])
        return lms

    def _build_lms(self, manual: ManualArtifact, units: list[CanonicalUnit]) -> LMSArtifact:
        deterministic = LMSArtifact(modules=[self._build_module(title, manual, units) for title in self.settings.pipeline.lms_modules])
        if not self.router.is_route_live("lms_generation"):
            return self._polish_lms(deterministic)
        prompt = read_text(self.prompts_dir / "lms_generation.txt")
        module_packs = []
        for module in deterministic.modules:
            related_sections = [section.model_dump() for section in manual.sections if module.title == section.title or module.title in section.title]
            related_units = [unit.model_dump() for unit in units if unit.bucket in MODULE_TO_BUCKETS[module.title]][:8]
            module_packs.append({"module_title": module.title, "draft": module.model_dump(), "manual_sections": related_sections, "canonical_units": related_units})
        user_prompt = json.dumps({"modules": [module.model_dump() for module in deterministic.modules], "module_packs": module_packs}, indent=2)
        model_result = self.router.try_generate_json("lms_generation", prompt, user_prompt)
        if model_result and "modules" in model_result:
            try:
                return self._polish_lms(LMSArtifact(modules=[LMSModule.model_validate(item) for item in model_result["modules"]]))
            except Exception:  # noqa: BLE001
                LOGGER.warning("API LMS result failed validation, using deterministic modules.")
        return self._polish_lms(deterministic)

    def _build_module(self, title: str, manual: ManualArtifact, units: list[CanonicalUnit]) -> LMSModule:
        relevant_units = [unit for unit in units if unit.bucket in MODULE_TO_BUCKETS[title]]
        relevant_sections = [section for section in manual.sections if section.title == title or title in section.title]
        combined = "\n\n".join([unit.summary for unit in relevant_units] + [section.body_markdown for section in relevant_sections])
        learning_objectives = self._learning_objectives(title, relevant_units)
        lesson_body = "\n\n".join(choose_top_sentences(combined, limit=6))
        takeaways = choose_top_sentences(combined, limit=4)
        reflection_questions = self._reflection_questions(title)
        quiz_questions = self._quiz_questions(title, takeaways)
        discussion_prompt = self._discussion_prompt(title)
        generated_scaffolding = ["Learning objectives, discussion prompts, and quiz framing were generated for LMS use."]
        return LMSModule(
            module_id=stable_id(title, prefix="lms"),
            title=title,
            learning_objectives=learning_objectives,
            overview=choose_top_sentences(combined, limit=1)[0] if choose_top_sentences(combined, limit=1) else title,
            lesson_body_markdown=lesson_body,
            key_takeaways=takeaways,
            reflection_questions=reflection_questions,
            quiz_questions=quiz_questions,
            discussion_prompt=discussion_prompt,
            source_support=[unit.canonical_id for unit in relevant_units[:8]],
            generated_scaffolding=generated_scaffolding,
        )

    def _learning_objectives(self, title: str, units: list[CanonicalUnit]) -> list[str]:
        if title == "What the Rule of Law Is":
            return [
                "Define the Rule of Law in plain English.",
                "Identify the core principles that make the Rule of Law concrete.",
                "Explain why the Rule of Law is more than simple rule by law.",
            ]
        if title == "Why Lawyers Must Lead":
            return [
                "Describe why lawyers have a public-facing role in sustaining civic trust.",
                "Connect professional oath and public responsibility.",
                "Prepare to explain that role in a nonpartisan way.",
            ]
        if title == "How to Communicate It Effectively":
            return [
                "Explain the Rule of Law in plain English.",
                "Use examples that stay nonpartisan and audience-appropriate.",
                "Practice respectful redirection when questions become political.",
            ]
        if title == "Ambassador Toolkit":
            return [
                "Identify the core resources every ambassador should have ready.",
                "Prepare a short, accurate version of the program's main message.",
                "Plan follow-up resources for different audiences.",
            ]
        if title == "Arizona-Specific Context":
            return [
                "Identify Arizona-specific institutions and resources connected to the program.",
                "Explain how local civic context can make the presentation more concrete.",
                "Prepare placeholders that staff can finalize before public delivery.",
            ]
        summaries = [unit.summary for unit in units[:3]]
        objectives = [sentence.rstrip(".") + "." for sentence in choose_top_sentences(" ".join(summaries), limit=3)]
        return objectives or [
            f"Explain the main ideas in {title}.",
            f"Connect {title} to public-facing ambassador work.",
            f"Apply {title} in a nonpartisan civic-education setting.",
        ]

    def _reflection_questions(self, title: str) -> list[str]:
        return {
            "What the Rule of Law Is": [
                "Which part of the definition would be hardest to explain to a general audience, and why?",
                "Where do you see predictability and fairness mattering most in civic life?",
            ],
            "Why the Rule of Law Matters": [
                "What changes when people stop trusting that rules will be applied fairly?",
                "How can institutional stability affect ordinary community decisions?",
            ],
        }.get(
            title,
            [
                "How would you explain this topic to someone with no legal background?",
                "What is the most important practical takeaway from this module?",
            ],
        )

    def _quiz_questions(self, title: str, takeaways: list[str]) -> list[QuizQuestion]:
        questions = []
        fallback_takeaways = takeaways or [
            f"{title} should be explained in clear, practical language.",
            f"{title} should reinforce civic trust and lawful process.",
            f"{title} should remain nonpartisan and educational.",
        ]
        for takeaway in fallback_takeaways[:4]:
            prompt = takeaway.rstrip(".")
            questions.append(
                QuizQuestion(
                    question=f"Which option best reflects this idea: {prompt}?",
                    choices=[
                        prompt,
                        "The law matters only when courts are involved.",
                        "Fairness depends mainly on who has more power.",
                        "Civic trust does not depend on legal institutions.",
                    ],
                    answer=prompt,
                    rationale="The correct answer restates the supported takeaway from the module.",
                )
            )
        minimum = max(self.settings.pipeline.qa["lms_quiz_range"]["min"], 3)
        while len(questions) < minimum:
            questions.append(
                QuizQuestion(
                    question=f"Which practice best fits the goals of {title}?",
                    choices=[
                        "Use clear, accurate, and nonpartisan language.",
                        "Rely on vague slogans instead of explanation.",
                        "Turn the session into a partisan debate.",
                        "Assume the audience already knows the legal background.",
                    ],
                    answer="Use clear, accurate, and nonpartisan language.",
                    rationale="The program is designed to be educational, civic-minded, and broadly accessible.",
                )
            )
        return questions[: minimum]

    def _discussion_prompt(self, title: str) -> str:
        return {
            "How to Communicate It Effectively": "Compare two ways of answering a politically charged question and discuss which one better preserves a nonpartisan, educational tone.",
            "Ambassador Toolkit": "Discuss what resources or examples would help you tailor this presentation to a school versus a civic club.",
        }.get(title, "Discuss how this module's principles could be explained to a mixed public audience.")

    def _lms_to_markdown(self, lms: LMSArtifact) -> str:
        parts = ["# Arizona Rule of Law Ambassador LMS Modules", ""]
        for module in lms.modules:
            parts.append(f"## {module.title}")
            parts.append("")
            parts.append("### Learning Objectives")
            for objective in module.learning_objectives:
                parts.append(f"- {objective}")
            parts.append("")
            parts.append("### Overview")
            parts.append(module.overview)
            parts.append("")
            parts.append("### Lesson Body")
            parts.append(module.lesson_body_markdown)
            parts.append("")
            parts.append("### Key Takeaways")
            for takeaway in module.key_takeaways:
                parts.append(f"- {takeaway}")
            parts.append("")
            parts.append("### Reflection Questions")
            for question in module.reflection_questions:
                parts.append(f"- {question}")
            parts.append("")
            parts.append("### Knowledge Check")
            for quiz in module.quiz_questions:
                parts.append(f"1. {quiz.question}")
                for choice in quiz.choices:
                    parts.append(f"- {choice}")
                parts.append(f"Answer: {quiz.answer}")
                parts.append(f"Rationale: {quiz.rationale}")
                parts.append("")
            if module.discussion_prompt:
                parts.append(f"### Discussion Prompt\n{module.discussion_prompt}")
                parts.append("")
        return "\n".join(parts).strip() + "\n"

    def _polish_lms(self, lms: LMSArtifact) -> LMSArtifact:
        for module in lms.modules:
            module.overview = strip_structural_noise(normalize_whitespace(module.overview))
            module.lesson_body_markdown = strip_structural_noise(normalize_whitespace(module.lesson_body_markdown))
            module.learning_objectives = [normalize_whitespace(item) for item in module.learning_objectives]
            module.key_takeaways = [normalize_whitespace(item) for item in module.key_takeaways]
            module.reflection_questions = [normalize_whitespace(item) for item in module.reflection_questions]
            for quiz in module.quiz_questions:
                quiz.question = normalize_whitespace(quiz.question)
                quiz.choices = [normalize_whitespace(choice) for choice in quiz.choices]
                quiz.answer = normalize_whitespace(quiz.answer)
                quiz.rationale = normalize_whitespace(quiz.rationale)
        return lms
