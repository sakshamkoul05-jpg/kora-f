import { rooms } from "./rooms";
import { site } from "./site";

/**
 * TODO_CONFIRM: the production domain. Everything canonical — OpenGraph URLs,
 * the sitemap, JSON-LD @id — hangs off this, so set it before launch or search
 * engines will index the placeholder.
 *
 * Set NEXT_PUBLIC_SITE_URL in the deployment environment to override.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://korahouse.com"
).replace(/\/$/, "");

export const OG_IMAGE = `${SITE_URL}/brand/kora-house-logo.png`;

/**
 * Structured data. `LodgingBusiness` is the right type for a guesthouse — it
 * lets Google show the address, rating and price band directly in results.
 *
 * The aggregate rating is deliberately omitted: Google requires that a rating
 * shown in markup be collected and displayed BY THIS SITE. Ours is Google's
 * own 4.7/69, which we link to rather than host — marking it up here would be
 * a policy violation and can earn a manual action.
 */
export function lodgingJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    "@id": `${SITE_URL}/#lodging`,
    name: site.name,
    description:
      "A six-room homestay on the Lingkhor, the pilgrim's path around the Dalai Lama's temple in McLeodganj, Himachal Pradesh.",
    url: SITE_URL,
    logo: OG_IMAGE,
    image: [OG_IMAGE, `${SITE_URL}/images/place/hero-view-over-mcleodganj.jpg`],
    telephone: site.phone,
    email: site.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.line1,
      addressLocality: "McLeod Ganj, Dharamshala",
      addressRegion: "Himachal Pradesh",
      postalCode: "176219",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.coordinates.lat,
      longitude: site.coordinates.lng,
    },
    numberOfRooms: rooms.length,
    petsAllowed: false,
    amenityFeature: [
      { "@type": "LocationFeatureSpecification", name: "Shared balcony", value: true },
      { "@type": "LocationFeatureSpecification", name: "Common kitchen", value: true },
      { "@type": "LocationFeatureSpecification", name: "Shared sitting room", value: true },
      { "@type": "LocationFeatureSpecification", name: "Wheelchair accessible", value: false },
    ],
    // Stated plainly in markup as well as in copy.
    publicAccess: false,
    isAccessibleForFree: false,
  };
}
