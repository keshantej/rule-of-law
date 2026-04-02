from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ExtractedPage(BaseModel):
    page_number: int
    raw_text: str
    cleaned_text: str
    headings: list[str] = Field(default_factory=list)
    line_count: int = 0
    low_confidence: bool = False
    ocr_repaired: bool = False


class ExtractedDocument(BaseModel):
    document_id: str
    filename: str
    source_tier: int
    role: str
    authority: str
    page_count: int
    boilerplate_lines: list[str] = Field(default_factory=list)
    extraction_warnings: list[str] = Field(default_factory=list)
    pages: list[ExtractedPage] = Field(default_factory=list)


class PageRange(BaseModel):
    start: int
    end: int


class ChunkProvenance(BaseModel):
    authority: str
    support_level: str
    lineage: list[str] = Field(default_factory=list)


class NormalizedChunk(BaseModel):
    chunk_id: str
    document_id: str
    source_filename: str
    source_tier: int
    page_range: PageRange
    heading_path: list[str] = Field(default_factory=list)
    text: str
    normalized_text: str
    content_type: Literal["substantive", "rhetorical", "anecdotal", "script", "appendix", "formatting_clue"]
    candidate_modules: list[str] = Field(default_factory=list)
    candidate_audience: list[str] = Field(default_factory=list)
    reuse_tags: list[str] = Field(default_factory=list)
    tone_notes: list[str] = Field(default_factory=list)
    duplicate_cluster_id: str | None = None
    provenance: ChunkProvenance
    validation_flags: list[str] = Field(default_factory=list)


class CanonicalValidation(BaseModel):
    supported: bool
    confidence: float
    flags: list[str] = Field(default_factory=list)


class CanonicalUnit(BaseModel):
    canonical_id: str
    bucket: str
    title: str
    canonical_status: Literal["directly_sourced", "lightly_transformed", "synthesized", "generated_scaffolding"]
    summary: str
    key_points: list[str] = Field(default_factory=list)
    quotes: list[str] = Field(default_factory=list)
    audience_level: str = "general_public"
    tone_notes: list[str] = Field(default_factory=list)
    supporting_chunk_ids: list[str] = Field(default_factory=list)
    supporting_sources: list[str] = Field(default_factory=list)
    downstream_uses: list[str] = Field(default_factory=list)
    validation: CanonicalValidation


class ManualChecklist(BaseModel):
    title: str
    items: list[str] = Field(default_factory=list)


class ManualSection(BaseModel):
    section_id: str
    title: str
    body_markdown: str
    callouts: list[str] = Field(default_factory=list)
    checklists: list[ManualChecklist] = Field(default_factory=list)
    pull_quotes: list[str] = Field(default_factory=list)
    source_support: list[str] = Field(default_factory=list)
    generated_scaffolding: list[str] = Field(default_factory=list)


class ManualArtifact(BaseModel):
    title: str
    sections: list[ManualSection] = Field(default_factory=list)


class SlideArtifact(BaseModel):
    slide_number: int
    title: str
    body_lines: list[str] = Field(default_factory=list)
    speaker_notes: str
    visual_suggestion: str
    optional_quote: str | None = None
    source_support: list[str] = Field(default_factory=list)


class DeckArtifact(BaseModel):
    slides: list[SlideArtifact] = Field(default_factory=list)


class SpeakerOnlyBlock(BaseModel):
    title: str
    body: str


class WebScene(BaseModel):
    scene_id: str
    slug: str
    title: str
    kicker: str
    display_lines: list[str] = Field(default_factory=list)
    speaker_notes: str
    duration_tags: list[int] = Field(default_factory=list)
    audience_mode: Literal["public", "shared"]
    visual_treatment: str
    speaker_only_blocks: list[SpeakerOnlyBlock] = Field(default_factory=list)
    resource_refs: list[str] = Field(default_factory=list)
    source_support: list[str] = Field(default_factory=list)
    generated_scaffolding: list[str] = Field(default_factory=list)


class WebPresentation(BaseModel):
    title: str
    scenes: list[WebScene] = Field(default_factory=list)


class SpeakerTrackStep(BaseModel):
    scene_id: str
    minutes: int
    cue: str


class SpeakerTrack(BaseModel):
    minutes: int
    title: str
    scene_ids: list[str] = Field(default_factory=list)
    steps: list[SpeakerTrackStep] = Field(default_factory=list)
    transition_note: str = ""


class ToolkitItem(BaseModel):
    toolkit_id: str
    type: str
    title: str
    body: str
    audience: str
    speaker_only: bool = False
    source_support: list[str] = Field(default_factory=list)


class ResourceLink(BaseModel):
    label: str
    href: str
    description: str = ""
    is_placeholder: bool = False


class ResourceGroup(BaseModel):
    resource_group_id: str
    title: str
    description: str
    links: list[ResourceLink] = Field(default_factory=list)
    source_support: list[str] = Field(default_factory=list)


class DownloadAsset(BaseModel):
    asset_id: str
    title: str
    format: str
    href: str
    description: str = ""
    source_path: str


class ProvenanceEntry(BaseModel):
    ref_id: str
    title: str
    source_support: list[str] = Field(default_factory=list)
    generated_scaffolding: list[str] = Field(default_factory=list)


class QAAnnotation(BaseModel):
    annotation_id: str
    level: Literal["info", "warning"]
    message: str
    ref_ids: list[str] = Field(default_factory=list)


class WebExperienceArtifact(BaseModel):
    presentation: WebPresentation
    speaker_tracks: list[SpeakerTrack] = Field(default_factory=list)
    speaker_toolkit: list[ToolkitItem] = Field(default_factory=list)
    resource_library: list[ResourceGroup] = Field(default_factory=list)
    downloads: list[DownloadAsset] = Field(default_factory=list)
    provenance_index: list[ProvenanceEntry] = Field(default_factory=list)
    qa_annotations: list[QAAnnotation] = Field(default_factory=list)


class FieldGuideBlock(BaseModel):
    title: str
    minutes: int
    script: str
    transition: str
    engagement_prompt: str
    likely_questions: list[str] = Field(default_factory=list)
    speaker_tip: str
    source_support: list[str] = Field(default_factory=list)


class FieldGuideVersion(BaseModel):
    minutes: int
    blocks: list[FieldGuideBlock] = Field(default_factory=list)


class HandoutSection(BaseModel):
    title: str
    body: str
    source_support: list[str] = Field(default_factory=list)


class FieldGuideArtifact(BaseModel):
    versions: list[FieldGuideVersion] = Field(default_factory=list)


class HandoutArtifact(BaseModel):
    title: str
    sections: list[HandoutSection] = Field(default_factory=list)


class QuizQuestion(BaseModel):
    question: str
    choices: list[str] = Field(default_factory=list)
    answer: str
    rationale: str


class LMSModule(BaseModel):
    module_id: str
    title: str
    learning_objectives: list[str] = Field(default_factory=list)
    overview: str
    lesson_body_markdown: str
    key_takeaways: list[str] = Field(default_factory=list)
    reflection_questions: list[str] = Field(default_factory=list)
    quiz_questions: list[QuizQuestion] = Field(default_factory=list)
    discussion_prompt: str | None = None
    source_support: list[str] = Field(default_factory=list)
    generated_scaffolding: list[str] = Field(default_factory=list)


class LMSArtifact(BaseModel):
    modules: list[LMSModule] = Field(default_factory=list)


class DeliverableTraceUnit(BaseModel):
    unit_id: str
    title: str
    source_support: list[str] = Field(default_factory=list)
    generated_scaffolding: list[str] = Field(default_factory=list)


class DeliverableTrace(BaseModel):
    deliverable_id: str
    artifact_type: str
    generated_at: str
    units: list[DeliverableTraceUnit] = Field(default_factory=list)


class QAItem(BaseModel):
    name: str
    status: Literal["pass", "warning", "fail"]
    message: str
    artifact: str | None = None
    details: list[str] = Field(default_factory=list)


class QAReport(BaseModel):
    run_id: str
    generated_at: str
    overall_status: Literal["pass", "warning", "fail"]
    checks: list[QAItem] = Field(default_factory=list)
    summary: str


class ArtifactBundle(BaseModel):
    artifact_id: str
    title: str
    paths: dict[str, str]
    traceability: str
    qa_summary: str
