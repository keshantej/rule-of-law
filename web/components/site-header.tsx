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

  return (
    <header className="sticky top-0 z-40 border-b border-paper/10 bg-ink/94 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="group flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-paper/12 bg-paper/5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold shadow-sm">
            AZ
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-gold transition group-hover:text-paper">
              Arizona Rule of Law
            </p>
            <p className="text-sm font-semibold tracking-[-0.02em] text-paper">
              Ambassador Program
            </p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm text-paper/80">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "rounded-full px-4 py-2.5 transition",
                pathname === link.href || (link.href === "/presenter" && (pathname === "/toolkit" || pathname === "/presentation/speaker"))
                  ? "bg-paper text-ink shadow-sm"
                  : link.href === "/presenter"
                    ? "border border-paper/12 bg-paper/5 hover:border-gold/45 hover:text-paper"
                    : "hover:bg-paper/5 hover:text-paper"
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
