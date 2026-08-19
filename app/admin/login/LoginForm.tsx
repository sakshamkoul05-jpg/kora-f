"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-[var(--radius-card)] border border-butter/45 bg-butter/[0.08] p-6 text-sm leading-relaxed text-ink-soft">
        Supabase isn&apos;t configured for this deployment, so there is nothing
        to sign in to. Set <code className="font-data">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code className="font-data">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — see BACKEND.md.
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase isn't configured.");
      setBusy(false);
      return;
    }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      // Deliberately generic: distinguishing "no such user" from "wrong
      // password" tells an attacker which emails have accounts.
      setError("That email and password didn't match.");
      setBusy(false);
      return;
    }
    router.replace(params.get("next") || "/admin");
    router.refresh();
  }

  const input =
    "mt-1.5 w-full rounded-[var(--radius-kora)] border border-ink/20 bg-paper-raised px-3.5 py-2.5 text-[15px] focus:border-maroon focus:outline-none";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="eyebrow text-ink/50">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </div>
      <div>
        <label htmlFor="password" className="eyebrow text-ink/50">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={input}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-maroon">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-[var(--radius-kora)] bg-maroon px-6 py-3 font-display text-[15px] text-paper transition-colors hover:bg-maroon-deep disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function LoginForm() {
  // useSearchParams needs a Suspense boundary during prerender.
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
