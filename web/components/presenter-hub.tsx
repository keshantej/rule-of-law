"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Clock3, Mic2, NotebookText, Presentation, ShieldCheck } from "lucide-react";

import type { DownloadAsset, SpeakerTrack, ToolkitItem } from "@/lib/types";

interface PresenterHubProps {
  tracks: SpeakerTrack[];
  items: ToolkitItem[];
  downloads: DownloadAsset[];
}

function CollapsibleScript({ item }: { item: ToolkitItem }) {
  const [open, setOpen] = useState(false);

  return (
    <article className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-white/[0.02]"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">{item.type.replaceAll("_", " ")}</p>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">{item.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/30 sm:block">
            {item.type === "talk_track" ? "Speaker script" : "Presenter support"}
          </span>
          <ChevronDown className={`h-4 w-4 text-paper/40 transition ${open ? "rotate-180" : ""}`} />
        </div>
      </button>
      {open ? (
        <div className="border-t border-white/[0.04] px-5 py-5">
          <p className="whitespace-pre-line text-sm leading-7 text-white/50">{item.body}</p>
        </div>
      ) : null}
    </article>
  );
}

export function PresenterHub({ tracks, items, downloads }: PresenterHubProps) {
  const supportItems = items.filter((item) => item.type !== "talk_track");
  const talkTracks = items.filter((item) => item.type === "talk_track");
  const recommendedTrack = tracks.find((track) => track.minutes === 45) ?? tracks[0];

  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
          <Mic2 className="h-3.5 w-3.5" />
          Presenter
        </div>
        <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-white md:text-5xl">
          Choose the talk length, review the script, and rehearse.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/55">
          This page is for speaker preparation. Use it to review the talk track, check the timing, and keep the presentation files close at hand.
        </p>

        {/* Start here + checklist */}
        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Start here</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_17rem]">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Pick the format that fits the room, then rehearse from presenter mode.</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-white/50">
                  Most speakers should start with the 45-minute version, then shorten or expand if the schedule requires it.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href={`/presentation/speaker?duration=${recommendedTrack?.minutes ?? 45}`} className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold/90">
                    Open recommended presenter mode
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/certification" className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 py-3 text-sm font-medium text-paper/60 transition hover:border-gold/30 hover:text-gold">
                    Review certification
                  </Link>
                </div>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">Suggested sequence</p>
                <div className="mt-4 space-y-3 text-xs leading-6 text-white/50">
                  <div className="flex items-start gap-2.5">
                    <Mic2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                    <p><span className="font-medium text-white/70">Choose a timed format</span> that matches the room.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <NotebookText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                    <p><span className="font-medium text-white/70">Review the script and notes</span> before opening speaker mode.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Presentation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                    <p><span className="font-medium text-white/70">Switch to Presentation</span> or Standalone for the audience.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Preparation checklist</p>
            <div className="mt-4 space-y-2.5 text-xs leading-6 text-white/45">
              <p>Confirm the talk length.</p>
              <p>Review the script and difficult-questions guidance.</p>
              <p>Open presenter mode before the session begins.</p>
              <p>Keep the handout and field guide ready to share.</p>
            </div>
          </aside>
        </div>

        {/* Format cards */}
        <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {tracks.map((track) => (
            <div key={track.minutes} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition hover:border-gold/15 card-lift">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">{track.minutes} minute format</p>
              <h2 className="mt-2.5 text-lg font-semibold tracking-[-0.02em] text-white">{track.title}</h2>
              <p className="mt-2 text-xs leading-6 text-white/45">
                {track.scene_ids.length} scenes with pacing cues for live delivery.
              </p>
              <Link href={`/presentation/speaker?duration=${track.minutes}`} className="mt-4 inline-flex rounded-lg border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                Open presenter mode
              </Link>
            </div>
          ))}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 transition hover:border-gold/15 card-lift">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold/70">Audience mode</p>
            <h2 className="mt-2.5 text-lg font-semibold tracking-[-0.02em] text-white">Presentation tab</h2>
            <p className="mt-2 text-xs leading-6 text-white/45">
              Open the clean public view to see exactly what the audience will see.
            </p>
            <Link href="/presentation" className="mt-4 inline-flex rounded-lg border border-white/[0.08] px-3.5 py-2 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
              Open presentation
            </Link>
          </div>
        </section>

        {/* Talk tracks + sidebar */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-10">
            {/* Talk tracks (collapsible) */}
            <section>
              <div className="mb-5">
                <div className="divider-gradient mb-5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Talk tracks</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Timed scripts for 20, 45, and 60 minute sessions.</h2>
              </div>
              <div className="space-y-3">
                {talkTracks.map((item) => (
                  <CollapsibleScript key={item.toolkit_id} item={item} />
                ))}
              </div>
            </section>

            {/* Facilitation guidance (collapsible) */}
            <section>
              <div className="mb-5">
                <div className="divider-gradient mb-5" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Facilitation guidance</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Preparation guidance, difficult questions, and support.</h2>
              </div>
              <div className="space-y-3">
                {supportItems.map((item) => (
                  <CollapsibleScript key={item.toolkit_id} item={item} />
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[72px] lg:h-fit">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Quick actions</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Link href="/presentation/speaker" className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  Presenter mode
                </Link>
                <a href="#preparation" className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  Prep checklist
                </a>
                <a href="#questions" className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  Difficult questions
                </a>
                <Link href="/resources" className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  Resources
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Event-ready checklist</p>
              <div className="mt-4 space-y-3 text-xs leading-6 text-white/45">
                <div className="flex items-start gap-2.5">
                  <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                  <p>Confirm the talk length and open the matching presenter mode before the session.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                  <p>Review the difficult-questions guidance so the conversation stays educational.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <NotebookText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/60" />
                  <p>Keep the handout, field guide, and manual ready for printing or follow-up.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Downloads</p>
              <div className="mt-4 space-y-2">
                {downloads.map((asset) => (
                  <Link key={asset.asset_id} href={asset.href} className="block rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3.5 transition hover:border-gold/20 hover:text-gold">
                    <p className="text-xs font-semibold text-paper/60">{asset.title}</p>
                    <p className="mt-1 text-[11px] text-paper/30">{asset.description}</p>
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
