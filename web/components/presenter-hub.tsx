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
    <main className="bg-dune px-5 py-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Presenter workspace</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-navy md:text-6xl">
          Prepare the talk, choose a timed format, and open speaker mode from one page.
        </h1>
        <div className="mt-5 max-w-2xl text-lg leading-8 text-navy/72">
          Use this page before an event to review the script, select the right timing, and make sure the presentation and supporting materials are ready.
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="rounded-[2rem] border border-navy/10 bg-white/88 p-6 shadow-horizon md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Start here</p>
            <div className="mt-4 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.04em] text-navy">Choose the session length, review the script, and then rehearse.</h2>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-navy/74">
                  Start here to match the room and schedule, then move into presenter mode when you are ready to rehearse the live flow.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={`/presentation/speaker?duration=${recommendedTrack?.minutes ?? 45}`} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ember">
                    Open recommended presenter mode
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/certification" className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-paper px-5 py-3 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember">
                    Review certification
                  </Link>
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-navy/10 bg-[#fcf8ef] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ember">Suggested sequence</p>
                <div className="mt-4 space-y-3 text-sm leading-7 text-navy/78">
                  <div className="flex items-start gap-3">
                    <Mic2 className="mt-1 h-4 w-4 text-ember" />
                    <p><span className="font-semibold text-navy">Choose a timed format</span> that matches the room, audience, and schedule.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <NotebookText className="mt-1 h-4 w-4 text-ember" />
                    <p><span className="font-semibold text-navy">Review scripts and guidance</span> before opening speaker mode.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Presentation className="mt-1 h-4 w-4 text-ember" />
                    <p><span className="font-semibold text-navy">Switch to Presentation</span> or Standalone mode when you are ready for the audience view.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-[2rem] border border-navy/10 bg-navy p-6 text-paper shadow-horizon">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Before the event</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em]">Keep the script, timing, and files close together.</p>
            <div className="mt-6 space-y-3 text-sm leading-7 text-paper/76">
              <p>Use Presenter before the event and presenter mode during the event.</p>
              <p>Resources holds the handout, manual, field guide, and partner links.</p>
              <p>Certification is the fastest way to review the lesson content behind the public presentation.</p>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {tracks.map((track) => (
            <div key={track.minutes} className="rounded-[1.5rem] border border-navy/10 bg-white/80 p-5 shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ember">{track.minutes} minute format</p>
              <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-navy">{track.title}</h2>
              <p className="mt-3 text-sm leading-7 text-navy/72">
                {track.scene_ids.length} presentation scenes with pacing cues for live delivery.
              </p>
              <div className="mt-4 rounded-2xl border border-navy/10 bg-paper px-4 py-3 text-sm text-navy/72">
                <p className="font-semibold text-navy">{track.steps.length} timed blocks</p>
                <p className="mt-1">{track.transition_note}</p>
              </div>
              <Link href={`/presentation/speaker?duration=${track.minutes}`} className="mt-5 inline-flex rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember">
                Open in presenter mode
              </Link>
            </div>
          ))}
          <div className="rounded-[1.5rem] border border-navy/10 bg-navy p-5 text-paper shadow-horizon">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold">Audience mode</p>
            <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Presentation tab</h2>
            <p className="mt-3 text-sm leading-7 text-paper/72">
              Open the clean public presentation view if you want to see exactly what an audience will see.
            </p>
            <Link href="/presentation" className="mt-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-paper transition hover:border-gold/40 hover:text-gold">
              Open presentation
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-10">
            <section>
              <div className="mb-5 border-t border-navy/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Talk tracks</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy">Timed scripts for 20, 45, and 60 minute sessions.</h2>
              </div>
              <div className="space-y-5">
                {items.filter((item) => item.type === "talk_track").map((item) => (
                  <article key={item.toolkit_id} className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-horizon">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">{item.type.replaceAll("_", " ")}</p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-navy">{item.title}</h3>
                      </div>
                      <div className="rounded-full border border-navy/10 bg-[#fcf8ef] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-navy/58">
                        Speaker script
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-navy/78">{item.body}</p>
                  </article>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-5 border-t border-navy/10 pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Facilitation guidance</p>
                <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-navy">Preparation guidance, difficult questions, and printable support.</h2>
              </div>
              <div className="space-y-5">
                {supportItems.map((item) => (
                  <article
                    id={item.title === "Presentation Preparation Checklist" ? "preparation" : item.title === "Handling Questions and Difficult Conversations" ? "questions" : undefined}
                    key={item.toolkit_id}
                    className="rounded-[1.75rem] border border-navy/10 bg-[#fcf8ef] p-6 shadow-horizon"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">{item.type.replaceAll("_", " ")}</p>
                        <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-navy">{item.title}</h3>
                      </div>
                      <div className="rounded-full border border-navy/10 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-navy/58">
                        Presenter support
                      </div>
                    </div>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-navy/78">{item.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-[1.75rem] border border-navy/10 bg-white/82 p-6 shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Quick actions</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/presentation/speaker" className="rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  Presenter mode
                </Link>
                <a href="#preparation" className="rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  Prep checklist
                </a>
                <a href="#questions" className="rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  Difficult questions
                </a>
                <Link href="/resources" className="rounded-full border border-navy/10 bg-paper px-4 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  Resources
                </Link>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-navy/10 bg-white p-6 shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Event-ready checklist</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-navy/78">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-1 h-4 w-4 text-ember" />
                  <p>Confirm the talk length and open the matching presenter mode before the session begins.</p>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-1 h-4 w-4 text-ember" />
                  <p>Review the difficult-questions guidance so the conversation stays educational and nonpartisan.</p>
                </div>
                <div className="flex items-start gap-3">
                  <NotebookText className="mt-1 h-4 w-4 text-ember" />
                  <p>Keep the handout, field guide, and manual ready for printing or follow-up distribution.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-navy/10 bg-navy p-6 text-paper shadow-horizon">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Downloadables</p>
              <div className="mt-5 space-y-3">
                {downloads.map((asset) => (
                  <Link key={asset.asset_id} href={asset.href} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 transition hover:border-gold/40 hover:text-gold">
                    <p className="font-semibold">{asset.title}</p>
                    <p className="mt-1 text-sm text-paper/65">{asset.description}</p>
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
