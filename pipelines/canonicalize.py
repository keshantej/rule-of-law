from __future__ import annotations

import json
import logging
import re
from collections import defaultdict
from pathlib import Path

from pipelines.model_clients import ModelRouter
from pipelines.schemas import CanonicalUnit, CanonicalValidation, NormalizedChunk
from pipelines.settings import SettingsBundle
from pipelines.utils import (
    choose_top_sentences,
    dump_json,
    dump_text,
    ensure_dir,
    normalize_whitespace,
    read_text,
    slugify,
    stable_id,
)


LOGGER = logging.getLogger(__name__)


BUCKET_KEYWORDS = {
    "Definition / Core Concept": ["definition", "rule of law", "accountability", "open government", "principles"],
    "Why It Matters": ["why it matters", "stability", "trust", "rights", "predictability"],
    "Institutional / Civic Stakes": ["democracy", "institutions", "courts", "public trust", "weakens"],
    "Lawyer's Role": ["lawyer", "judge", "oath", "lead", "professional obligation", "ambassador"],
    "Public Communication": ["communicate", "audience", "questions", "nonpartisan", "speaker", "delivery"],
    "Arizona-Specific Context": ["arizona", "state bar", "supreme court", "o'connor", "pima county"],
    "Resources / Calls to Action": ["resources", "toolkit", "call to action", "what citizens can do", "checklist"],
    "Appendices / Supporting Texts": ["appendix", "world justice project", "oath of admission", "reference"],
}


class CanonicalPipeline:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.normalized_dir = root_dir / settings.pipeline.directories["normalized"]
        self.output_dir = ensure_dir(root_dir / settings.pipeline.directories["canonical"])
        self.prompts_dir = root_dir / settings.pipeline.directories["prompts"]

    def run(self) -> dict:
        chunks_path = self.normalized_dir / "chunks.json"
        if not chunks_path.exists():
            raise FileNotFoundError("Run normalization before canonicalization.")
        chunks = [NormalizedChunk.model_validate(item) for item in json.loads(chunks_path.read_text(encoding="utf-8"))["chunks"]]
        voice = self._build_voice_object()
        units = self._build_canonical_units(chunks)
        payload = {
            "program": self.settings.pipeline.program,
            "ambassador_voice": voice,
            "buckets": self._serialize_buckets(units),
            "units": [unit.model_dump() for unit in units],
        }
        dump_json(self.output_dir / "canonical_corpus.json", payload)
        dump_text(self.output_dir / "canonical_corpus.md", self._corpus_to_markdown(units, voice))
        dump_json(self.output_dir / "ambassador_voice.json", voice)
        return payload

    def _build_voice_object(self) -> dict:
        prompt_text = read_text(self.prompts_dir / "ambassador_voice.txt")
        default_voice = {
            "style_name": "ambassador_voice",
            "tone_summary": "Educational, calm, serious, nonpartisan, and civically grounded.",
            "allowed_moves": [
                "Define legal concepts in plain English.",
                "Connect legal principles to civic trust, fairness, and accountability.",
                "Use lawyer-as-public-servant framing.",
                "Add brief transitions that make sections easier to teach.",
            ],
            "disallowed_moves": [
                "Partisan signaling or campaign framing.",
                "Culture-war language or inflammatory examples.",
                "Donor-appeal language, triumphalism, or self-congratulation.",
                "Legalese that is not briefly explained.",
            ],
            "sentence_guidance": [
                "Prefer concrete sentences of moderate length.",
                "Define terms before using them repeatedly.",
                "Use measured verbs like explains, supports, protects, and helps.",
            ],
            "audience_guidance": {
                "general_public": ["Use plain English and practical examples."],
                "lawyers": ["Emphasize professional responsibility and public trust."],
                "students": ["Keep abstractions grounded in everyday fairness and predictability."],
            },
            "bridging_text_rules": [
                "Generated connective text must not introduce unsupported factual claims.",
                "Use bridging sentences to link supported ideas, not to invent authority.",
            ],
            "citation_rules": [
                "Keep provenance in metadata even if citations are hidden in the final artifact.",
                "Mark educational scaffolding separately from sourced content.",
            ],
        }
        if not self.router.is_route_live("style_harmonization"):
            return default_voice
        model_result = self.router.try_generate_json("style_harmonization", prompt_text, "Create the ambassador_voice object as requested.")
        return model_result or default_voice

    def _build_canonical_units(self, chunks: list[NormalizedChunk]) -> list[CanonicalUnit]:
        grouped: dict[tuple[str, str], list[NormalizedChunk]] = defaultdict(list)
        for chunk in chunks:
            if chunk.source_tier == 3 or chunk.content_type == "formatting_clue":
                continue
            bucket = self._bucket_for_chunk(chunk)
            title = self._title_for_chunk(chunk)
            grouped[(bucket, title)].append(chunk)
        units: list[CanonicalUnit] = []
        for (bucket, title), group_chunks in grouped.items():
            unit = self._build_unit(bucket, title, group_chunks)
            units.append(unit)
        units.sort(key=lambda item: (self.settings.pipeline.canonical_buckets.index(item.bucket), item.title))
        return units

    def _build_unit(self, bucket: str, title: str, chunks: list[NormalizedChunk]) -> CanonicalUnit:
        combined_text = "\n\n".join(chunk.normalized_text for chunk in chunks if chunk.source_tier != 3)
        support_sources = sorted({chunk.source_filename for chunk in chunks})
        support_ids = [chunk.chunk_id for chunk in chunks]
        quotes = self._extract_quotes(chunks)
        summary = self._summarize_group(bucket, title, combined_text, support_ids)
        key_points = choose_top_sentences(combined_text or "\n\n".join(chunk.normalized_text for chunk in chunks), limit=4)
        tier_set = {chunk.source_tier for chunk in chunks}
        if 1 in tier_set and len(support_sources) == 1 and len(chunks) == 1:
            canonical_status = "directly_sourced"
        elif 1 in tier_set and len(chunks) > 1:
            canonical_status = "synthesized"
        elif 1 not in tier_set and 2 in tier_set:
            canonical_status = "lightly_transformed"
        else:
            canonical_status = "generated_scaffolding"
        supported = any(chunk.source_tier in (1, 2) for chunk in chunks)
        confidence = 0.9 if 1 in tier_set else 0.75 if 2 in tier_set else 0.45
        flags = []
        if 3 in tier_set:
            flags.append("contains_structure_only_input")
        if not supported:
            flags.append("unsupported_generated_scaffolding")
        downstream_uses = sorted({"manual", "web_experience", "field_guide", "handout", "lms"} & set(self._downstream_uses(chunks, bucket)))
        return CanonicalUnit(
            canonical_id=stable_id(bucket, title, prefix="canon"),
            bucket=bucket,
            title=title,
            canonical_status=canonical_status,
            summary=summary,
            key_points=key_points,
            quotes=quotes,
            audience_level="general_public",
            tone_notes=sorted({note for chunk in chunks for note in chunk.tone_notes}),
            supporting_chunk_ids=support_ids,
            supporting_sources=support_sources,
            downstream_uses=downstream_uses or ["manual", "web_experience", "field_guide", "lms"],
            validation=CanonicalValidation(supported=supported, confidence=confidence, flags=flags),
        )

    def _bucket_for_chunk(self, chunk: NormalizedChunk) -> str:
        module_map = {
            "What the Rule of Law Is": "Definition / Core Concept",
            "Why the Rule of Law Matters": "Why It Matters",
            "Why Lawyers Must Lead": "Lawyer's Role",
            "How to Communicate It Effectively": "Public Communication",
            "Ambassador Toolkit": "Resources / Calls to Action",
            "Arizona-Specific Context": "Arizona-Specific Context",
        }
        for module in chunk.candidate_modules:
            if module in module_map:
                return module_map[module]
        lower = f"{' '.join(chunk.heading_path)} {chunk.normalized_text} {' '.join(chunk.candidate_modules)}".lower()
        for bucket, keywords in BUCKET_KEYWORDS.items():
            if any(keyword in lower for keyword in keywords):
                return bucket
        if chunk.content_type == "appendix":
            return "Appendices / Supporting Texts"
        return "Definition / Core Concept"

    def _title_for_chunk(self, chunk: NormalizedChunk) -> str:
        if chunk.heading_path:
            candidate = chunk.heading_path[-1].strip()
            if len(candidate) > 4 and not candidate.startswith("(") and not re.match(r"^(hitler|times)$", candidate, re.IGNORECASE):
                return candidate
        sentence = choose_top_sentences(chunk.normalized_text, limit=1)
        if sentence:
            return re.sub(r"[.?!]+$", "", sentence[0])[:90]
        return slugify(chunk.chunk_id).replace("-", " ").title()

    def _summarize_group(self, bucket: str, title: str, combined_text: str, support_ids: list[str]) -> str:
        if not combined_text:
            return "Generated placeholder until supported content is added."
        prompt = read_text(self.prompts_dir / "canonical_synthesis.txt")
        user_prompt = json.dumps(
            {
                "bucket": bucket,
                "title": title,
                "supporting_chunk_ids": support_ids,
                "content": combined_text[:6000],
            },
            indent=2,
        )
        model_result = self.router.try_generate_json("canonical_synthesis", prompt, user_prompt)
        if model_result and model_result.get("summary"):
            return normalize_whitespace(model_result["summary"])
        sentences = choose_top_sentences(combined_text, limit=2)
        return " ".join(sentences)

    def _extract_quotes(self, chunks: list[NormalizedChunk]) -> list[str]:
        quotes: list[str] = []
        for chunk in chunks:
            for match in re.findall(r"“([^”]+)”|\"([^\"]+)\"", chunk.text):
                quote = next((part for part in match if part), "")
                if quote and quote not in quotes:
                    quotes.append(quote.strip())
        return quotes[:3]

    def _downstream_uses(self, chunks: list[NormalizedChunk], bucket: str) -> list[str]:
        uses = {"manual", "web_experience", "field_guide", "lms"}
        if bucket == "Resources / Calls to Action":
            uses.add("handout")
        if any("communication" in tag for chunk in chunks for tag in chunk.reuse_tags):
            uses.add("field_guide")
        if any("resources" in tag for chunk in chunks for tag in chunk.reuse_tags):
            uses.add("handout")
        return sorted(uses)

    def _serialize_buckets(self, units: list[CanonicalUnit]) -> list[dict]:
        buckets: list[dict] = []
        for bucket in self.settings.pipeline.canonical_buckets:
            bucket_units = [unit.model_dump() for unit in units if unit.bucket == bucket]
            buckets.append({"bucket": bucket, "units": bucket_units})
        return buckets

    def _corpus_to_markdown(self, units: list[CanonicalUnit], voice: dict) -> str:
        lines = ["# Canonical Corpus", ""]
        lines.append("## Ambassador Voice")
        lines.append(f"- Tone: {voice['tone_summary']}")
        lines.append("")
        for bucket in self.settings.pipeline.canonical_buckets:
            lines.append(f"## {bucket}")
            lines.append("")
            for unit in [item for item in units if item.bucket == bucket]:
                lines.append(f"### {unit.title}")
                lines.append(f"- Canonical ID: `{unit.canonical_id}`")
                lines.append(f"- Status: `{unit.canonical_status}`")
                lines.append(f"- Sources: {', '.join(unit.supporting_sources)}")
                lines.append("")
                lines.append(unit.summary)
                lines.append("")
                if unit.key_points:
                    for point in unit.key_points:
                        lines.append(f"- {point}")
                    lines.append("")
        return "\n".join(lines).strip() + "\n"
