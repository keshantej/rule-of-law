"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3, Expand, ExternalLink, ListTree, MessageSquareQuote } from "lucide-react";
import { motion } from "framer-motion";

import type { DownloadAsset, ResourceGroup, SpeakerTrack, WebScene } from "@/lib/types";
import { cn, formatMinutes } from "@/lib/utils";

interface PresentationShellProps {
  scenes: WebScene[];
  track?: SpeakerTrack;
  mode: "public" | "speaker" | "standalone";
  resources: ResourceGroup[];
  downloads: DownloadAsset[];
  currentDuration: number;
  availableDurations: number[];
}

export function PresentationShell({ scenes, track, mode, resources, downloads, currentDuration, availableDurations }: PresentationShellProps) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(mode === "speaker");
  const [showDrawer, setShowDrawer] = useState(mode === "speaker");
  const isSpeaker = mode === "speaker";
  const isStandalone = mode === "standalone";
  const currentIndex = Math.min(sceneIndex, Math.max(0, scenes.length - 1));
  const currentScene = scenes[currentIndex];
  const deferredScene = useDeferredValue(currentScene);
  const nextScene = scenes[currentIndex + 1] ?? null;
  const totalMinutes = track?.minutes ?? 45;
  const currentTrackStep = track?.steps.find((step) => step.scene_id === currentScene.scene_id);
  const sceneMinutes = currentTrackStep?.minutes ?? Math.max(Math.round(totalMinutes / Math.max(scenes.length, 1)), 1);

  useEffect(() => {
    if (mode !== "speaker" || !isRunning) {
      return;
    }
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, mode]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault();
        startTransition(() => setSceneIndex((value) => Math.min(value + 1, scenes.length - 1)));
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        startTransition(() => setSceneIndex((value) => Math.max(value - 1, 0)));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scenes.length]);

  const remainingMinutes = useMemo(() => {
    const secondsLeft = Math.max(totalMinutes * 60 - elapsed, 0);
    return `${Math.floor(secondsLeft / 60)}:${`${secondsLeft % 60}`.padStart(2, "0")}`;
  }, [elapsed, totalMinutes]);

  const activeResources = resources.filter((group) =>
    deferredScene.resource_refs.length === 0 || deferredScene.resource_refs.includes(group.resource_group_id)
  );
  const progress = ((currentIndex + 1) / Math.max(scenes.length, 1)) * 100;

  if (isStandalone) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0b1320] text-paper">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_15%,rgba(205,161,93,0.12),transparent),radial-gradient(ellipse_40%_30%_at_80%_20%,rgba(155,35,50,0.08),transparent)]" />
        <div className="absolute right-[5%] top-[8%] text-[8rem] font-semibold tracking-[-0.08em] text-paper/[0.04] md:text-[14rem]">
          {`${currentIndex + 1}`.padStart(2, "0")}
        </div>
        <div className="relative flex min-h-screen flex-col justify-between px-6 py-8 md:px-10 md:py-10">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-paper/45">
              <span>{deferredScene.kicker}</span>
              <span className="h-3 w-px bg-paper/15" />
              <span>Scene {currentIndex + 1} of {scenes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-lg border border-paper/[0.06] bg-paper/[0.03] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-paper/40 md:block">
                Standalone
              </div>
              <Link href={`/presentation?duration=${currentDuration}`} className="rounded-lg border border-paper/[0.06] bg-paper/[0.03] px-3.5 py-2 text-xs font-semibold text-paper/55 transition hover:border-gold/30 hover:text-gold">
                Exit standalone
              </Link>
            </div>
          </div>

          <motion.section
            key={deferredScene.scene_id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center py-10"
          >
            <p className="max-w-2xl text-sm font-semibold uppercase tracking-[0.28em] text-ember/80 md:text-base">{deferredScene.title}</p>
            <div className="mt-8 space-y-6">
              {deferredScene.display_lines.map((line, index) => (
                <p
                  key={line}
                  className={cn(
                    "max-w-5xl text-balance leading-[1.04] tracking-[-0.05em] text-paper",
                    index === 0 ? "text-5xl font-semibold md:text-8xl" : "text-2xl font-medium text-paper/60 md:text-4xl"
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          </motion.section>

          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
            <div className="h-[2px] w-full overflow-hidden rounded-full bg-paper/[0.06]">
              <div className="h-full rounded-full bg-gradient-to-r from-ember/80 to-gold/80 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startTransition(() => setSceneIndex((value) => Math.max(value - 1, 0)))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 rounded-lg border border-paper/[0.06] bg-paper/[0.03] px-4 py-2 text-sm font-medium text-paper/70 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(() => setSceneIndex((value) => Math.min(value + 1, scenes.length - 1)))}
                  disabled={currentIndex === scenes.length - 1}
                  className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="text-sm text-paper/40">Arrow keys or spacebar to navigate</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100svh-56px)] lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="relative overflow-hidden bg-[#0d1727] px-5 py-8 md:px-8 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_10%,rgba(205,161,93,0.1),transparent),radial-gradient(ellipse_40%_30%_at_76%_14%,rgba(155,35,50,0.06),transparent)]" />
        <div className="absolute right-[6%] top-20 text-[8rem] font-semibold tracking-[-0.08em] text-paper/[0.03] md:text-[13rem]">
          {`${currentIndex + 1}`.padStart(2, "0")}
        </div>
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-between gap-8">
          {/* Progress bar */}
          <div className="h-[2px] w-full overflow-hidden rounded-full bg-paper/[0.06]">
            <div className="h-full rounded-full bg-gradient-to-r from-ember/80 to-gold/80 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Scene header */}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-paper/40">
                <span className="rounded-lg border border-paper/[0.08] bg-paper/[0.03] px-3 py-1.5 text-gold/80">{deferredScene.kicker}</span>
                <span className="rounded-lg border border-paper/[0.08] bg-paper/[0.03] px-3 py-1.5">Scene {currentIndex + 1}</span>
                {isSpeaker ? <span className="rounded-lg border border-paper/[0.08] bg-paper/[0.03] px-3 py-1.5">{sceneMinutes} min</span> : null}
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-5xl">{deferredScene.title}</h1>
            </div>
            <div className="hidden rounded-lg border border-paper/[0.06] bg-paper/[0.03] px-3.5 py-2 text-[11px] uppercase tracking-[0.24em] text-paper/40 md:block">
              {isSpeaker ? "Presenter" : "Presentation"}
            </div>
          </div>

          {/* Scene content */}
          <motion.div
            key={deferredScene.scene_id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={cn("grid gap-8", isSpeaker ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]" : "lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]")}
          >
            <div className="space-y-5">
              {deferredScene.display_lines.map((line, index) => (
                <div key={line} className={cn("max-w-3xl border-l-2 pl-6", index === 0 ? "border-gold/40" : "border-paper/[0.08]")}>
                  <p className={cn("text-2xl leading-tight text-white md:text-4xl", index === 0 ? "font-semibold tracking-[-0.03em] md:text-5xl" : "font-medium text-white/65")}>
                    {line}
                  </p>
                </div>
              ))}
            </div>

            {isSpeaker ? (
              <div className="rounded-2xl border border-paper/[0.08] bg-paper/[0.03] p-5">
                {currentTrackStep ? (
                  <div className="rounded-xl border border-paper/[0.08] bg-paper/[0.03] p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Talk track cue</p>
                    <p className="mt-2 text-sm leading-7 text-paper/65">{currentTrackStep.cue}</p>
                  </div>
                ) : null}
                <div className={cn(currentTrackStep ? "mt-6 border-t border-paper/[0.06] pt-5" : "")}>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Speaker notes</p>
                  <p className="text-sm leading-7 text-paper/60">{deferredScene.speaker_notes}</p>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-paper/[0.06] pt-5">
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => startTransition(() => setSceneIndex((value) => Math.max(value - 1, 0)))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-paper/[0.06] bg-paper/[0.03] px-4 py-2 text-paper/60 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => setSceneIndex((value) => Math.min(value + 1, scenes.length - 1)))}
                disabled={currentIndex === scenes.length - 1}
                className="inline-flex items-center gap-2 rounded-lg border border-paper/[0.06] bg-paper/[0.03] px-4 py-2 text-paper/60 transition hover:border-gold/30 hover:text-gold disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-paper/40">
              <span>{isSpeaker ? "Arrow keys or scene list to navigate" : `Scene ${currentIndex + 1} of ${scenes.length}`}</span>
              {!isSpeaker ? (
                <Link href={`/presentation/standalone?duration=${currentDuration}`} className="inline-flex items-center gap-2 rounded-lg border border-paper/[0.06] bg-paper/[0.03] px-3.5 py-2 text-xs font-semibold text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  <Expand className="h-3.5 w-3.5" />
                  Standalone
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="border-l border-white/[0.06] bg-[#0b1320]">
        <div className="sticky top-[56px] flex h-[calc(100svh-56px)] flex-col gap-4 overflow-y-auto p-4">
          {isSpeaker ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" /> Timing</span>
                <span className="text-paper/40">{formatMinutes(totalMinutes)}</span>
              </div>
              <p className="text-3xl font-semibold tracking-[-0.04em] text-white">{remainingMinutes}</p>
              <p className="text-xs text-paper/40">remaining</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsRunning((value) => !value)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold"
                >
                  {isRunning ? "Pause" : "Resume"}
                </button>
                <button
                  type="button"
                  onClick={() => setElapsed(0)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowDrawer((value) => !value)}
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold"
                >
                  {showDrawer ? "Hide notes" : "Notes"}
                </button>
              </div>
              {track?.transition_note ? (
                <p className="mt-3 border-t border-white/[0.06] pt-3 text-xs leading-5 text-paper/40">
                  {track.transition_note}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {availableDurations.map((duration) => (
                  <Link
                    key={duration}
                    href={`${isSpeaker ? "/presentation/speaker" : "/presentation"}?duration=${duration}`}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      currentDuration === duration
                        ? "bg-gold text-ink"
                        : "border border-white/[0.08] text-paper/50 hover:border-gold/30 hover:text-gold"
                    )}
                  >
                    {duration}m
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Tools</p>
              <div className="flex flex-wrap gap-1.5">
                <Link href={`/presentation/standalone?duration=${currentDuration}`} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  Standalone
                </Link>
                <Link href={`/presentation/speaker?duration=${currentDuration}`} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  Presenter
                </Link>
                <Link href="/resources" className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/55 transition hover:border-gold/30 hover:text-gold">
                  Resources
                </Link>
              </div>
            </div>
          )}

          {/* Scene flow */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            {!isSpeaker ? (
              <div className="mb-4 border-b border-white/[0.06] pb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Current point</p>
                <p className="mt-2 font-editorial text-lg leading-tight text-white/85">
                  {deferredScene.display_lines[1] ?? deferredScene.kicker}
                </p>
                <p className="mt-2 text-xs leading-5 text-paper/45">{deferredScene.display_lines[0]}</p>
              </div>
            ) : null}
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">
              <ListTree className="h-3.5 w-3.5" />
              Scene flow
            </p>
            <div className="mt-3 space-y-1.5">
              {scenes.map((scene, index) => (
                <button
                  key={scene.scene_id}
                  type="button"
                  onClick={() => startTransition(() => setSceneIndex(index))}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left text-xs transition",
                    index === currentIndex
                      ? "bg-gold/15 text-gold ring-1 ring-gold/20"
                      : "text-paper/45 hover:bg-white/[0.03] hover:text-paper/65"
                  )}
                >
                  <p className="text-[10px] uppercase tracking-[0.22em] opacity-60">{scene.kicker}</p>
                  <p className="mt-0.5 font-medium">{scene.title}</p>
                </button>
              ))}
            </div>
          </div>

          {showDrawer && isSpeaker ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="mb-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">
                <MessageSquareQuote className="h-3.5 w-3.5" />
                Presenter drawer
              </p>
              <div className="space-y-3 text-xs leading-5 text-paper/55">
                {currentScene.speaker_only_blocks.length ? (
                  currentScene.speaker_only_blocks.map((block) => (
                    <div key={block.title}>
                      <p className="font-semibold text-paper/75">{block.title}</p>
                      <p>{block.body}</p>
                    </div>
                  ))
                ) : (
                  <p>No speaker-only prompts for this scene.</p>
                )}
                {nextScene ? (
                  <div className="border-t border-white/[0.06] pt-3">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/70">Next</p>
                    <p className="font-semibold text-paper/70">{nextScene.title}</p>
                    <p>{nextScene.display_lines[0]}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Resources */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">{isSpeaker ? "Active resources" : "Related resources"}</p>
            <div className="space-y-2">
              {activeResources.map((group) => (
                <div key={group.resource_group_id} className="rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-3">
                  <p className="text-xs font-semibold text-paper/70">{group.title}</p>
                  <p className="mt-1 text-[11px] leading-4 text-paper/40">{group.description}</p>
                  {group.links.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {group.links.slice(0, 2).map((link) =>
                        /^https?:\/\//.test(link.href) ? (
                          <Link key={`${group.resource_group_id}-${link.label}`} href={link.href} className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/40 transition hover:text-gold">
                            {link.label}
                          </Link>
                        ) : (
                          <span key={`${group.resource_group_id}-${link.label}`} className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-paper/30">
                            {link.label}
                          </span>
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {isSpeaker ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Downloads</p>
              <div className="space-y-1.5">
                {downloads.map((asset) => (
                  <Link
                    key={asset.asset_id}
                    href={asset.href}
                    className="flex items-center justify-between rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2.5 text-xs text-paper/55 transition hover:border-gold/20 hover:text-gold"
                  >
                    <div>
                      <span className="block font-medium">{asset.title}</span>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-paper/30">{asset.format}</span>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
