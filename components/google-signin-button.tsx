"use client";

import { createClient } from "@/lib/supabase/client";

export function GoogleSignInButton({
  callbackParams,
}: {
  callbackParams?: Record<string, string>;
}) {
  async function handleClick() {
    const supabase = createClient();
    const search = callbackParams
      ? `?${new URLSearchParams(callbackParams).toString()}`
      : "";

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback${search}`,
      },
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium hover:bg-neutral-50"
    >
      המשך עם גוגל
    </button>
  );
}
