from __future__ import annotations

import logging
import re
from collections import Counter
from pathlib import Path

import pdfplumber
from pypdf import PdfReader

from pipelines.model_clients import ModelRouter
from pipelines.schemas import ExtractedDocument, ExtractedPage
from pipelines.settings import SettingsBundle, SourceDefinition
from pipelines.utils import dump_json, dump_text, ensure_dir, normalize_whitespace, slugify


LOGGER = logging.getLogger(__name__)


class IngestionPipeline:
    def __init__(self, root_dir: Path, settings: SettingsBundle, router: ModelRouter) -> None:
        self.root_dir = root_dir
        self.settings = settings
        self.router = router
        self.output_dir = ensure_dir(root_dir / settings.pipeline.directories["extracted"])

    def run(self) -> list[ExtractedDocument]:
        documents: list[ExtractedDocument] = []
        for source in self.settings.source_manifest.sources:
            source_path = self.root_dir / source.path
            if not source_path.exists():
                message = f"Missing source: {source.filename}"
                if source.required:
                    raise FileNotFoundError(message)
                LOGGER.info(message)
                continue
            document = self._extract_document(source, source_path)
            documents.append(document)
            dump_json(self.output_dir / f"{source.id}.json", document.model_dump())
            dump_text(self.output_dir / f"{source.id}.md", self._document_to_markdown(document))
        dump_json(self.output_dir / "index.json", {"documents": [doc.model_dump() for doc in documents]})
        return documents

    def _extract_document(self, source: SourceDefinition, source_path: Path) -> ExtractedDocument:
        raw_pages = self._extract_raw_pages(source_path)
        boilerplate = self._detect_boilerplate(raw_pages)
        pages: list[ExtractedPage] = []
        warnings: list[str] = []
        for index, raw_text in enumerate(raw_pages, start=1):
            cleaned_text = self._remove_boilerplate(raw_text, boilerplate)
            cleaned_text = normalize_whitespace(cleaned_text)
            headings = [line for line in cleaned_text.splitlines() if self._is_heading_line(line)]
            low_confidence = self._is_low_confidence(cleaned_text)
            ocr_repaired = False
            if low_confidence:
                warnings.append(f"Low-confidence extraction on page {index}")
                repaired = self._repair_low_confidence_text(cleaned_text)
                if repaired:
                    cleaned_text = repaired
                    ocr_repaired = True
            if not cleaned_text:
                warnings.append(f"Blank extraction on page {index}")
            pages.append(
                ExtractedPage(
                    page_number=index,
                    raw_text=raw_text,
                    cleaned_text=cleaned_text,
                    headings=headings,
                    line_count=len([line for line in cleaned_text.splitlines() if line.strip()]),
                    low_confidence=low_confidence,
                    ocr_repaired=ocr_repaired,
                )
            )
        return ExtractedDocument(
            document_id=source.id,
            filename=source.filename,
            source_tier=source.tier,
            role=source.role,
            authority=source.authority,
            page_count=len(pages),
            boilerplate_lines=boilerplate,
            extraction_warnings=warnings,
            pages=pages,
        )

    def _extract_raw_pages(self, path: Path) -> list[str]:
        texts: list[str] = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text(x_tolerance=1.5, y_tolerance=3) or ""
                texts.append(text)
        if any(text.strip() for text in texts):
            return texts
        reader = PdfReader(str(path))
        return [(page.extract_text() or "") for page in reader.pages]

    def _detect_boilerplate(self, pages: list[str]) -> list[str]:
        line_counter: Counter[str] = Counter()
        for page in pages:
            page_lines = {line.strip() for line in page.splitlines() if 5 <= len(line.strip()) <= 120}
            line_counter.update(page_lines)
        threshold = max(3, max(1, len(pages) // 2))
        return [
            line
            for line, count in line_counter.items()
            if count >= threshold and not line.lower().startswith("page ")
        ]

    def _remove_boilerplate(self, text: str, boilerplate: list[str]) -> str:
        boilerplate_set = {line.strip() for line in boilerplate}
        kept = [line for line in text.splitlines() if line.strip() and line.strip() not in boilerplate_set]
        return "\n".join(kept)

    def _is_heading_line(self, line: str) -> bool:
        stripped = line.strip()
        if not stripped or len(stripped) > 100 or len(stripped.split()) > 14:
            return False
        if stripped.startswith(("•", "-", "*")):
            return False
        letters = [char for char in stripped if char.isalpha()]
        if not letters:
            return False
        uppercase_ratio = sum(char.isupper() for char in letters) / len(letters)
        titleish = sum(word[:1].isupper() for word in stripped.split()) / max(1, len(stripped.split()))
        return uppercase_ratio > 0.7 or titleish > 0.8 or stripped.endswith(":")

    def _is_low_confidence(self, text: str) -> bool:
        if len(text.strip()) < 80:
            return True
        characters = [char for char in text if not char.isspace()]
        if not characters:
            return True
        alpha_ratio = sum(char.isalpha() for char in characters) / len(characters)
        return alpha_ratio < 0.55

    def _repair_low_confidence_text(self, text: str) -> str | None:
        if not self.router.is_route_live("extraction_cleanup"):
            return None
        system_prompt = (
            "Repair garbled PDF extraction text conservatively. Preserve meaning, avoid invention, "
            "and return plain text only."
        )
        repaired = self.router.try_generate_text("extraction_cleanup", system_prompt, text[:3500])
        return normalize_whitespace(repaired) if repaired else None

    def _document_to_markdown(self, document: ExtractedDocument) -> str:
        lines = [f"# {document.filename}", ""]
        lines.append(f"- Document ID: `{document.document_id}`")
        lines.append(f"- Tier: `{document.source_tier}`")
        lines.append(f"- Role: `{document.role}`")
        lines.append("")
        for page in document.pages:
            lines.append(f"## Page {page.page_number}")
            if page.headings:
                lines.append(f"_Headings: {', '.join(page.headings)}_")
            lines.append("")
            lines.append(page.cleaned_text)
            lines.append("")
        return "\n".join(lines).strip() + "\n"
