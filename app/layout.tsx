import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Karla, Marcellus, Noto_Serif_Tibetan } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PaperTexture } from "@/components/PaperTexture";
import { KhataTransition } from "@/components/KhataTransition";
import { OG_IMAGE, SITE_URL, lodgingJsonLd } from "@/lib/seo";
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

const TITLE = "Kora House — Stay on the Lingkhor, McLeodganj";
const DESCRIPTION =
  "A homestay on the pilgrim's kora circuit beside the Dalai Lama temple, McLeodganj. Six rooms, valley and mountain views, walking distance to the temple and market.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s" },
  description: DESCRIPTION,
  applicationName: "Kora House",
  keywords: [
    "Kora House",
    "McLeodganj homestay",
    "Dharamshala guesthouse",
    "stay near Dalai Lama temple",
    "Lingkhor kora walk",
    "Buddha House Road",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Kora House",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    locale: "en_IN",
    images: [{ url: OG_IMAGE, width: 900, height: 700, alt: "Kora House" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: {
    icon: [
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/brand/icon-180.png", sizes: "180x180" }],
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true, address: false, email: true },
};

export const viewport: Viewport = {
  themeColor: "#4e7f3e",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${marcellus.variable} ${karla.variable} ${plexMono.variable} ${notoTibetan.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        {/* Keyboard users shouldn't have to tab the whole nav on every page. */}
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <PaperTexture />
        <KhataTransition>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </KhataTransition>
        <script
          type="application/ld+json"
          // Static, locally-generated object — no user input reaches this.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingJsonLd()) }}
        />
      </body>
    </html>
  );
}
