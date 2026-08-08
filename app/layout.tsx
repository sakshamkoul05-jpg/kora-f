import type { Metadata } from "next";
import { IBM_Plex_Mono, Karla, Marcellus, Noto_Serif_Tibetan } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PaperTexture } from "@/components/PaperTexture";
import { KhataTransition } from "@/components/KhataTransition";
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
  title: {
    default: "Kora House — Stay on the Lingkhor, McLeodganj",
    template: "%s",
  },
  description:
    "A homestay on the pilgrim's kora circuit beside the Dalai Lama temple, McLeodganj. Six rooms, valley and mountain views, walking distance to the temple and market.",
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
