from __future__ import annotations

import logging
import re
from pathlib import Path

from rapidfuzz import fuzz

from pipelines.schemas import ChunkProvenance, ExtractedDocument, NormalizedChunk, PageRange
from pipelines.settings import SettingsBundle
from pipelines.utils import (
    dump_json,
    dump_jsonl,
    dump_text,
    ensure_dir,
    normalize_whitespace,
    strip_structural_noise,
    slugify,
    split_paragraphs,
    stable_id,
)


LOGGER = logging.getLogger(__name__)


MODULE_KEYWORDS = {
    "What the Rule of Law Is": ["rule of law", "definition", "principles", "accountability", "open government"],
    "Why the Rule of Law Matters": ["why it matters", "stability", "rights", "predictability", "trust"],
    "Why Lawyers Must Lead": ["lawyers", "judges", "oath", "public servant", "professional obligation"],
    "How to Communicate It Effectively": ["communicate", "audience", "question", "nonpartisan", "delivery"],
    "Ambassador Toolkit": ["checklist", "toolkit", "resources", "preparation", "presentation"],
    "Arizona-Specific Context": ["arizona", "state bar", "o'connor", "supreme court", "pima county"],
}


class NormalizationPipeline:
    def __init__(self, root_dir: Path, settings: SettingsBundle) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.extracted_dir = root_dir / settings.pipeline.directories["extracted"]
        self.output_dir = ensure_dir(root_dir / settings.pipeline.directories["normalized"])

    def run(self) -> list[NormalizedChunk]:
        index_path = self.extracted_dir / "index.json"
        if not index_path.exists():
            raise FileNotFoundError("Run ingestion before normalization.")
        documents = [ExtractedDocument.model_validate(item) for item in __import__("json").loads(index_path.read_text(encoding="utf-8"))["documents"]]
        chunks: list[NormalizedChunk] = []
        for document in documents:
            chunks.extend(self._normalize_document(document))
        self._assign_duplicate_clusters(chunks)
        dump_json(self.output_dir / "chunks.json", {"chunks": [chunk.model_dump() for chunk in chunks]})
        dump_jsonl(self.output_dir / "chunks.jsonl", [chunk.model_dump() for chunk in chunks])
        dump_text(self.output_dir / "chunks.md", self._chunks_to_markdown(chunks))
        return chunks

    def _normalize_document(self, document: ExtractedDocument) -> list[NormalizedChunk]:
        chunks: list[NormalizedChunk] = []
        current_heading: list[str] = []
        for page in document.pages:
            paragraphs = split_paragraphs(page.cleaned_text)
            if page.headings:
                current_heading = [page.headings[0]]
            for paragraph in paragraphs:
                if self._is_heading_paragraph(paragraph):
                    current_heading = [paragraph.strip()]
                    continue
                normalized_text = normalize_whitespace(paragraph)
                normalized_text = strip_structural_noise(normalized_text)
                if self._should_skip_paragraph(normalized_text, document):
                    continue
                if len(normalized_text) < 40:
                    continue
                content_type = self._classify_content_type(document, normalized_text, current_heading)
                candidate_modules = self._candidate_modules(normalized_text, current_heading)
                candidate_audience = self._candidate_audience(document, normalized_text)
                reuse_tags = self._reuse_tags(normalized_text, current_heading)
                tone_notes = self._tone_notes(document, normalized_text)
                provenance = ChunkProvenance(
                    authority=document.authority,
                    support_level="structure_only" if document.source_tier == 3 else "supported",
                    lineage=[document.document_id, f"page_{page.page_number}"],
                )
                chunks.append(
                    NormalizedChunk(
                        chunk_id=stable_id(document.document_id, str(page.page_number), normalized_text[:160], prefix="chunk"),
                        document_id=document.document_id,
                        source_filename=document.filename,
                        source_tier=document.source_tier,
                        page_range=PageRange(start=page.page_number, end=page.page_number),
                        heading_path=current_heading.copy(),
                        text=paragraph.strip(),
                        normalized_text=normalized_text,
                        content_type=content_type,
                        candidate_modules=candidate_modules,
                        candidate_audience=candidate_audience,
                        reuse_tags=reuse_tags,
                        tone_notes=tone_notes,
                        provenance=provenance,
                        validation_flags=["tier3_structure_only"] if document.source_tier == 3 else [],
                    )
                )
        return chunks

    def _is_heading_paragraph(self, paragraph: str) -> bool:
        stripped = paragraph.strip()
        return len(stripped.split()) <= 12 and stripped == stripped.title() and not stripped.endswith(".")

    def _classify_content_type(self, document: ExtractedDocument, text: str, heading_path: list[str]) -> str:
        lower = text.lower()
        heading = " ".join(heading_path).lower()
        if document.source_tier == 3:
            return "formatting_clue"
        if "appendix" in heading or "oath of admission" in lower:
            return "appendix"
        if document.role == "speaker_delivery" or "slide" in lower or "delivery" in lower:
            return "script"
        if lower.startswith(("if we don't protect", "on february", "lawyers and judges")) or "shared civic commitment" in lower:
            return "rhetorical"
        if any(token in lower for token in ("for example", "imagine", "story")):
            return "anecdotal"
        return "substantive"

    def _candidate_modules(self, text: str, heading_path: list[str]) -> list[str]:
        lower = f"{' '.join(heading_path)} {text}".lower()
        scored = []
        for module, keywords in MODULE_KEYWORDS.items():
            score = sum(keyword in lower for keyword in keywords)
            if score:
                scored.append((score, module))
        scored.sort(key=lambda item: item[0], reverse=True)
        matches = [module for _, module in scored]
        return matches or ["What the Rule of Law Is"]

    def _candidate_audience(self, document: ExtractedDocument, text: str) -> list[str]:
        lower = text.lower()
        audiences = {"community_groups", "civic_organizations"}
        if document.role == "speaker_delivery":
            audiences.add("lawyers")
        if any(token in lower for token in ("student", "school", "classroom", "teacher")):
            audiences.add("schools")
        if "lawyer" in lower or "judge" in lower:
            audiences.add("lawyers")
        return sorted(audiences)

    def _reuse_tags(self, text: str, heading_path: list[str]) -> list[str]:
        lower = f"{' '.join(heading_path)} {text}".lower()
        tags: set[str] = set()
        for token in ("definition", "principles", "accountability", "justice", "lawyers", "citizens", "resources", "arizona", "communication"):
            if token in lower:
                tags.add(token.replace(" ", "_"))
        return sorted(tags) or ["general_reference"]

    def _tone_notes(self, document: ExtractedDocument, text: str) -> list[str]:
        notes = []
        if document.source_tier == 1 and "why it matters" in text.lower():
            notes.append("civic_urgency")
        if document.role == "speaker_delivery":
            notes.append("spoken_delivery")
        if "nonpartisan" in text.lower():
            notes.append("explicit_nonpartisan")
        return notes

    def _assign_duplicate_clusters(self, chunks: list[NormalizedChunk]) -> None:
        parent = {chunk.chunk_id: chunk.chunk_id for chunk in chunks}

        def find(item: str) -> str:
            while parent[item] != item:
                parent[item] = parent[parent[item]]
                item = parent[item]
            return item

        def union(left: str, right: str) -> None:
            root_left = find(left)
            root_right = find(right)
            if root_left != root_right:
                parent[root_right] = root_left

        fingerprints: dict[str, str] = {}
        for chunk in chunks:
            fingerprint = re.sub(r"[^a-z0-9]+", "", chunk.normalized_text.lower())[:240]
            if fingerprint in fingerprints:
                union(chunk.chunk_id, fingerprints[fingerprint])
            else:
                fingerprints[fingerprint] = chunk.chunk_id

        for index, left in enumerate(chunks):
            for right in chunks[index + 1 :]:
                if left.source_tier == 3 and right.source_tier == 3:
                    continue
                similarity = fuzz.token_set_ratio(left.normalized_text, right.normalized_text)
                if similarity >= 93:
                    union(left.chunk_id, right.chunk_id)

        cluster_names: dict[str, str] = {}
        for chunk in chunks:
            root = find(chunk.chunk_id)
            members = [candidate for candidate in chunks if find(candidate.chunk_id) == root]
            if len(members) <= 1:
                continue
            if root not in cluster_names:
                cluster_names[root] = stable_id(root, prefix="dup")
            chunk.duplicate_cluster_id = cluster_names[root]

    def _chunks_to_markdown(self, chunks: list[NormalizedChunk]) -> str:
        lines = ["# Normalized Chunks", ""]
        for chunk in chunks:
            heading = " > ".join(chunk.heading_path) if chunk.heading_path else "Unlabeled"
            lines.append(f"## {chunk.chunk_id}")
            lines.append(f"- Source: `{chunk.source_filename}`")
            lines.append(f"- Pages: `{chunk.page_range.start}-{chunk.page_range.end}`")
            lines.append(f"- Content type: `{chunk.content_type}`")
            lines.append(f"- Heading path: `{heading}`")
            if chunk.duplicate_cluster_id:
                lines.append(f"- Duplicate cluster: `{chunk.duplicate_cluster_id}`")
            lines.append("")
            lines.append(chunk.text)
            lines.append("")
        return "\n".join(lines).strip() + "\n"

    def _should_skip_paragraph(self, text: str, document: ExtractedDocument) -> bool:
        lower = text.lower()
        skip_prefixes = (
            "chatgpt said:",
            "you said:",
            "understood.",
            "prepared for ",
            "presentation formats",
            "format duration slides notes",
        )
        if lower.startswith(skip_prefixes):
            return True
        if re.match(r"^slide\s+\d+", lower):
            return True
        if re.match(r"^\d+\s+minutes?$", lower):
            return True
        if lower in {"march 2026", "state bar of arizona", "times"}:
            return True
        if document.source_tier == 3:
            return any(token in lower for token in ("chatgpt", "you said", "draft a cogent"))
        return False
