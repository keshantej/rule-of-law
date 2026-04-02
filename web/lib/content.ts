import fs from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

import { fetchSceneOverrides } from "@/lib/sanity";
import type { DownloadAsset, LMSArtifact, ResourceGroup, ResourceLink, SceneOverrideDocument, SpeakerTrack, ToolkitItem, WebExperience, WebScene } from "@/lib/types";

const generatedPath = path.join(process.cwd(), "content", "generated", "web-experience.json");
const generatedLmsPath = path.join(process.cwd(), "content", "generated", "lms.json");

async function readGeneratedSeed(): Promise<WebExperience> {
  const raw = await fs.readFile(generatedPath, "utf-8");
  return JSON.parse(raw) as WebExperience;
}

async function readGeneratedLms(): Promise<LMSArtifact> {
  const raw = await fs.readFile(generatedLmsPath, "utf-8");
  return JSON.parse(raw) as LMSArtifact;
}

export function mergeScene(scene: WebScene, override?: SceneOverrideDocument): WebScene {
  if (!override) {
    return scene;
  }
  const speakerBlocks = [...scene.speaker_only_blocks];
  if (override.speaker_prompt) {
    speakerBlocks.unshift({ title: "Event Speaker Prompt", body: override.speaker_prompt });
  }
  if (override.event_intro) {
    speakerBlocks.unshift({ title: "Event Intro", body: override.event_intro });
  }
  if (override.local_context) {
    speakerBlocks.unshift({ title: "Local Context", body: override.local_context });
  }
  return {
    ...scene,
    kicker: override.kicker ?? scene.kicker,
    title: override.title ?? scene.title,
    display_lines: override.display_lines ?? scene.display_lines,
    visual_treatment: override.visual_treatment ?? scene.visual_treatment,
    speaker_only_blocks: speakerBlocks,
    generated_scaffolding: [
      ...scene.generated_scaffolding,
      `Sanity override applied (${override.override_type}).`,
      ...(override.generated_scaffolding_note ? [override.generated_scaffolding_note] : [])
    ]
  };
}

export function mergeResources(resourceLibrary: ResourceGroup[], overrides: SceneOverrideDocument[]): ResourceGroup[] {
  const partnerOverride = overrides.find(
    (override) => Array.isArray(override.partner_links) && override.partner_links.length > 0 && override.override_type === "presentation_safe"
  );
  if (!partnerOverride) {
    return resourceLibrary;
  }
  return resourceLibrary.map((group) =>
    group.resource_group_id === "resources_arizona-partners"
      ? { ...group, links: partnerOverride.partner_links as ResourceLink[] }
      : group
  );
}

export function filterScenesByDuration(scenes: WebScene[], duration?: number) {
  if (!duration) {
    return scenes;
  }
  return scenes.filter((scene) => scene.duration_tags.includes(duration));
}

export const getWebExperience = cache(async (): Promise<WebExperience> => {
  const [seed, overrides] = await Promise.all([readGeneratedSeed(), fetchSceneOverrides()]);
  const overrideMap = new Map(overrides.map((override) => [override.scene_id, override]));
  return {
    ...seed,
    presentation: {
      ...seed.presentation,
      scenes: seed.presentation.scenes.map((scene) => mergeScene(scene, overrideMap.get(scene.scene_id)))
    },
    resource_library: mergeResources(seed.resource_library, overrides)
  };
});

export async function getPresentationScenes(duration?: number): Promise<WebScene[]> {
  const data = await getWebExperience();
  return filterScenesByDuration(data.presentation.scenes, duration);
}

export async function getSpeakerTrack(duration: number): Promise<SpeakerTrack | undefined> {
  const data = await getWebExperience();
  return data.speaker_tracks.find((track) => track.minutes === duration);
}

export async function getToolkitItems(): Promise<ToolkitItem[]> {
  const data = await getWebExperience();
  return data.speaker_toolkit;
}

export async function getResourceGroups(): Promise<ResourceGroup[]> {
  const data = await getWebExperience();
  return data.resource_library;
}

export async function getDownloads(): Promise<DownloadAsset[]> {
  const data = await getWebExperience();
  return data.downloads;
}

export const getLmsArtifact = cache(async (): Promise<LMSArtifact> => readGeneratedLms());
