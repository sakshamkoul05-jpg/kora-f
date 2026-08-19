import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        // Internal review route. Also noindex'd in its own metadata.
        "/motion",
        // Host area and the write endpoints. Access is enforced by RLS and the
        // proxy — this only keeps them out of the index and crawl budget.
        "/admin",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
