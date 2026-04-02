import { CertificationShell } from "@/components/certification-shell";
import { getDownloads, getLmsArtifact } from "@/lib/content";

export const dynamic = "force-static";

export default async function CertificationPage() {
  const [lms, downloads] = await Promise.all([getLmsArtifact(), getDownloads()]);
  return <CertificationShell lms={lms} downloads={downloads} />;
}
