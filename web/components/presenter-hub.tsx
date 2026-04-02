"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, Clock3, Download, Mic2 } from "lucide-react";

import type { DownloadAsset, SpeakerTrack, ToolkitItem } from "@/lib/types";

const trackDescriptions: Record<number, string> = {
  20: "A focused overview covering the definition of the Rule of Law, why it matters, and a call to action. Best suited for brief introductions at luncheons, committee meetings, or community welcome events.",
  45: "The standard Ambassador format. Covers all four core principles in depth with time for audience discussion and reflection. Recommended for bar association events, civic organizations, and educational settings.",
  60: "The comprehensive format with expanded discussion, Arizona-specific context, and guided audience participation. Ideal for CLE sessions, law school seminars, and dedicated civic education workshops."
};

interface PresenterHubProps {
  tracks: SpeakerTrack[];
  items: ToolkitItem[];
  downloads: DownloadAsset[];
}

function CollapsibleScript({ item }: { item: ToolkitItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <ChevronRight className={`h-4 w-4 text-paper/25 transition ${open ? "rotate-90" : ""}`} />
          <span className="text-base font-semibold text-white/80 transition group-hover:text-white">{item.title}</span>
        </div>
        <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-paper/25">
          {item.type === "talk_track" ? "Script" : "Guide"}
        </span>
      </button>
      {open ? (
        <div className="pb-4 pl-7">
          <p className="whitespace-pre-line text-sm leading-7 text-white/45">{item.body}</p>
        </div>
      ) : null}
    </div>
  );
}

export function PresenterHub({ tracks, items, downloads }: PresenterHubProps) {
  const supportItems = items.filter((item) => item.type !== "talk_track");
  const talkTracks = items.filter((item) => item.type === "talk_track");
  const recommendedTrack = tracks.find((track) => track.minutes === 45) ?? tracks[0];

  return (
    <main className="px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Presenter Preparation</p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-4xl">
          Preparation materials for your Rule of Law presentation.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/45">
          Select a presentation format, review the corresponding talk track, and familiarize yourself with the facilitation guidance before your session. Each format is tailored to different event contexts and audience sizes.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href={`/presentation/speaker?duration=${recommendedTrack?.minutes ?? 45}`} className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold/90">
            Open presenter mode
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/certification" className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-5 py-3 text-sm font-medium text-paper/50 transition hover:border-white/15 hover:text-white/70">
            Review certification
          </Link>
        </div>

        {/* Format selector */}
        <section className="mt-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Presentation Formats</p>
          <p className="mt-1.5 text-sm text-white/35">Each format covers the same core material, adapted for different event durations and audience contexts.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tracks.map((track) => (
              <Link
                key={track.minutes}
                href={`/presentation/speaker?duration=${track.minutes}`}
                className="group flex flex-col justify-between rounded-xl bg-white/[0.02] p-5 ring-1 ring-white/[0.04] transition hover:bg-white/[0.04] hover:ring-gold/15"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white/70">
                      <Clock3 className="h-3.5 w-3.5 text-gold/50" />
                      <span className="text-2xl font-semibold tracking-tight">{track.minutes} min</span>
                    </div>
                    {track.minutes === 45 && (
                      <span className="rounded-md bg-gold/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-gold/70">Recommended</span>
                    )}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-white/35">{trackDescriptions[track.minutes] ?? `${track.scene_ids.length} scenes covering the Rule of Law.`}</p>
                  <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-white/25">
                    <span>{track.scene_ids.length} scenes</span>
                    <span>{track.steps.length} timed sections</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-gold/50 transition group-hover:text-gold/80">
                  Open presenter mode
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Scene breakdown for each track */}
        <section className="mt-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Scene Breakdown by Format</p>
          <p className="mt-1.5 text-sm text-white/35">Review the timed sequence of topics for each presentation length.</p>
          <div className="mt-5 grid gap-6 xl:grid-cols-3">
            {tracks.map((track) => (
              <div key={track.minutes} className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.04]">
                <p className="text-sm font-semibold text-white/70">{track.minutes}-Minute Format</p>
                <div className="mt-3 space-y-1">
                  {track.steps.map((step, i) => (
                    <div key={step.scene_id} className="flex items-center justify-between py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-4 text-[10px] text-white/20">{i + 1}</span>
                        <span className="text-white/45">{step.cue}</span>
                      </div>
                      <span className="text-white/25">{step.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Two-column: scripts + sidebar */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-12">
            {/* Talk tracks */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Scripted Talk Tracks</p>
              <p className="mt-1.5 text-sm leading-6 text-white/35">Each talk track provides a complete, scripted guide for its corresponding presentation format. Expand a track to review the full script, including section-by-section talking points and transitions.</p>
              <div className="mt-4 divide-y divide-white/[0.04]">
                {talkTracks.map((item) => (
                  <CollapsibleScript key={item.toolkit_id} item={item} />
                ))}
              </div>
            </section>

            {/* Facilitation guidance */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Facilitation Guidance</p>
              <p className="mt-1.5 text-sm leading-6 text-white/35">Practical resources for handling audience questions, managing discussion, and ensuring a productive, nonpartisan civic conversation.</p>
              <div className="mt-4 divide-y divide-white/[0.04]">
                {supportItems.map((item) => (
                  <CollapsibleScript key={item.toolkit_id} item={item} />
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-8 lg:sticky lg:top-[72px] lg:h-fit">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Preparation Checklist</p>
              <div className="mt-3 space-y-2.5 text-xs leading-5 text-white/35">
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
                  <p>Confirm presentation format and duration with your event organizer.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
                  <p>Read through the corresponding talk track at least once before presenting.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
                  <p>Review the difficult-questions guidance to prepare for audience discussion.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
                  <p>Open presenter mode and verify your display setup before the audience arrives.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gold/40" />
                  <p>Prepare printed copies of the audience handout and field guide for distribution.</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Quick links</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link href="/presentation/speaker" className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-xs text-paper/40 transition hover:text-gold/70">
                  Presenter mode
                </Link>
                <Link href="/resources" className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-xs text-paper/40 transition hover:text-gold/70">
                  Resources
                </Link>
                <Link href="/presentation" className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-xs text-paper/40 transition hover:text-gold/70">
                  Presentation
                </Link>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Downloads</p>
              <div className="mt-3 space-y-1">
                {downloads.map((asset) => (
                  <Link key={asset.asset_id} href={asset.href} className="group flex items-center justify-between py-2 text-xs">
                    <span className="text-paper/40 transition group-hover:text-gold/70">{asset.title}</span>
                    <Download className="h-3 w-3 text-paper/20 transition group-hover:text-gold/50" />
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
