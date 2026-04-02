import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { getDownloads, getResourceGroups } from "@/lib/content";

export default async function ResourcesPage() {
  const [groups, downloads] = await Promise.all([getResourceGroups(), getDownloads()]);

  return (
    <main className="bg-paper px-5 py-12 md:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Arizona resources</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-[-0.05em] text-navy md:text-6xl">
          Find the handout, manual, field guide, and Arizona partner links in one place.
        </h1>
        <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="max-w-2xl text-lg leading-8 text-navy/72">
            Use this page after or before a presentation when you need the official files, trusted local institutions, or a clear next step to share with an audience.
          </div>
          <div className="rounded-[1.75rem] border border-navy/10 bg-dune p-6 shadow-horizon">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Use during or after the event</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-navy">Share these when the audience asks where to learn more.</p>
            <p className="mt-3 text-sm leading-7 text-navy/72">
              Reach for these links during Q&A, in follow-up emails, or when you need a trustworthy community resource to point to next.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {groups.map((group) => (
                <a key={group.resource_group_id} href={`#${group.resource_group_id}`} className="rounded-full border border-navy/10 bg-white/70 px-3 py-2 text-sm text-navy transition hover:border-ember/40 hover:text-ember">
                  {group.title}
                </a>
              ))}
            </div>
          </div>
        </div>
        <section className="mt-10 rounded-[2rem] border border-navy/10 bg-white p-6 shadow-horizon md:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ember">Downloadables</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-navy">Keep the core program materials easy to find.</h2>
            </div>
            <div className="text-sm leading-7 text-navy/74">
              These are the files most likely to be opened by attorneys, organizers, or audience members after the presentation.
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {downloads.map((asset) => (
              <Link key={asset.asset_id} href={asset.href} className="rounded-[1.4rem] border border-navy/10 bg-[#fcf8ef] p-5 transition hover:-translate-y-0.5 hover:border-ember/30">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-navy">{asset.title}</p>
                  <span className="rounded-full border border-navy/10 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-navy/55">{asset.format}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-navy/72">{asset.description}</p>
              </Link>
            ))}
          </div>
        </section>
        <div className="mt-12 space-y-8">
          {groups.map((group) => (
            <section id={group.resource_group_id} key={group.resource_group_id} className="rounded-[2rem] border border-navy/10 bg-dune p-6 md:p-8">
              <div className="grid gap-6 lg:grid-cols-[minmax(14rem,18rem)_minmax(0,1fr)]">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-navy">{group.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-navy/74">{group.description}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.links.map((link) => {
                    const liveHref = /^https?:\/\//.test(link.href);
                    const content = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-semibold text-navy">{link.label}</h3>
                            <p className="mt-2 text-sm leading-7 text-navy/70">{link.description}</p>
                          </div>
                          {link.is_placeholder ? <span className="rounded-full bg-ember/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-ember">Placeholder</span> : <ExternalLink className="h-4 w-4 text-navy/45" />}
                        </div>
                        <p className="mt-4 break-all text-sm text-navy/65">{link.href}</p>
                      </>
                    );

                    return liveHref ? (
                      <Link key={`${group.resource_group_id}-${link.label}`} href={link.href} target="_blank" rel="noreferrer" className="rounded-[1.4rem] border border-navy/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-ember/30">
                        {content}
                      </Link>
                    ) : (
                      <div key={`${group.resource_group_id}-${link.label}`} className="rounded-[1.4rem] border border-navy/10 bg-white p-5">
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
