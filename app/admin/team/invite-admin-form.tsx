"use client";

import { useState, useTransition } from "react";
import { inviteAdmin } from "@/app/admin/team/actions";

export function InviteAdminForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLink(null);
    startTransition(async () => {
      const result = await inviteAdmin(email);
      if (result.error) {
        setError(result.error);
      } else {
        setLink(result.link);
        setEmail("");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex items-start gap-2">
        <input
          type="email"
          required
          placeholder="אימייל של המנהל החדש"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "מזמין…" : "הזמנת מנהל"}
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {link && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs">
          <p className="mb-1 text-neutral-600">
            אין לנו עדיין שליחה אוטומטית — תעתיק ותשלח את הקישור הזה ידנית
            למנהל החדש. הקישור מאפשר לו לקבוע סיסמה ולהתחבר:
          </p>
          <code className="break-all">{link}</code>
        </div>
      )}
    </div>
  );
}
