"use client";

import { useState, useTransition } from "react";
import { signUpWithInvite } from "@/app/invite/[token]/actions";
import { GoogleSignInButton } from "@/components/google-signin-button";

export function InviteForm({
  token,
  defaultEmail,
}: {
  token: string;
  defaultEmail: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signUpWithInvite(token, email, password);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <GoogleSignInButton callbackParams={{ token }} />

      <div className="flex items-center gap-3 text-xs text-neutral-400">
        <div className="h-px flex-1 bg-neutral-200" />
        או
        <div className="h-px flex-1 bg-neutral-200" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          אימייל
          <input
            type="email"
            required
            readOnly
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          סיסמה
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "יוצר חשבון…" : "יצירת חשבון"}
        </button>
      </form>
    </div>
  );
}
