import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Admin shell. Deliberately bare.
 *
 * No marketing header or footer, no paper texture, and — per the build spec —
 * NO ANIMATION. Someone working through a stranger's booking at the end of a
 * long day wants the page to hold still. Do not add the khata transition here.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 bg-paper">{children}</div>;
}
