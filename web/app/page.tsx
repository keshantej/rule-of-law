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
      body: "Scene-by-scene civic education presentation with standalone delivery mode for live audiences.",
      href: "/presentation",
      icon: Presentation
    },
    {
      title: "Certification",
      body: "Module-based learning with quizzes and reflection prompts to solidify your understanding of the material.",
      href: "/certification",
      icon: Award
    },
    {
      title: "Resources",
      body: "Downloadable handouts, field guides, Arizona partner links, and audience follow-up materials.",
      href: "/resources",
      icon: FolderOpen
    },
    {
      title: "Presenter",
      body: "Timed talk tracks, facilitation guidance, and preparation tools for every presentation format.",
      href: "/presenter",
      icon: ScrollText
    }
  ];

  return (
    <main className="px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Hero */}
        <section className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">
              Arizona Rule of Law Ambassador Program
            </p>
            <h1 className="mt-4 max-w-lg text-3xl font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-4xl">
              Equip yourself to champion the Rule of Law.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">
              The Ambassador Program provides Arizona attorneys and civic leaders with a complete set of presentation materials, certification training, facilitation guides, and audience resources — everything you need to deliver a compelling, nonpartisan civic education experience.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/presentation" className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold/90">
                Open presentation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/presenter" className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-5 py-3 text-sm font-medium text-paper/50 transition hover:border-white/15 hover:text-white/70">
                Presenter mode
              </Link>
              <Link href="/presentation/standalone" className="inline-flex items-center gap-2 rounded-xl border border-white/8 px-5 py-3 text-sm font-medium text-paper/50 transition hover:border-white/15 hover:text-white/70">
                Standalone
              </Link>
            </div>
          </div>

          <aside className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Getting started</p>
              <div className="mt-3 space-y-2.5 text-xs leading-5 text-white/40">
                <div className="flex items-start gap-2.5">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-gold/60 ring-1 ring-gold/20">1</span>
                  <p><span className="text-white/60">Presenter</span> — select your talk format and review the scripted guide.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-gold/60 ring-1 ring-gold/20">2</span>
                  <p><span className="text-white/60">Certification</span> — work through each module and confirm your understanding.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-gold/60 ring-1 ring-gold/20">3</span>
                  <p><span className="text-white/60">Present</span> — open Standalone mode for live audience delivery.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold text-gold/60 ring-1 ring-gold/20">4</span>
                  <p><span className="text-white/60">Resources</span> — distribute handouts and follow-up materials.</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-white/25">
              <div className="flex justify-between"><span>Scenes</span><span className="text-white/50">{experience.presentation.scenes.length}</span></div>
              <div className="flex justify-between"><span>Modules</span><span className="text-white/50">{lms.modules.length}</span></div>
              <div className="flex justify-between"><span>Downloads</span><span className="text-white/50">{downloads.length}</span></div>
            </div>
          </aside>
        </section>

        {/* Navigation grid */}
        <section className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-4">
          {tabs.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group flex flex-col justify-between bg-[#0f1a2a] p-6 transition hover:bg-[#141f33]"
            >
              <div>
                <item.icon className="h-5 w-5 text-gold/40 transition group-hover:text-gold/70" />
                <h2 className="mt-4 text-lg font-semibold text-white/80">{item.title}</h2>
                <p className="mt-1.5 text-xs leading-5 text-white/35">{item.body}</p>
              </div>
              <div className="mt-5 flex items-center gap-1 text-xs font-medium text-gold/40 transition group-hover:text-gold/70">
                Open
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </section>

        {/* Recommendation */}
        <section className="mt-16 grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Recommended</p>
            <h2 className="mt-2 max-w-lg text-2xl font-semibold tracking-[-0.02em] text-white">
              Recommended: {track45?.title ?? "45-Minute Format"}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-white/40">
              The 45-minute format is the standard for bar association events, civic groups, and educational settings. It covers all four core principles with time for audience discussion and reflection.
            </p>
          </div>
          <div className="space-y-2 text-sm leading-6 text-white/35">
            <p>Use <span className="text-white/50">Presentation</span> mode to rehearse with full navigation and speaker notes visible.</p>
            <p>Switch to <span className="text-white/50">Standalone</span> mode when presenting to a live audience for a clean, distraction-free display.</p>
          </div>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}
