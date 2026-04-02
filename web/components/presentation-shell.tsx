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
    if (mode !== "speaker" || !isRunning) return;
    const timer = window.setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isRunning, mode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        startTransition(() => setSceneIndex((v) => Math.min(v + 1, scenes.length - 1)));
      }
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        startTransition(() => setSceneIndex((v) => Math.max(v - 1, 0)));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [scenes.length]);

  const remainingMinutes = useMemo(() => {
    const s = Math.max(totalMinutes * 60 - elapsed, 0);
    return `${Math.floor(s / 60)}:${`${s % 60}`.padStart(2, "0")}`;
  }, [elapsed, totalMinutes]);

  const activeResources = resources.filter((g) =>
    deferredScene.resource_refs.length === 0 || deferredScene.resource_refs.includes(g.resource_group_id)
  );
  const progress = ((currentIndex + 1) / Math.max(scenes.length, 1)) * 100;

  const prev = () => startTransition(() => setSceneIndex((v) => Math.max(v - 1, 0)));
  const next = () => startTransition(() => setSceneIndex((v) => Math.min(v + 1, scenes.length - 1)));

  /* ── Standalone ── */
  if (isStandalone) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#0b1320] text-paper">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_15%,rgba(205,161,93,0.08),transparent),radial-gradient(ellipse_40%_30%_at_80%_20%,rgba(155,35,50,0.05),transparent)]" />
        <div className="absolute right-[5%] top-[8%] text-[8rem] font-semibold tracking-[-0.08em] text-paper/[0.03] md:text-[14rem]">
          {`${currentIndex + 1}`.padStart(2, "0")}
        </div>
        <div className="relative flex min-h-screen flex-col justify-between px-6 py-8 md:px-10 md:py-10">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[11px] font-medium text-paper/30">
              <span>{deferredScene.kicker}</span>
              <span className="h-3 w-px bg-paper/10" />
              <span>{currentIndex + 1} / {scenes.length}</span>
            </div>
            <Link href={`/presentation?duration=${currentDuration}`} className="rounded-lg px-3 py-1.5 text-xs text-paper/30 transition hover:text-gold/70">
              Exit
            </Link>
          </div>

          <motion.section
            key={deferredScene.scene_id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center py-10"
          >
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-ember/60">{deferredScene.title}</p>
            <div className="mt-6 space-y-5">
              {deferredScene.display_lines.map((line, i) => (
                <p key={line} className={cn(
                  "max-w-4xl text-balance leading-[1.06] tracking-[-0.04em]",
                  i === 0 ? "text-4xl font-semibold text-paper sm:text-6xl md:text-7xl" : "text-xl font-medium text-paper/50 sm:text-3xl"
                )}>
                  {line}
                </p>
              ))}
            </div>
          </motion.section>

          <div className="mx-auto w-full max-w-6xl space-y-4">
            <div className="h-px w-full bg-paper/[0.06]">
              <div className="h-full bg-gradient-to-r from-ember/60 to-gold/60 transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button type="button" onClick={prev} disabled={currentIndex === 0} className="rounded-lg px-3 py-1.5 text-sm text-paper/40 transition hover:text-gold disabled:opacity-25">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={next} disabled={currentIndex === scenes.length - 1} className="rounded-lg bg-gold px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-gold/90 disabled:opacity-25">
                  Next
                </button>
              </div>
              <span className="text-xs text-paper/25">Arrow keys or spacebar</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Public / Speaker ── */
  return (
    <div className="grid min-h-[calc(100svh-56px)] lg:grid-cols-[minmax(0,1fr)_16rem]">
      {/* Main content */}
      <section className="relative overflow-hidden bg-[#0d1727] px-5 py-8 md:px-8 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_20%_10%,rgba(205,161,93,0.06),transparent),radial-gradient(ellipse_40%_30%_at_76%_14%,rgba(155,35,50,0.04),transparent)]" />
        <div className="absolute right-[6%] top-20 text-[8rem] font-semibold tracking-[-0.08em] text-paper/[0.025] md:text-[12rem]">
          {`${currentIndex + 1}`.padStart(2, "0")}
        </div>
        <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-between gap-8">
          {/* Progress */}
          <div className="h-px w-full bg-paper/[0.06]">
            <div className="h-full bg-gradient-to-r from-ember/60 to-gold/60 transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {/* Header chips */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-paper/30">
                <span className="text-gold/60">{deferredScene.kicker}</span>
                <span className="h-3 w-px bg-paper/10" />
                <span>Scene {currentIndex + 1}</span>
                {isSpeaker ? <><span className="h-3 w-px bg-paper/10" /><span>{sceneMinutes}m</span></> : null}
              </div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.03em] text-white md:text-4xl">{deferredScene.title}</h1>
            </div>
          </div>

          {/* Display lines + speaker notes */}
          <motion.div
            key={deferredScene.scene_id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("grid gap-8", isSpeaker && "lg:grid-cols-[minmax(0,1.3fr)_minmax(16rem,0.7fr)]")}
          >
            <div className="space-y-4">
              {deferredScene.display_lines.map((line, i) => (
                <div key={line} className={cn("max-w-3xl border-l-2 pl-5", i === 0 ? "border-gold/30" : "border-white/[0.04]")}>
                  <p className={cn("leading-tight", i === 0 ? "text-2xl font-semibold tracking-[-0.02em] text-white md:text-4xl" : "text-lg font-medium text-white/50 md:text-2xl")}>
                    {line}
                  </p>
                </div>
              ))}
            </div>
            {isSpeaker ? (
              <div className="space-y-4">
                {currentTrackStep ? (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">Cue</p>
                    <p className="mt-1.5 text-xs leading-6 text-paper/45">{currentTrackStep.cue}</p>
                  </div>
                ) : null}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">Notes</p>
                  <p className="mt-1.5 text-xs leading-6 text-paper/40">{deferredScene.speaker_notes}</p>
                </div>
              </div>
            ) : null}
          </motion.div>

          {/* Nav */}
          <div className="flex items-center justify-between gap-4 border-t border-paper/[0.04] pt-4">
            <div className="flex items-center gap-2">
              <button type="button" onClick={prev} disabled={currentIndex === 0} className="rounded-lg px-3 py-1.5 text-sm text-paper/35 transition hover:text-gold disabled:opacity-25">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={next} disabled={currentIndex === scenes.length - 1} className="rounded-lg px-3 py-1.5 text-sm text-paper/35 transition hover:text-gold disabled:opacity-25">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs text-paper/25">
              <span>{currentIndex + 1} / {scenes.length}</span>
              {!isSpeaker ? (
                <Link href={`/presentation/standalone?duration=${currentDuration}`} className="flex items-center gap-1.5 text-paper/30 transition hover:text-gold/60">
                  <Expand className="h-3 w-3" />
                  Standalone
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Sidebar */}
      <aside className="border-l border-white/[0.04] bg-[#0b1320]">
        <div className="sticky top-[56px] flex h-[calc(100svh-56px)] flex-col gap-6 overflow-y-auto p-4">
          {isSpeaker ? (
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3 w-3" /> Timer</span>
                <span className="text-paper/25">{formatMinutes(totalMinutes)}</span>
              </div>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{remainingMinutes}</p>
              <div className="mt-2 flex gap-1.5">
                <button type="button" onClick={() => setIsRunning((v) => !v)} className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-paper/35 transition hover:text-paper/60">
                  {isRunning ? "Pause" : "Resume"}
                </button>
                <button type="button" onClick={() => setElapsed(0)} className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-paper/35 transition hover:text-paper/60">
                  Reset
                </button>
                <button type="button" onClick={() => setShowDrawer((v) => !v)} className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-paper/35 transition hover:text-paper/60">
                  {showDrawer ? "Hide" : "Notes"}
                </button>
              </div>
              <div className="mt-3 flex gap-1">
                {availableDurations.map((d) => (
                  <Link key={d} href={`/presentation/speaker?duration=${d}`} className={cn(
                    "rounded-md px-2.5 py-1 text-[10px] font-semibold transition",
                    currentDuration === d ? "bg-gold text-ink" : "bg-white/[0.04] text-paper/30 hover:text-gold/60"
                  )}>
                    {d}m
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">Tools</p>
              <div className="mt-2 flex flex-wrap gap-1">
                <Link href={`/presentation/standalone?duration=${currentDuration}`} className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] text-paper/35 transition hover:text-gold/60">Standalone</Link>
                <Link href={`/presentation/speaker?duration=${currentDuration}`} className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] text-paper/35 transition hover:text-gold/60">Presenter</Link>
                <Link href="/resources" className="rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] text-paper/35 transition hover:text-gold/60">Resources</Link>
              </div>
            </div>
          )}

          {/* Scene flow */}
          <div>
            {!isSpeaker ? (
              <div className="mb-4">
                <p className="font-editorial text-sm leading-tight text-white/70">
                  {deferredScene.display_lines[1] ?? deferredScene.kicker}
                </p>
                <p className="mt-1.5 text-[11px] leading-4 text-paper/30">{deferredScene.display_lines[0]}</p>
              </div>
            ) : null}
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">
              <ListTree className="h-3 w-3" />
              Scenes
            </p>
            <div className="mt-2 space-y-px">
              {scenes.map((scene, i) => (
                <button
                  key={scene.scene_id}
                  type="button"
                  onClick={() => startTransition(() => setSceneIndex(i))}
                  className={cn(
                    "w-full rounded-md px-2.5 py-2 text-left text-[11px] transition",
                    i === currentIndex
                      ? "bg-white/[0.06] text-gold"
                      : "text-paper/30 hover:text-paper/50"
                  )}
                >
                  <p className="text-[9px] uppercase tracking-[0.2em] opacity-50">{scene.kicker}</p>
                  <p className="mt-px font-medium">{scene.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Presenter drawer */}
          {showDrawer && isSpeaker ? (
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">
                <MessageSquareQuote className="h-3 w-3" />
                Drawer
              </p>
              <div className="mt-2 space-y-3 text-[11px] leading-5 text-paper/35">
                {currentScene.speaker_only_blocks.length ? (
                  currentScene.speaker_only_blocks.map((b) => (
                    <div key={b.title}>
                      <p className="font-medium text-paper/55">{b.title}</p>
                      <p>{b.body}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-paper/25">No prompts for this scene.</p>
                )}
                {nextScene ? (
                  <div className="border-t border-white/[0.04] pt-2">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gold/40">Next</p>
                    <p className="mt-0.5 font-medium text-paper/50">{nextScene.title}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* Resources */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">Resources</p>
            <div className="mt-2 space-y-2">
              {activeResources.map((g) => (
                <div key={g.resource_group_id}>
                  <p className="text-[11px] font-medium text-paper/45">{g.title}</p>
                  {g.links.length ? (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {g.links.slice(0, 2).map((link) =>
                        /^https?:\/\//.test(link.href) ? (
                          <Link key={`${g.resource_group_id}-${link.label}`} href={link.href} className="text-[10px] text-paper/25 transition hover:text-gold/50">
                            {link.label}
                          </Link>
                        ) : (
                          <span key={`${g.resource_group_id}-${link.label}`} className="text-[10px] text-paper/15">{link.label}</span>
                        )
                      )}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {isSpeaker ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold/50">Downloads</p>
              <div className="mt-2 space-y-1">
                {downloads.map((a) => (
                  <Link key={a.asset_id} href={a.href} className="group flex items-center justify-between py-1.5 text-[11px]">
                    <span className="text-paper/35 transition group-hover:text-gold/60">{a.title}</span>
                    <ExternalLink className="h-3 w-3 text-paper/15" />
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
