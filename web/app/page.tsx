import Link from "next/link";
import { ArrowRight, Award, FolderOpen, Presentation, ScrollText } from "lucide-react";

import { getDownloads, getLmsArtifact, getSpeakerTrack, getWebExperience } from "@/lib/content";
import { SiteFooter } from "@/components/site-footer";

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
      body: "Audience-facing scenes for live delivery, with standalone mode for uninterrupted room use.",
      href: "/presentation",
      icon: Presentation,
      cta: "Open presentation"
    },
    {
      title: "Certification",
      body: "Module review and knowledge checks to confirm the substance before presenting.",
      href: "/certification",
      icon: Award,
      cta: "Start review"
    },
    {
      title: "Resources",
      body: "Downloadables, partner links, and follow-up materials in one place.",
      href: "/resources",
      icon: FolderOpen,
      cta: "Browse resources"
    },
    {
      title: "Presenter",
      body: "Talk tracks, scripts, timing options, and live event guidance.",
      href: "/presenter",
      icon: ScrollText,
      cta: "Prepare to speak"
    }
  ];

  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl space-y-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-[#131f36] via-[#0f1a2b] to-[#0d1522] px-6 py-10 md:px-10 md:py-14 glow-gold">
          <div className="absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-gold/[0.04] blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-[200px] w-[200px] rounded-full bg-ember/[0.03] blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                Arizona Rule of Law Ambassador Program
              </div>
              <h1 className="mt-6 max-w-2xl text-3xl font-semibold leading-[1.1] tracking-[-0.04em] text-white sm:text-4xl">
                Everything an ambassador needs to prepare, present, and follow up.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/65 md:text-lg md:leading-8">
                Open the presentation for the room, review the certification modules before speaking, use the presenter tools to rehearse, and keep the resources ready for follow-up.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/presentation" className="inline-flex items-center gap-2.5 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold/90">
                  Open presentation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/presenter" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/8 hover:text-white">
                  Open presenter
                </Link>
                <Link href="/presentation/standalone" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/8 hover:text-white">
                  Standalone mode
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">Start here</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-white/60">
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/10 text-[10px] font-bold text-gold">1</span>
                  <p>Open <span className="font-medium text-white/85">Presenter</span> to pick the talk length and review the script.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/10 text-[10px] font-bold text-gold">2</span>
                  <p>Open <span className="font-medium text-white/85">Certification</span> to review the teaching points.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/10 text-[10px] font-bold text-gold">3</span>
                  <p>Use <span className="font-medium text-white/85">Presentation</span> or <span className="font-medium text-white/85">Standalone</span> for the audience.</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gold/10 text-[10px] font-bold text-gold">4</span>
                  <p>Use <span className="font-medium text-white/85">Resources</span> for handout, manual, and follow-up links.</p>
                </div>
              </div>
              <div className="mt-5 space-y-2 border-t border-white/[0.06] pt-5 text-sm text-white/45">
                <div className="flex items-center justify-between">
                  <span>Presentation scenes</span>
                  <span className="font-semibold text-white/70">{experience.presentation.scenes.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Certification modules</span>
                  <span className="font-semibold text-white/70">{lms.modules.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Downloads</span>
                  <span className="font-semibold text-white/70">{downloads.length}</span>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Navigation cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {tabs.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#131f36]/60 p-6 transition hover:border-gold/20 hover:bg-[#162240]/70 card-lift"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold transition group-hover:bg-gold/15">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-[-0.02em] text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">{item.body}</p>
              <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-gold/70 transition group-hover:text-gold">
                {item.cta}
                <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>

        {/* Live presentation + recommended path */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <div className="rounded-2xl border border-white/[0.06] bg-[#131f36]/60 p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Live presentation</p>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-[-0.03em] text-white md:text-3xl">
              Use Presentation to rehearse. Use Standalone when the audience is in the room.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/55">
              Presentation mode keeps navigation and support materials visible. Standalone mode removes the extra interface and shows one clear scene at a time for the audience.
            </p>
          </div>

          <aside className="rounded-2xl border border-white/[0.06] bg-white/[0.04] p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold/80">Recommended path</p>
            <p className="mt-3 text-xl font-semibold tracking-[-0.02em] text-white">{track45?.title ?? "45-minute presenter flow"}</p>
            <div className="mt-4 space-y-2 text-sm leading-7 text-white/50">
              <p>Best default for bar events, civic groups, and school presentations.</p>
              <p>Open Presenter first, then move to Presentation or Standalone for delivery.</p>
            </div>
          </aside>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
