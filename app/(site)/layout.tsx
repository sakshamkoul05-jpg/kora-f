import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { KhataTransition } from "@/components/KhataTransition";
import { Daylight } from "@/components/motion/Daylight";
import { PaperTexture } from "@/components/PaperTexture";
import { lodgingJsonLd } from "@/lib/seo";

/**
 * The public site: header, footer, paper texture and the khata page
 * transition. Deliberately scoped to this route group so /admin gets none of
 * it — the build spec forbids animation in the admin, and a host triaging
 * bookings does not want the marketing nav either.
 *
 * This layout has no dynamic APIs, so the pages inside it stay statically
 * generated.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Keyboard users shouldn't have to tab the whole nav on every page. */}
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <PaperTexture />
      {/* Lights the page by the hour it is in McLeodganj. Renders nothing —
          it sets a data attribute on <html> after mount, so static pages stay
          static and hydration has nothing to disagree about. */}
      <Daylight />
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
    </>
  );
}
