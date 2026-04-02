from __future__ import annotations

from pathlib import Path

from pipelines.canonicalize import CanonicalPipeline
from pipelines.deck_generator import DeckGenerator
from pipelines.field_guide_generator import FieldGuideGenerator
from pipelines.ingestion import IngestionPipeline
from pipelines.lms_generator import LMSGenerator
from pipelines.manual_generator import ManualGenerator
from pipelines.model_clients import ModelRouter
from pipelines.normalization import NormalizationPipeline
from pipelines.qa_engine import QAEngine
from pipelines.settings import SettingsBundle, load_settings
from pipelines.utils import configure_logging, stable_id, utc_now
from pipelines.web_experience_generator import WebExperienceGenerator


class PipelineOrchestrator:
    def __init__(self, root_dir: Path) -> None:
        self.root_dir = root_dir
        self.settings: SettingsBundle = load_settings(root_dir)
        timestamp = utc_now().strftime("%Y%m%dT%H%M%SZ")
        self.run_id = stable_id(root_dir.as_posix(), timestamp, prefix="run")
        self.log_path = configure_logging(root_dir / self.settings.pipeline.directories["logs"], self.run_id)
        self.router = ModelRouter(self.settings.routing)

    def run_ingest(self):
        return IngestionPipeline(self.root_dir, self.settings, self.router).run()

    def run_normalize(self):
        if not (self.root_dir / self.settings.pipeline.directories["extracted"] / "index.json").exists():
            self.run_ingest()
        return NormalizationPipeline(self.root_dir, self.settings).run()

    def run_canonicalize(self):
        if not (self.root_dir / self.settings.pipeline.directories["normalized"] / "chunks.json").exists():
            self.run_normalize()
        return CanonicalPipeline(self.root_dir, self.settings, self.router).run()

    def run_manual(self):
        if not (self.root_dir / self.settings.pipeline.directories["canonical"] / "canonical_corpus.json").exists():
            self.run_canonicalize()
        return ManualGenerator(self.root_dir, self.settings, self.router).run()

    def run_deck(self):
        if not (self.root_dir / "outputs" / "intermediate" / "manual.json").exists():
            self.run_manual()
        return DeckGenerator(self.root_dir, self.settings, self.router).run()

    def run_field_guide(self):
        if not (self.root_dir / "outputs" / "intermediate" / "manual.json").exists():
            self.run_manual()
        return FieldGuideGenerator(self.root_dir, self.settings, self.router).run()

    def run_web_experience(self):
        if not (self.root_dir / "outputs" / "intermediate" / "field_guide.json").exists():
            self.run_field_guide()
        if not (self.root_dir / "outputs" / "intermediate" / "handout.json").exists():
            self.run_field_guide()
        return WebExperienceGenerator(self.root_dir, self.settings, self.router).run()

    def run_lms(self):
        if not (self.root_dir / "outputs" / "intermediate" / "manual.json").exists():
            self.run_manual()
        return LMSGenerator(self.root_dir, self.settings, self.router).run()

    def run_qa(self):
        if not (self.root_dir / "outputs" / "intermediate" / "lms.json").exists() or not (self.root_dir / "outputs" / "intermediate" / "web_experience.json").exists():
            self.run_all(generate_qa=False)
        return QAEngine(self.root_dir, self.settings, self.router, self.run_id).run()

    def run_all(self, generate_qa: bool = True):
        self.run_ingest()
        self.run_normalize()
        self.run_canonicalize()
        self.run_manual()
        self.run_field_guide()
        self.run_web_experience()
        self.run_lms()
        if generate_qa:
            return self.run_qa()
        return None
