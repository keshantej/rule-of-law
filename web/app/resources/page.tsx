import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { getDownloads, getResourceGroups } from "@/lib/content";

export default async function ResourcesPage() {
  const [groups, downloads] = await Promise.all([getResourceGroups(), getDownloads()]);

  return (
    <main className="px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Resources</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
          Download the program materials and Arizona resource links.
        </h1>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="max-w-3xl text-lg leading-8 text-white/80">
            Keep this page open when you need the handout, the field guide, the manual, or a trusted link to share with an audience.
          </div>
          <div className="rounded-[1.75rem] border border-paper/10 bg-paper p-6 text-ink">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Quick jump</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {groups.map((group) => (
                <a key={group.resource_group_id} href={`#${group.resource_group_id}`} className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm text-ink/78 transition hover:border-gold/45 hover:text-gold">
                  {group.title}
                </a>
              ))}
            </div>
          </div>
        </div>
        <section className="mt-8 rounded-[2rem] border border-paper/10 bg-paper p-6 text-ink md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold">Downloads</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink">Core files for presenters and staff.</h2>
            </div>
            <div className="text-sm leading-7 text-ink/70">
              These are the files most people will need before, during, or after an event.
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {downloads.map((asset) => (
              <Link key={asset.asset_id} href={asset.href} className="rounded-[1.4rem] border border-ink/10 bg-white p-5 transition hover:border-gold/35 hover:-translate-y-0.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-ink">{asset.title}</p>
                  <span className="rounded-full border border-ink/10 bg-paper px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink/55">{asset.format}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink/70">{asset.description}</p>
              </Link>
            ))}
          </div>
        </section>
        <div className="mt-8 rounded-[2rem] border border-paper/10 bg-paper text-ink shadow-horizon">
          {groups.map((group) => (
            <section
              id={group.resource_group_id}
              key={group.resource_group_id}
              className="border-t border-ink/10 p-6 first:border-t-0 md:p-8"
            >
              <div className="grid gap-6 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-ink">{group.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-ink/72">{group.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.links.map((link) => {
                    const liveHref = /^https?:\/\//.test(link.href);
                    const content = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-ink">{link.label}</h3>
                            <p className="mt-2 text-sm leading-7 text-ink/70">{link.description}</p>
                          </div>
                          {link.is_placeholder ? <span className="rounded-full bg-ember/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">Placeholder</span> : <ExternalLink className="h-4 w-4 text-ink/45" />}
                        </div>
                        <p className="mt-4 break-all text-sm text-ink/58">{link.href}</p>
                      </>
                    );

                    return liveHref ? (
                      <Link key={`${group.resource_group_id}-${link.label}`} href={link.href} target="_blank" rel="noreferrer" className="rounded-[1.4rem] border border-ink/10 bg-white p-5 transition hover:border-gold/35 hover:-translate-y-0.5">
                        {content}
                      </Link>
                    ) : (
                      <div key={`${group.resource_group_id}-${link.label}`} className="rounded-[1.4rem] border border-ink/10 bg-white p-5">
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
