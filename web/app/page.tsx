import Link from "next/link";
import { ArrowRight, Award, FolderOpen, Presentation, ScrollText } from "lucide-react";

import { getDownloads, getLmsArtifact, getSpeakerTrack, getWebExperience } from "@/lib/content";

export default async function HomePage() {
  const [experience, track45, downloads, lms] = await Promise.all([
    getWebExperience(),
    getSpeakerTrack(45),
    getDownloads(),
    getLmsArtifact()
  ]);

  const tabs = [
    {
      title: "Presentation",
      body: "Audience-facing scenes for live delivery, with a new standalone mode for uninterrupted room use.",
      href: "/presentation",
      icon: Presentation
    },
    {
      title: "Certification",
      body: "Module review and knowledge checks to make sure the substance is clear before presenting.",
      href: "/certification",
      icon: Award
    },
    {
      title: "Resources",
      body: "Downloadables, partner links, and follow-up materials gathered in one place.",
      href: "/resources",
      icon: FolderOpen
    },
    {
      title: "Presenter",
      body: "Talk tracks, scripts, timing options, and presenter guidance for live events.",
      href: "/presenter",
      icon: ScrollText
    }
  ];

  return (
    <main className="px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-paper/10 bg-[linear-gradient(180deg,rgba(23,40,71,0.92),rgba(12,20,33,0.96))] px-6 py-8 shadow-horizon md:px-8 md:py-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Arizona Rule of Law Ambassador Program</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.06em] text-paper md:text-6xl">
                Everything an ambassador needs to prepare, present, and follow up.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-paper/72">
                Use Presentation for the live audience view, Certification to review the teaching points, Presenter to rehearse, and Resources for the manual, handout, and links.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/presentation" className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3.5 text-sm font-semibold text-ink transition hover:bg-gold hover:text-ink">
                  Open presentation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/presenter" className="inline-flex items-center gap-2 rounded-full border border-paper/14 bg-paper/5 px-6 py-3.5 text-sm font-semibold text-paper transition hover:border-gold/45 hover:text-gold">
                  Open presenter
                </Link>
                <Link href="/presentation/standalone" className="inline-flex items-center gap-2 rounded-full border border-paper/14 bg-paper/5 px-6 py-3.5 text-sm font-semibold text-paper transition hover:border-gold/45 hover:text-gold">
                  Standalone mode
                </Link>
              </div>
            </div>

            <aside className="rounded-[1.75rem] border border-paper/10 bg-paper/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Start here</p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-paper/75">
                <p><span className="font-semibold text-paper">1.</span> Open <span className="font-semibold text-paper">Presenter</span> to choose the talk length and review the script.</p>
                <p><span className="font-semibold text-paper">2.</span> Open <span className="font-semibold text-paper">Certification</span> to review the teaching points and questions.</p>
                <p><span className="font-semibold text-paper">3.</span> Use <span className="font-semibold text-paper">Presentation</span> or <span className="font-semibold text-paper">Standalone</span> for the room.</p>
                <p><span className="font-semibold text-paper">4.</span> Use <span className="font-semibold text-paper">Resources</span> for the handout, manual, and follow-up links.</p>
              </div>
              <div className="mt-5 border-t border-paper/10 pt-5 text-sm text-paper/65">
                <div className="flex items-center justify-between">
                  <span>Presentation scenes</span>
                  <span className="font-semibold text-paper">{experience.presentation.scenes.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Certification modules</span>
                  <span className="font-semibold text-paper">{lms.modules.length}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Downloads</span>
                  <span className="font-semibold text-paper">{downloads.length}</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {tabs.map((item) => (
            <Link key={item.title} href={item.href} className="rounded-[1.5rem] border border-paper/10 bg-paper/5 p-5 transition hover:border-gold/35 hover:bg-paper/[0.075]">
              <item.icon className="h-5 w-5 text-gold" />
              <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-paper">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-paper/68">{item.body}</p>
            </Link>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[1.75rem] border border-paper/10 bg-paper/5 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Live presentation</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-paper md:text-4xl">
              Use Presentation to rehearse. Use Standalone when the audience is in the room.
            </h2>
            <p className="mt-4 max-w-3xl text-base leading-8 text-paper/70">
              Presentation mode keeps navigation and support materials visible. Standalone mode removes the extra interface and shows one clear scene at a time for the audience.
            </p>
          </div>

          <aside className="rounded-[1.75rem] border border-paper/10 bg-[#111b2b] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Recommended path</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-paper">{track45?.title ?? "45-minute presenter flow"}</p>
            <div className="mt-5 space-y-3 text-sm leading-7 text-paper/72">
              <p>Best default for bar events, civic groups, and school presentations.</p>
              <p>Open Presenter first, then move to Presentation or Standalone for delivery.</p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
