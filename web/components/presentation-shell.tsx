"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock3, ExternalLink, Expand, ListTree, MessageSquareQuote } from "lucide-react";
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
      <div className="relative min-h-screen overflow-hidden bg-[#f6eedf] text-navy">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(205,161,93,0.22),transparent_24%),radial-gradient(circle_at_82%_20%,rgba(155,35,50,0.1),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.45),rgba(246,238,223,0.95))]" />
        <div className="absolute right-[5%] top-[8%] text-[8rem] font-semibold tracking-[-0.08em] text-navy/[0.045] md:text-[14rem]">
          {`${currentIndex + 1}`.padStart(2, "0")}
        </div>
        <div className="relative flex min-h-screen flex-col justify-between px-6 py-8 md:px-10 md:py-10">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-navy/55">
              <span>{deferredScene.kicker}</span>
              <span>Scene {currentIndex + 1} of {scenes.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-full border border-navy/10 bg-white/70 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-navy/58 md:block">
                Standalone presentation
              </div>
              <Link href={`/presentation?duration=${currentDuration}`} className="rounded-full border border-navy/10 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy/68 transition hover:border-ember/40 hover:text-ember">
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
            <p className="max-w-2xl text-sm font-semibold uppercase tracking-[0.28em] text-ember md:text-base">{deferredScene.title}</p>
            <div className="mt-8 space-y-6">
              {deferredScene.display_lines.map((line, index) => (
                <p
                  key={line}
                  className={cn(
                    "max-w-5xl text-balance leading-[1.04] tracking-[-0.05em] text-navy",
                    index === 0 ? "text-5xl font-semibold md:text-8xl" : "text-2xl font-medium text-navy/76 md:text-4xl"
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          </motion.section>

          <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-navy/10">
              <div className="h-full rounded-full bg-gradient-to-r from-ember to-gold transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => startTransition(() => setSceneIndex((value) => Math.max(value - 1, 0)))}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white/80 px-4 py-2 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => startTransition(() => setSceneIndex((value) => Math.min(value + 1, scenes.length - 1)))}
                  disabled={currentIndex === scenes.length - 1}
                  className="inline-flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ember disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <div className="text-sm text-navy/58">Use arrow keys or spacebar to move through the presentation.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-[calc(100svh-73px)] lg:grid-cols-[minmax(0,1fr)_22rem]">
      <section className="relative overflow-hidden bg-dune px-5 py-8 md:px-8 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(205,161,93,0.18),transparent_28%),radial-gradient(circle_at_76%_14%,rgba(155,35,50,0.16),transparent_22%)]" />
        <div className="absolute right-[6%] top-20 text-[8rem] font-semibold tracking-[-0.08em] text-navy/[0.05] md:text-[13rem]">
          {`${currentIndex + 1}`.padStart(2, "0")}
        </div>
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-between gap-8">
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-navy/10">
            <div className="h-full rounded-full bg-gradient-to-r from-ember to-gold transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-navy/58">
                <span className="rounded-full border border-navy/10 bg-paper/70 px-3 py-2 text-ember/90">{deferredScene.kicker}</span>
                <span className="rounded-full border border-navy/10 bg-paper/70 px-3 py-2">Scene {currentIndex + 1}</span>
                {isSpeaker ? <span className="rounded-full border border-navy/10 bg-paper/70 px-3 py-2">{sceneMinutes} min focus</span> : null}
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-navy md:text-6xl">{deferredScene.title}</h1>
            </div>
            <div className="hidden rounded-full border border-navy/10 bg-paper/70 px-4 py-2 text-xs uppercase tracking-[0.24em] text-navy/65 md:block">
              {isSpeaker ? "Presenter view" : "Presentation view"}
            </div>
          </div>

          <motion.div
            key={deferredScene.scene_id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className={cn("grid gap-8", isSpeaker ? "lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]" : "lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)]")}
          >
            <div className="space-y-5">
              {deferredScene.display_lines.map((line, index) => (
                <div key={line} className={cn("max-w-3xl border-l border-navy/12 pl-6", index === 0 && "border-ember")}>
                  <p className={cn("text-2xl leading-tight text-ink md:text-4xl", index === 0 ? "font-semibold tracking-[-0.03em] md:text-5xl" : "font-medium text-navy/82")}>
                    {line}
                  </p>
                </div>
              ))}
            </div>

            {isSpeaker ? (
              <div className="rounded-[1.75rem] border border-navy/10 bg-paper/82 p-6 shadow-horizon">
                {currentTrackStep ? (
                  <div className="rounded-[1.25rem] border border-navy/10 bg-white/70 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Talk track cue</p>
                    <p className="mt-2 text-sm leading-7 text-navy/78">{currentTrackStep.cue}</p>
                  </div>
                ) : null}
                <div className={cn(currentTrackStep ? "mt-8 border-t border-navy/10 pt-6" : "")}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-ember">Speaker notes</p>
                  <p className="text-sm leading-7 text-navy/78">{deferredScene.speaker_notes}</p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-[2rem] border border-navy/10 bg-navy p-7 text-paper shadow-horizon">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(205,161,93,0.28),transparent_18%),radial-gradient(circle_at_20%_82%,rgba(155,35,50,0.22),transparent_24%)]" />
                <div className="relative flex h-full flex-col justify-between gap-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Key message</p>
                    <p className="mt-4 max-w-sm font-editorial text-3xl leading-tight tracking-[-0.03em] text-paper">
                      {deferredScene.display_lines[1] ?? deferredScene.kicker}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gold/85">On this scene</p>
                      <p className="mt-2 text-sm leading-6 text-paper/78">{deferredScene.display_lines[0]}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-white/10 bg-white/5 px-4 py-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-gold/85">Use next</p>
                      <p className="mt-2 text-sm leading-6 text-paper/78">Open Standalone mode for a full-screen audience view, or use Resources for follow-up materials.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-navy/10 pt-6">
            <div className="flex items-center gap-2 text-sm text-navy/75">
              <button
                type="button"
                onClick={() => startTransition(() => setSceneIndex((value) => Math.max(value - 1, 0)))}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-paper/80 px-4 py-2 transition hover:border-ember/40 hover:text-ember disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => startTransition(() => setSceneIndex((value) => Math.min(value + 1, scenes.length - 1)))}
                disabled={currentIndex === scenes.length - 1}
                className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-paper/80 px-4 py-2 transition hover:border-ember/40 hover:text-ember disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-navy/65">
              <span>{isSpeaker ? "Use arrow keys or the scene list to move through the talk." : `Scene ${currentIndex + 1} of ${scenes.length}`}</span>
              {!isSpeaker ? (
                <Link href={`/presentation/standalone?duration=${currentDuration}`} className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-paper/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-navy/70 transition hover:border-ember/40 hover:text-ember">
                  <Expand className="h-4 w-4" />
                  Standalone mode
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <aside className="border-l border-navy/10 bg-[#fbf7ef]">
        <div className="sticky top-[73px] flex h-[calc(100svh-73px)] flex-col gap-6 overflow-y-auto px-5 py-6">
          {isSpeaker ? (
            <div className="rounded-[1.5rem] border border-navy/10 bg-white px-4 py-4">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.24em] text-ember">
                <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4" /> Timing</span>
                <span>{formatMinutes(totalMinutes)}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-semibold tracking-[-0.04em] text-navy">{remainingMinutes}</p>
                  <p className="text-sm text-navy/60">remaining</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRunning((value) => !value)}
                    className="rounded-full border border-navy/10 px-3 py-2 text-sm text-navy/72 transition hover:border-ember/40 hover:text-ember"
                  >
                    {isRunning ? "Pause" : "Resume"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setElapsed(0)}
                    className="rounded-full border border-navy/10 px-3 py-2 text-sm text-navy/72 transition hover:border-ember/40 hover:text-ember"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDrawer((value) => !value)}
                    className="rounded-full border border-navy/10 px-3 py-2 text-sm text-navy/72 transition hover:border-ember/40 hover:text-ember"
                  >
                    {showDrawer ? "Hide notes" : "Show notes"}
                  </button>
                </div>
              </div>
              {track?.transition_note ? (
                <div className="mt-4 border-t border-navy/10 pt-4 text-sm leading-6 text-navy/70">
                  {track.transition_note}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {availableDurations.map((duration) => (
                  <Link
                    key={duration}
                    href={`${isSpeaker ? "/presentation/speaker" : "/presentation"}?duration=${duration}`}
                    className={cn(
                      "rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
                      currentDuration === duration
                        ? "bg-navy text-paper"
                        : "border border-navy/10 bg-paper text-navy/70 hover:border-ember/40 hover:text-ember"
                    )}
                  >
                    {duration} min
                  </Link>
                ))}
              </div>
            </div>
          ) : null}

          {!isSpeaker ? (
            <div className="rounded-[1.5rem] border border-navy/10 bg-white px-4 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-ember">Presentation tools</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/presentation/standalone?duration=${currentDuration}`} className="rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  Standalone mode
                </Link>
                <Link href={`/presentation/speaker?duration=${currentDuration}`} className="rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  Presenter mode
                </Link>
                <Link href="/resources" className="rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  Resources
                </Link>
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-navy/10 bg-white px-4 py-4">
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-ember">
              <ListTree className="h-4 w-4" />
              Scene flow
            </p>
            <div className="space-y-2">
              {scenes.map((scene, index) => (
                <button
                  key={scene.scene_id}
                  type="button"
                  onClick={() => startTransition(() => setSceneIndex(index))}
                  className={cn(
                    "w-full rounded-2xl px-3 py-3 text-left text-sm transition",
                    index === currentIndex ? "bg-navy text-paper" : "bg-paper text-navy/78 hover:bg-sand"
                  )}
                >
                  <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">{scene.kicker}</p>
                  <p className="mt-1 font-medium">{scene.title}</p>
                </button>
              ))}
            </div>
          </div>

          {showDrawer && isSpeaker ? (
            <div className="rounded-[1.5rem] border border-navy/10 bg-white px-4 py-4">
              <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-ember">
                <MessageSquareQuote className="h-4 w-4" />
                Presenter drawer
              </p>
              <div className="space-y-4 text-sm leading-6 text-navy/78">
                {currentScene.speaker_only_blocks.length ? (
                  currentScene.speaker_only_blocks.map((block) => (
                    <div key={block.title}>
                      <p className="font-semibold text-navy">{block.title}</p>
                      <p>{block.body}</p>
                    </div>
                  ))
                ) : (
                  <p>No speaker-only prompts for this scene.</p>
                )}
                {nextScene ? (
                  <div className="border-t border-navy/10 pt-4">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-ember">Next scene</p>
                    <p className="font-semibold text-navy">{nextScene.title}</p>
                    <p>{nextScene.display_lines[0]}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-navy/10 bg-white px-4 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-ember">{isSpeaker ? "Active resources" : "Related resources"}</p>
            <div className="space-y-3">
              {activeResources.map((group) => (
                <div key={group.resource_group_id} className="rounded-2xl bg-paper px-3 py-3">
                  <p className="font-semibold text-navy">{group.title}</p>
                  <p className="mt-1 text-sm leading-6 text-navy/70">{group.description}</p>
                  {group.links.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {group.links.slice(0, 2).map((link) =>
                        /^https?:\/\//.test(link.href) ? (
                          <Link key={`${group.resource_group_id}-${link.label}`} href={link.href} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy/60 transition hover:text-ember">
                            {link.label}
                          </Link>
                        ) : (
                          <span key={`${group.resource_group_id}-${link.label}`} className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-navy/60">
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
            <div className="rounded-[1.5rem] border border-navy/10 bg-white px-4 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-ember">Downloads</p>
              <div className="space-y-2">
                {downloads.map((asset) => (
                  <Link
                    key={asset.asset_id}
                    href={asset.href}
                    className="flex items-center justify-between rounded-2xl bg-paper px-3 py-3 text-sm text-navy transition hover:bg-sand hover:text-ember"
                  >
                    <div>
                      <span className="block">{asset.title}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-navy/45">{asset.format}</span>
                    </div>
                    <ExternalLink className="h-4 w-4" />
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
