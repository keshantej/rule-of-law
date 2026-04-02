import { PresentationRoute } from "@/components/presentation-route";
import { getWebExperience } from "@/lib/content";

export const dynamic = "force-static";

export default async function PresentationPage() {
  const experience = await getWebExperience();
  return <PresentationRoute experience={experience} mode="public" />;
}
