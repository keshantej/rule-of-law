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
  if (pathname === "/presentation/standalone") {
    return null;
  }

  const isActive = (href: string) =>
    pathname === href ||
    (href === "/presenter" && (pathname === "/toolkit" || pathname === "/presentation/speaker"));

  return (
    <header className="sticky top-0 z-40 bg-[#0b1320]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link href="/" className="group flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-ember/20 text-[10px] font-bold uppercase tracking-[0.2em] text-gold ring-1 ring-gold/20 transition group-hover:ring-gold/40">
            AZ
          </div>
          <div className="hidden whitespace-nowrap sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold/80 transition group-hover:text-gold">
              Arizona Rule of Law
            </p>
            <p className="text-[13px] font-semibold tracking-[-0.01em] text-paper/90">
              Ambassador Program
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "relative rounded-lg px-3.5 py-2 font-medium transition",
                isActive(link.href)
                  ? "bg-white/10 text-paper"
                  : "text-paper/55 hover:bg-white/5 hover:text-paper/80"
              ].join(" ")}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-gold" />
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="divider-gradient" />
    </header>
  );
}
