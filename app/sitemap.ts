import type { MetadataRoute } from "next";
import { rooms } from "@/lib/rooms";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "", priority: 1, freq: "monthly" },
    { path: "/rooms", priority: 0.9, freq: "monthly" },
    { path: "/book", priority: 0.9, freq: "monthly" },
    { path: "/house", priority: 0.8, freq: "yearly" },
    { path: "/experiences", priority: 0.8, freq: "yearly" },
    { path: "/guidebook", priority: 0.8, freq: "monthly" },
    { path: "/getting-here", priority: 0.7, freq: "yearly" },
    { path: "/faq", priority: 0.6, freq: "monthly" },
    { path: "/credits", priority: 0.2, freq: "yearly" },
  ];

  return [
    ...pages.map((p) => ({
      url: `${SITE_URL}${p.path}`,
      lastModified: now,
      changeFrequency: p.freq,
      priority: p.priority,
    })),
    ...rooms.map((room) => ({
      url: `${SITE_URL}/rooms/${room.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
  // /motion is intentionally absent — it is an internal review route.
}
