import type { Metadata } from "next";
import Link from "next/link";
import { Ornament } from "@/components/Ornament";

export const metadata: Metadata = {
  title: "Off the path — Kora House",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-24 text-center">
      <Ornament variant="cloud" />
      <h1 className="display-lg mt-6">Looks like you&apos;ve stepped off the path.</h1>
      <p className="lede mt-5">
        That page isn&apos;t here. The circle starts again at the front door.
      </p>
      <Link
        href="/"
        className="mt-9 inline-block rounded-[var(--radius-kora)] bg-maroon px-7 py-3 font-display text-sm tracking-wide text-paper transition-colors hover:bg-maroon-deep"
      >
        Back to the house
      </Link>
    </div>
  );
}
