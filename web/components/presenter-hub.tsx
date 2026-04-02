import Link from "next/link";
import { ArrowRight, Clock3, Mic2, NotebookText, Presentation, ShieldCheck } from "lucide-react";

import type { DownloadAsset, SpeakerTrack, ToolkitItem } from "@/lib/types";

interface PresenterHubProps {
  tracks: SpeakerTrack[];
  items: ToolkitItem[];
  downloads: DownloadAsset[];
}

export function PresenterHub({ tracks, items, downloads }: PresenterHubProps) {
  const supportItems = items.filter((item) => item.type !== "talk_track");
  const recommendedTrack = tracks.find((track) => track.minutes === 45) ?? tracks[0];

  return (
    <main className="px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Presenter</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
          Choose the talk length, review the script, and rehearse.
        </h1>
        <div className="mt-5 max-w-3xl text-lg leading-8 text-white/80">
          This page is for speaker preparation. Use it to review the talk track, check the timing, and keep the presentation files close at hand.
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section className="rounded-[2rem] border border-paper/10 bg-paper p-6 text-ink md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Start here</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink">Pick the format that fits the room, then rehearse from presenter mode.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-ink/74">
                  Most speakers should start with the 45-minute version, then shorten or expand if the schedule requires it.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/presentation/speaker?duration=${recommendedTrack?.minutes ?? 45}`} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ember">
                    Open recommended presenter mode
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/certification" className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:border-gold/45 hover:text-gold">
                    Review certification
                  </Link>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-ink/10 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Suggested sequence</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-ink/74">
                  <div className="flex items-start gap-3">
                    <Mic2 className="mt-1 h-4 w-4 text-gold" />
                    <p><span className="font-semibold text-ink">Choose a timed format</span> that matches the room and schedule.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <NotebookText className="mt-1 h-4 w-4 text-gold" />
                    <p><span className="font-semibold text-ink">Review the script and notes</span> before opening speaker mode.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Presentation className="mt-1 h-4 w-4 text-gold" />
                    <p><span className="font-semibold text-ink">Switch to Presentation</span> or Standalone mode when the audience is in the room.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-paper/10 bg-paper p-6 text-ink">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Preparation checklist</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-ink/74">
              <p>Confirm the talk length.</p>
              <p>Review the script and difficult-questions guidance.</p>
              <p>Open presenter mode before the session begins.</p>
              <p>Keep the handout and field guide ready to share.</p>
            </div>
          </aside>
        </div>

        <section className="rounded-[2rem] border border-paper/10 bg-paper text-ink shadow-horizon">
          <div className="grid divide-y divide-ink/10 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4">
          {tracks.map((track) => (
            <div key={track.minutes} className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">{track.minutes} minute format</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-ink">{track.title}</h2>
              <p className="mt-3 text-sm leading-7 text-ink/70">
                {track.scene_ids.length} presentation scenes with pacing cues for live delivery.
              </p>
              <Link href={`/presentation/speaker?duration=${track.minutes}`} className="mt-5 inline-flex rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold/45 hover:text-gold">
                Open in presenter mode
              </Link>
            </div>
          ))}
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Audience mode</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Presentation tab</h2>
            <p className="mt-3 text-sm leading-7 text-ink/72">
              Open the clean public presentation view if you want to see exactly what an audience will see.
            </p>
            <Link href="/presentation" className="mt-5 inline-flex rounded-full border border-ink/10 bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-gold/40 hover:text-gold">
              Open presentation
            </Link>
          </div>
          </div>
        </section>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-10">
            <section>
              <div className="mb-5 border-t border-paper/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Talk tracks</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Timed scripts for 20, 45, and 60 minute sessions.</h2>
              </div>
              <div className="space-y-5">
                {items.filter((item) => item.type === "talk_track").map((item) => (
                  <article key={item.toolkit_id} className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{item.type.replaceAll("_", " ")}</p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">{item.title}</h3>
                      </div>
                      <div className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/58">
                        Speaker script
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-ink/76">{item.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-5 border-t border-paper/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Facilitation guidance</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white">Preparation guidance, difficult questions, and printable support.</h2>
              </div>
              <div className="space-y-5">
                {supportItems.map((item) => (
                  <article
                    id={item.title === "Presentation Preparation Checklist" ? "preparation" : item.title === "Handling Questions and Difficult Conversations" ? "questions" : undefined}
                    key={item.toolkit_id}
                    className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">{item.type.replaceAll("_", " ")}</p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink">{item.title}</h3>
                      </div>
                      <div className="rounded-full border border-ink/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-ink/58">
                        Presenter support
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-ink/76">{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Quick actions</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/presentation/speaker" className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink transition hover:border-gold/45 hover:text-gold">
                  Presenter mode
                </Link>
                <a href="#preparation" className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink transition hover:border-gold/45 hover:text-gold">
                  Prep checklist
                </a>
                <a href="#questions" className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink transition hover:border-gold/45 hover:text-gold">
                  Difficult questions
                </a>
                <Link href="/resources" className="rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink transition hover:border-gold/45 hover:text-gold">
                  Resources
                </Link>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Event-ready checklist</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-ink/74">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-1 h-4 w-4 text-gold" />
                  <p>Confirm the talk length and open the matching presenter mode before the session begins.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 text-gold" />
                  <p>Review the difficult-questions guidance so the conversation stays educational and nonpartisan.</p>
                </div>
                <div className="flex items-start gap-3">
                  <NotebookText className="mt-1 h-4 w-4 text-gold" />
                  <p>Keep the handout, field guide, and manual ready for printing or follow-up distribution.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Downloadables</p>
              <div className="mt-5 space-y-3">
                {downloads.map((asset) => (
                  <Link key={asset.asset_id} href={asset.href} className="block rounded-2xl border border-ink/10 bg-white px-4 py-4 transition hover:border-gold/40 hover:text-gold">
                    <p className="font-semibold">{asset.title}</p>
                    <p className="mt-1 text-sm text-ink/65">{asset.description}</p>
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
