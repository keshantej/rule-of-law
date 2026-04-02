"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/presentation", label: "Presentation" },
  { href: "/certification", label: "Certification" },
  { href: "/resources", label: "Resources" },
  { href: "/presenter", label: "Presenter" }
];

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/presentation/standalone") return null;

  const isActive = (href: string) =>
    pathname === href ||
    (href === "/presenter" && (pathname === "/toolkit" || pathname === "/presentation/speaker"));

  return (
    <header className="sticky top-0 z-40 bg-[#0b1320]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-[9px] font-bold uppercase tracking-[0.15em] text-gold/70 ring-1 ring-gold/15 transition group-hover:ring-gold/30">
            AZ
          </div>
          <span className="hidden whitespace-nowrap text-xs font-medium text-paper/40 transition group-hover:text-paper/60 sm:block">
            Arizona Rule of Law
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-[13px]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "relative rounded-md px-3 py-1.5 transition",
                isActive(link.href)
                  ? "text-white/80"
                  : "text-white/30 hover:text-white/55"
              ].join(" ")}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1/2 h-px w-4 -translate-x-1/2 bg-gold/50" />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
