import type { Metadata } from "next";
import { IBM_Plex_Mono, Karla, Marcellus, Noto_Serif_Tibetan } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PaperTexture } from "@/components/PaperTexture";
import { KhataTransition } from "@/components/KhataTransition";
import { site } from "@/lib/site";
import "./globals.css";

const marcellus = Marcellus({
  variable: "--font-marcellus",
  subsets: ["latin"],
  weight: "400",
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Uchen script, for the mantra carved into the mani stones. `display: block`
// rather than swap: Tibetan has no sane fallback on most systems, so it is
// better for the carving to be briefly absent than to flash as tofu. The
// stones also check at runtime that this actually loaded before carving —
// see components/motion/ManiStone.tsx.
const notoTibetan = Noto_Serif_Tibetan({
  variable: "--font-tibetan",
  subsets: ["tibetan"],
  weight: ["400", "600"],
  display: "block",
});

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description:
    "A six-room hilltop guesthouse in McLeodganj, Himachal Pradesh. Quiet, secluded, and run by its hosts — with a balcony that is the reason most people book.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${marcellus.variable} ${karla.variable} ${plexMono.variable} ${notoTibetan.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <PaperTexture />
        <KhataTransition>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </KhataTransition>
      </body>
    </html>
  );
}
