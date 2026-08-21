import type { Metadata } from "next";
import Link from "next/link";
import { Ornament } from "@/components/Ornament";
import { site, whatsappUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank you — Kora House",
  robots: { index: false, follow: false },
};

/**
 * Where Razorpay sends the guest after paying.
 *
 * This page deliberately does NOT say "payment successful". Anyone can open
 * this URL with any parameters — the callback is not proof of anything. The
 * only thing that may mark a booking paid is the signed webhook, which arrives
 * server-to-server and is verified by HMAC.
 *
 * So the wording thanks them and says confirmation follows, which is true
 * either way, rather than asserting an outcome this page cannot know.
 */
export default async function PaidPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ref) ? sp.ref[0] : sp.ref;
  // Only ever echoed back inside a text node, and shape-checked first so a
  // crafted ref cannot put arbitrary text on the page.
  const reference = raw && /^KH-\d{4}-[A-Za-z0-9]{4,8}$/.test(raw) ? raw : null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center md:px-8">
      <div className="flex justify-center">
        <Ornament variant="cloud" />
      </div>

      <h1 className="display-xl mt-8">Thank you.</h1>

      <p className="lede mt-6">
        We&apos;re checking that through with the payment provider now. As soon
        as it clears, your room is confirmed and one of the hosts will write to
        you.
      </p>

      {reference && (
        <p className="mt-6 text-ink-soft">
          Your reference is{" "}
          <span className="font-mono font-medium text-ink">{reference}</span>
        </p>
      )}

      <p className="mt-8 text-sm leading-relaxed text-ink-soft">
        If anything looks wrong, or you don&apos;t hear from us today, message
        us — we&apos;d far rather sort it out now than have you wondering.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a
          href={whatsappUrl(
            reference ? `Hello — I've just paid the deposit for ${reference}.` : undefined
          )}
          className="rounded-[var(--radius-kora)] bg-deodar px-5 py-2.5 text-sm font-medium text-paper"
        >
          Message us on WhatsApp
        </a>
        <Link
          href="/"
          className="rounded-[var(--radius-kora)] border border-ink/20 px-5 py-2.5 text-sm text-ink transition-colors hover:border-ink/40"
        >
          Back to the house
        </Link>
      </div>

      <p className="mt-10 text-sm text-ink/45">Kora House — {site.footerTagline}</p>
    </div>
  );
}
