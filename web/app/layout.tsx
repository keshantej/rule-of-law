import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";

import { SiteHeader } from "@/components/site-header";
import { ServiceWorkerRegister } from "@/components/sw-register";
import "@/app/globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans"
});

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader"
});

export const metadata: Metadata = {
  title: "Arizona Rule of Law Ambassador Program",
  description: "A presenter-first civic education web experience for the Arizona Rule of Law Ambassador Program."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${newsreader.variable}`}>
      <body className="antialiased">
        <ServiceWorkerRegister />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
