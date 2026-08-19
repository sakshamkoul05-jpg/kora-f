import type { Metadata } from "next";
import { MotionLab } from "./MotionLab";

// Internal review route. Not linked from navigation and kept out of search.
export const metadata: Metadata = {
  title: "Motion lab — Kora House",
  robots: { index: false, follow: false },
};

export default function MotionPage() {
  return <MotionLab />;
}
