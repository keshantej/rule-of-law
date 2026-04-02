import Link from "next/link";
import { ArrowRight, Award, FolderOpen, Presentation, ScrollText } from "lucide-react";

import { HorizonArt } from "@/components/horizon-art";
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
    <main>
      <section className="relative overflow-hidden bg-dune px-5 py-12 md:px-8 md:py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(205,161,93,0.22),transparent_22%),radial-gradient(circle_at_80%_16%,rgba(155,35,50,0.14),transparent_22%),linear-gradient(180deg,rgba(247,241,228,0.78),rgba(239,229,208,0.92))]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:min-h-[42rem] lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.9fr)]">
          <div className="flex max-w-3xl flex-col">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.34em] text-ember">Arizona Rule of Law Ambassador Program</p>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.06em] text-navy md:text-7xl">
              Presentation, training, and speaker materials for Arizona Rule of Law ambassadors.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-navy/72 md:text-xl">
              Use this site to present to a public audience, review the training modules, prepare from the speaker guide, and access the handout, manual, and other program materials.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/presentation" className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3.5 text-sm font-semibold text-paper transition hover:bg-ember">
                Open presentation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/presentation/standalone" className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-paper/80 px-6 py-3.5 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember">
                Open standalone mode
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 border-t border-navy/10 pt-6 text-sm text-navy/68">
              <span>{experience.presentation.scenes.length} presentation scenes</span>
              <span>{lms.modules.length} certification modules</span>
              <span>{downloads.length} downloadable files</span>
            </div>
          </div>
          <div className="grid gap-4">
            <HorizonArt className="min-h-[32rem]" />
            <div className="grid gap-3 md:grid-cols-3">
              {["Presentation", "Preparation", "Downloads"].map((line) => (
                <div key={line} className="border-t border-navy/10 pt-3 text-sm font-medium text-navy/70">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Site sections</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-navy md:text-5xl">
              Choose the part of the program you need.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-navy/72">
              The site is organized around the main jobs an ambassador needs to do before, during, and after a presentation.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {tabs.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-[1.5rem] border border-navy/10 bg-white/85 p-5 shadow-horizon transition hover:-translate-y-0.5 hover:border-ember/25">
                  <item.icon className="h-5 w-5 text-ember" />
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em] text-navy">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-navy/74">{item.body}</p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="rounded-[2rem] border border-navy/10 bg-navy p-7 text-paper shadow-horizon">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Recommended workflow</p>
            <p className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{track45?.title ?? "45-minute presenter flow"}</p>
            <div className="mt-6 space-y-4 text-sm leading-7 text-paper/76">
              <p><span className="font-semibold text-paper">1.</span> Start in Presenter to review the talk track, script, and timing.</p>
              <p><span className="font-semibold text-paper">2.</span> Use Certification to review the teaching points and questions.</p>
              <p><span className="font-semibold text-paper">3.</span> Open Presentation or Standalone mode for the live audience view.</p>
              <p><span className="font-semibold text-paper">4.</span> Use Resources for handouts, links, and follow-up materials.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="section-frame bg-white px-5 py-16 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Live delivery</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-navy md:text-5xl">
              Use Presentation to navigate, then Standalone when the audience is in front of you.
            </h2>
            <div className="mt-6 space-y-5 text-sm leading-8 text-navy/74">
              <p>
                Presentation mode keeps the scene list and related materials available while you prepare or rehearse.
              </p>
              <p>
                Standalone mode removes the surrounding interface and keeps the room focused on one clear message at a time.
              </p>
            </div>
          </div>
          <div className="rounded-[2rem] border border-navy/10 bg-[#fcf8ef] p-7 shadow-horizon">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Quick launch</p>
            <div className="mt-5 space-y-3">
              <Link href="/presentation" className="flex items-center justify-between rounded-2xl border border-navy/10 bg-white px-4 py-4 text-sm font-semibold text-navy transition hover:border-ember/30 hover:text-ember">
                Open Presentation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/presentation/standalone" className="flex items-center justify-between rounded-2xl border border-navy/10 bg-white px-4 py-4 text-sm font-semibold text-navy transition hover:border-ember/30 hover:text-ember">
                Open Standalone mode
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/presenter" className="flex items-center justify-between rounded-2xl border border-navy/10 bg-white px-4 py-4 text-sm font-semibold text-navy transition hover:border-ember/30 hover:text-ember">
                Open Presenter
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
