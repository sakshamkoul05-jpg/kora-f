import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Host sign in — Kora House",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-20">
      <p className="eyebrow text-maroon">Kora House</p>
      <h1 className="display-lg mt-3">Host sign in</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-soft">
        For Rohitash and Ashish. Booking requests contain guests&apos; contact
        details, so this is not a public page.
      </p>
      <div className="mt-8">
        <LoginForm />
      </div>
    </div>
  );
}
