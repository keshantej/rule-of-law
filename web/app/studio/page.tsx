import Link from "next/link";

export const dynamic = "force-static";

export default function StudioPage() {
  return (
    <main className="px-5 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-paper/10 bg-[#111b2b] p-8 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold">Studio</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-paper md:text-5xl">
          Sanity Studio is not included in the GitHub Pages export.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-paper/72">
          The shared static site includes the published presentation, toolkit, resources, and downloads. Editing workflows like Sanity Studio should be run locally or deployed separately on a full app host such as Vercel.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/presentation" className="rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink transition hover:bg-gold">
            Open presentation
          </Link>
          <Link href="/presenter" className="rounded-full border border-paper/10 bg-paper/10 px-5 py-3 text-sm font-semibold text-paper transition hover:border-gold/40 hover:text-gold">
            Open presenter
          </Link>
        </div>
      </div>
    </main>
  );
}
