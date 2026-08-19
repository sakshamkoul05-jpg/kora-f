"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function SignOut() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient()?.auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="rounded-[var(--radius-kora)] border border-ink/20 px-4 py-2 text-sm text-ink-soft transition-colors hover:border-ink/40 disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
