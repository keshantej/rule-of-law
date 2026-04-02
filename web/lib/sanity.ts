import type { SceneOverrideDocument } from "@/lib/types";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-01-01";
const readToken = process.env.SANITY_API_READ_TOKEN;

export const sanityEnabled = Boolean(projectId && dataset);

export async function fetchSceneOverrides(): Promise<SceneOverrideDocument[]> {
  if (!sanityEnabled || !projectId || !dataset) {
    return [];
  }
  const query = `*[_type == "sceneOverride"]{
    _id,
    scene_id,
    override_type,
    kicker,
    title,
    display_lines,
    visual_treatment,
    speaker_prompt,
    event_intro,
    local_context,
    generated_scaffolding_note,
    partner_links[]{
      label,
      href,
      description,
      is_placeholder
    }
  }`;
  const url = new URL(`https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`);
  url.searchParams.set("query", query);

  const response = await fetch(url.toString(), {
    headers: readToken ? { Authorization: `Bearer ${readToken}` } : undefined,
    cache: "force-cache"
  });
  if (!response.ok) {
    return [];
  }
  const payload = (await response.json()) as { result?: SceneOverrideDocument[] };
  return payload.result ?? [];
}
