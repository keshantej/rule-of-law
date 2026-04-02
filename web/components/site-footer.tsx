import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-6 border-t border-white/[0.06] pt-8 pb-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/60">
            Arizona Rule of Law
          </p>
          <p className="text-sm font-semibold text-white/50">Ambassador Program</p>
          <p className="mt-2 max-w-md text-xs leading-5 text-white/30">
            A civic education initiative preparing attorneys and community leaders to present on the Rule of Law across Arizona.
          </p>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-white/35">
          <Link href="/presentation" className="transition hover:text-white/60">Presentation</Link>
          <Link href="/certification" className="transition hover:text-white/60">Certification</Link>
          <Link href="/resources" className="transition hover:text-white/60">Resources</Link>
          <Link href="/presenter" className="transition hover:text-white/60">Presenter</Link>
        </nav>
      </div>
    </footer>
  );
}
