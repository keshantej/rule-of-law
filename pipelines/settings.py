from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from pydantic import BaseModel, Field

from pipelines.utils import expand_env_tree, load_yaml


class SourceDefinition(BaseModel):
    id: str
    filename: str
    path: str
    tier: int
    role: str
    authority: str
    required: bool = True
    notes: str = ""


class SourceManifest(BaseModel):
    program: dict[str, Any]
    sources: list[SourceDefinition] = Field(default_factory=list)


class PipelineConfig(BaseModel):
    program: dict[str, Any]
    directories: dict[str, str]
    artifact_sequence: list[str]
    canonical_buckets: list[str]
    manual_structure: list[str]
    deck_structure: list[str]
    presentation_structure: list[str] = Field(default_factory=list)
    lms_modules: list[str]
    audiences: dict[str, dict[str, Any]]
    taxonomy: dict[str, list[str]]
    qa: dict[str, Any]
    packaging: dict[str, str]


class RoutingConfig(BaseModel):
    defaults: dict[str, Any]
    clients: dict[str, dict[str, Any]]
    routes: dict[str, dict[str, Any]]


class SettingsBundle(BaseModel):
    root_dir: Path
    pipeline: PipelineConfig
    routing: RoutingConfig
    source_manifest: SourceManifest


def load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return
    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def load_settings(root_dir: Path) -> SettingsBundle:
    load_dotenv(root_dir / ".env")
    pipeline_path = root_dir / "config" / "pipeline.yaml"
    routing_path = root_dir / "config" / "model_routing.yaml"
    pipeline_raw = expand_env_tree(load_yaml(pipeline_path))
    routing_raw = expand_env_tree(load_yaml(routing_path))
    manifest_path = root_dir / pipeline_raw["program"]["source_manifest"]
    manifest_raw = expand_env_tree(load_yaml(manifest_path))
    return SettingsBundle(
        root_dir=root_dir,
        pipeline=PipelineConfig.model_validate(pipeline_raw),
        routing=RoutingConfig.model_validate(routing_raw),
        source_manifest=SourceManifest.model_validate(manifest_raw),
    )
