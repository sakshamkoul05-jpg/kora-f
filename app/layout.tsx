import type { Metadata } from "next";
import { IBM_Plex_Mono, Karla, Marcellus } from "next/font/google";
import { Footer } from "@/components/Footer";
import { GrainOverlay } from "@/components/GrainOverlay";
import { Header } from "@/components/Header";
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

export const metadata: Metadata = {
  title: `${site.name} — ${site.tagline}`,
  description:
    "A six-room hilltop guesthouse in McLeodganj, Himachal Pradesh. Quiet, secluded, and run by its hosts — with a balcony that is the reason most people book.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${marcellus.variable} ${karla.variable} ${plexMono.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <GrainOverlay />
        <KhataTransition>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </KhataTransition>
      </body>
    </html>
  );
}
