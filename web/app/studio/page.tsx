import Link from "next/link";

export const dynamic = "force-static";

export default function StudioPage() {
  return (
    <main className="bg-paper px-5 py-16 md:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-navy/10 bg-white p-8 shadow-horizon md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-ember">Studio</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-navy md:text-5xl">
          Sanity Studio is not included in the GitHub Pages export.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-navy/72">
          The shared static site includes the published presentation, toolkit, resources, and downloads. Editing workflows like Sanity Studio should be run locally or deployed separately on a full app host such as Vercel.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/presentation" className="rounded-full bg-navy px-5 py-3 text-sm font-semibold text-paper transition hover:bg-ember">
            Open presentation
          </Link>
          <Link href="/toolkit" className="rounded-full border border-navy/10 bg-paper px-5 py-3 text-sm font-semibold text-navy transition hover:border-ember/40 hover:text-ember">
            Open toolkit
          </Link>
        </div>
      </div>
    </main>
  );
}
