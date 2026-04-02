import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { filterScenesByDuration, mergeScene } from "@/lib/content";
import { normalizePresentationDuration } from "@/lib/utils";
import type { SceneOverrideDocument, WebExperience } from "@/lib/types";

const artifact = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "content", "generated", "web-experience.json"), "utf-8")
) as WebExperience;

describe("web experience content", () => {
  it("matches the expected scene count", () => {
    expect(artifact.presentation.scenes).toHaveLength(16);
  });

  it("filters scenes by duration tags", () => {
    const scenes = filterScenesByDuration(artifact.presentation.scenes, 20);
    expect(scenes.length).toBeGreaterThan(0);
    expect(scenes.every((scene) => scene.duration_tags.includes(20))).toBe(true);
  });

  it("normalizes unsupported durations back to the default presentation length", () => {
    expect(normalizePresentationDuration(45)).toBe(45);
    expect(normalizePresentationDuration(99)).toBe(45);
    expect(normalizePresentationDuration(undefined)).toBe(45);
  });

  it("merges presentation-safe overrides without mutating locked provenance fields", () => {
    const base = artifact.presentation.scenes[0];
    const override: SceneOverrideDocument = {
      _id: "override-1",
      scene_id: base.scene_id,
      override_type: "presentation_safe",
      title: "Updated Opening",
      display_lines: ["Updated line"]
    };

    const merged = mergeScene(base, override);
    expect(merged.title).toBe("Updated Opening");
    expect(merged.display_lines).toEqual(["Updated line"]);
    expect(merged.source_support).toEqual(base.source_support);
  });
});
