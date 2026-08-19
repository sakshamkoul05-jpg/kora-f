import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Karla, Marcellus, Noto_Serif_Tibetan } from "next/font/google";
import { OG_IMAGE, SITE_URL } from "@/lib/seo";
import "./globals.css";

/**
 * Document shell only — fonts, metadata, <html>/<body>.
 *
 * The marketing chrome (header, footer, paper texture, khata page transition)
 * lives in app/(site)/layout.tsx instead, so that /admin does not inherit it.
 * That is not just cosmetic: the build spec forbids animation in the admin, and
 * the khata transition would otherwise run on every host navigation.
 */

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
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "Kora House, McLeodganj" }],
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
