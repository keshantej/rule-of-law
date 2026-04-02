import Link from "next/link";
import { Download, ExternalLink, FolderOpen } from "lucide-react";

import { getDownloads, getResourceGroups } from "@/lib/content";

export default async function ResourcesPage() {
  const [groups, downloads] = await Promise.all([getResourceGroups(), getDownloads()]);

  return (
    <main className="px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/[0.06] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold">
          <FolderOpen className="h-3.5 w-3.5" />
          Resources
        </div>
        <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-white md:text-5xl">
          Download the program materials and Arizona resource links.
        </h1>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <p className="max-w-2xl text-base leading-7 text-white/55">
            Keep this page open when you need the handout, the field guide, the manual, or a trusted link to share with an audience.
          </p>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Quick jump</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {groups.map((group) => (
                <a key={group.resource_group_id} href={`#${group.resource_group_id}`} className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs font-medium text-paper/50 transition hover:border-gold/30 hover:text-gold">
                  {group.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Downloads */}
        <section className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold/80">Downloads</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">Core files for presenters and staff.</h2>
            </div>
            <p className="text-xs leading-6 text-white/40">
              These are the files most people will need before, during, or after an event.
            </p>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {downloads.map((asset) => (
              <Link key={asset.asset_id} href={asset.href} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-gold/20 card-lift">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base font-semibold text-white/80">{asset.title}</p>
                  <span className="shrink-0 rounded-md bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-paper/30">{asset.format}</span>
                </div>
                <p className="mt-2 text-xs leading-6 text-white/40">{asset.description}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gold/60 transition group-hover:text-gold">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Resource groups */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03]">
          {groups.map((group) => (
            <section
              id={group.resource_group_id}
              key={group.resource_group_id}
              className="border-t border-white/[0.06] p-6 first:border-t-0 md:p-8"
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(14rem,17rem)_minmax(0,1fr)]">
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">{group.title}</h2>
                  <p className="mt-2 text-xs leading-6 text-white/40">{group.description}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.links.map((link) => {
                    const liveHref = /^https?:\/\//.test(link.href);
                    const content = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-white/75">{link.label}</h3>
                            <p className="mt-1.5 text-xs leading-5 text-white/40">{link.description}</p>
                          </div>
                          {link.is_placeholder ? (
                            <span className="shrink-0 rounded-md bg-ember/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ember/70">Pending</span>
                          ) : (
                            <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-paper/25" />
                          )}
                        </div>
                        <p className="mt-3 break-all text-[11px] text-white/25">{link.href}</p>
                      </>
                    );

                    return liveHref ? (
                      <Link key={`${group.resource_group_id}-${link.label}`} href={link.href} target="_blank" rel="noreferrer" className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 transition hover:border-gold/20 card-lift">
                        {content}
                      </Link>
                    ) : (
                      <div key={`${group.resource_group_id}-${link.label}`} className="rounded-xl border border-white/[0.04] bg-white/[0.01] p-5 opacity-75">
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
