import Link from "next/link";
import { Download, ExternalLink } from "lucide-react";

import { getDownloads, getResourceGroups } from "@/lib/content";

export default async function ResourcesPage() {
  const [groups, downloads] = await Promise.all([getResourceGroups(), getDownloads()]);

  return (
    <main className="px-5 py-12 md:px-8 md:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Resources</p>
        <h1 className="mt-3 max-w-md text-3xl font-semibold leading-[1.12] tracking-[-0.03em] text-white sm:text-4xl">
          Materials and links.
        </h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-white/45">
          Downloads, Arizona partner links, and follow-up materials for presenters and audiences.
        </p>

        {/* Quick jump */}
        <div className="mt-6 flex flex-wrap gap-1.5">
          {groups.map((group) => (
            <a key={group.resource_group_id} href={`#${group.resource_group_id}`} className="rounded-md bg-white/[0.04] px-2.5 py-1.5 text-xs text-paper/35 transition hover:text-gold/70">
              {group.title}
            </a>
          ))}
        </div>

        {/* Downloads */}
        <section className="mt-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gold/70">Downloads</p>
          <div className="mt-5 grid gap-px overflow-hidden rounded-2xl bg-white/[0.04] sm:grid-cols-2 xl:grid-cols-4">
            {downloads.map((asset) => (
              <Link key={asset.asset_id} href={asset.href} className="group flex flex-col justify-between bg-[#0f1a2a] p-5 transition hover:bg-[#141f33]">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white/75">{asset.title}</p>
                    <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.2em] text-paper/20">{asset.format}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-white/30">{asset.description}</p>
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-gold/40 transition group-hover:text-gold/70">
                  <Download className="h-3 w-3" />
                  Download
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Resource groups */}
        <div className="mt-16 space-y-12">
          {groups.map((group) => (
            <section id={group.resource_group_id} key={group.resource_group_id}>
              <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
                <div>
                  <h2 className="text-lg font-semibold text-white/80">{group.title}</h2>
                  <p className="mt-1.5 text-xs leading-5 text-white/30">{group.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.links.map((link) => {
                    const liveHref = /^https?:\/\//.test(link.href);
                    const content = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-sm font-medium text-white/65">{link.label}</h3>
                          {link.is_placeholder ? (
                            <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.18em] text-ember/50">Pending</span>
                          ) : (
                            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-paper/15" />
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-5 text-white/30">{link.description}</p>
                        <p className="mt-2 break-all text-[11px] text-white/15">{link.href}</p>
                      </>
                    );

                    return liveHref ? (
                      <Link key={`${group.resource_group_id}-${link.label}`} href={link.href} target="_blank" rel="noreferrer" className="rounded-xl bg-white/[0.02] p-4 ring-1 ring-white/[0.04] transition hover:bg-white/[0.04] hover:ring-gold/15">
                        {content}
                      </Link>
                    ) : (
                      <div key={`${group.resource_group_id}-${link.label}`} className="rounded-xl bg-white/[0.01] p-4 opacity-60 ring-1 ring-white/[0.03]">
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
