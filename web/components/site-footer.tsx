import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/[0.04] pt-8 pb-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold/40">Arizona Rule of Law</p>
          <p className="text-xs font-medium text-white/30">Ambassador Program</p>
        </div>
        <nav className="flex gap-4 text-[11px] text-white/20">
          <Link href="/presentation" className="transition hover:text-white/40">Presentation</Link>
          <Link href="/certification" className="transition hover:text-white/40">Certification</Link>
          <Link href="/resources" className="transition hover:text-white/40">Resources</Link>
          <Link href="/presenter" className="transition hover:text-white/40">Presenter</Link>
        </nav>
      </div>
    </footer>
  );
}
