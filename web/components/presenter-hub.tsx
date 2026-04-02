"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, ChevronRight, Clock3, Download, Mic2 } from "lucide-react";

import type { DownloadAsset, SpeakerTrack, ToolkitItem } from "@/lib/types";

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
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Presenter</p>
        <h1 className="mt-3 max-w-xl text-3xl font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-4xl">
          Review, rehearse, deliver.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-white/45">
          Pick a talk length, study the script, then open presenter mode for the live session.
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Choose a format</p>
          <div className="mt-5 grid gap-px overflow-hidden rounded-2xl bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-4">
            {tracks.map((track) => (
              <Link
                key={track.minutes}
                href={`/presentation/speaker?duration=${track.minutes}`}
                className="group flex flex-col justify-between bg-[#0f1a2a] p-5 transition hover:bg-[#141f33]"
              >
                <div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock3 className="h-3.5 w-3.5 text-gold/50" />
                    <span className="text-2xl font-semibold tracking-tight">{track.minutes}m</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-white/35">{track.scene_ids.length} scenes</p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gold/50 transition group-hover:text-gold/80">
                  Open
                  <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Two-column: scripts + sidebar */}
        <div className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="space-y-12">
            {/* Talk tracks */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Talk tracks</p>
              <p className="mt-1 text-sm text-white/35">Expand a script to review.</p>
              <div className="mt-4 divide-y divide-white/[0.04]">
                {talkTracks.map((item) => (
                  <CollapsibleScript key={item.toolkit_id} item={item} />
                ))}
              </div>
            </section>

            {/* Facilitation guidance */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Facilitation</p>
              <p className="mt-1 text-sm text-white/35">Difficult questions, checklists, and speaker support.</p>
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
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Before you present</p>
              <div className="mt-3 space-y-2.5 text-xs leading-5 text-white/35">
                <p>Confirm the talk length.</p>
                <p>Review difficult-questions guidance.</p>
                <p>Open presenter mode before the session.</p>
                <p>Have the handout and field guide ready.</p>
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
