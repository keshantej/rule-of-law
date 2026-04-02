"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { PresentationShell } from "@/components/presentation-shell";
import type { WebExperience } from "@/lib/types";
import { normalizePresentationDuration } from "@/lib/utils";

interface PresentationRouteProps {
  experience: WebExperience;
  mode: "public" | "speaker" | "standalone";
}

export function PresentationRoute({ experience, mode }: PresentationRouteProps) {
  const searchParams = useSearchParams();
  const requestedDuration = searchParams.get("duration");
  const duration = normalizePresentationDuration(requestedDuration ? Number(requestedDuration) : 45);

  const scenes = useMemo(() => {
    const filtered = experience.presentation.scenes.filter((scene) => scene.duration_tags.includes(duration));
    return filtered.length ? filtered : experience.presentation.scenes.filter((scene) => scene.duration_tags.includes(45));
  }, [duration, experience.presentation.scenes]);

  const track = useMemo(
    () => experience.speaker_tracks.find((candidate) => candidate.minutes === duration) ?? experience.speaker_tracks.find((candidate) => candidate.minutes === 45),
    [duration, experience.speaker_tracks]
  );

  return (
    <PresentationShell
      scenes={scenes}
      track={track}
      mode={mode}
      resources={experience.resource_library}
      downloads={experience.downloads}
      currentDuration={duration}
      availableDurations={[20, 45, 60]}
    />
  );
}
