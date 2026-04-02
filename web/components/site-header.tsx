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
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-paper/94 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 md:px-8 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="group flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/10 bg-white text-[10px] font-semibold uppercase tracking-[0.24em] text-ember shadow-sm">
            AZ
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-ember transition group-hover:text-navy">
              Arizona Rule of Law
            </p>
            <p className="text-sm font-semibold tracking-[-0.02em] text-navy">
              Ambassador Program
            </p>
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-1.5 text-sm text-navy/80">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={[
                "rounded-full px-3 py-2 transition",
                pathname === link.href || (link.href === "/presenter" && (pathname === "/toolkit" || pathname === "/presentation/speaker"))
                  ? "bg-navy text-paper shadow-sm"
                  : link.href === "/presenter"
                    ? "border border-navy/10 bg-white hover:border-ember/40 hover:text-ember"
                    : "hover:bg-white hover:text-ember"
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
