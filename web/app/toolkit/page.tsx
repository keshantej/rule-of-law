import { PresenterHub } from "@/components/presenter-hub";
import { getDownloads, getToolkitItems, getWebExperience } from "@/lib/content";

export const dynamic = "force-static";

export default async function ToolkitPage() {
  const [items, downloads, experience] = await Promise.all([getToolkitItems(), getDownloads(), getWebExperience()]);
  const tracks = experience.speaker_tracks.sort((a, b) => a.minutes - b.minutes);
  return <PresenterHub tracks={tracks} items={items} downloads={downloads} />;
}
