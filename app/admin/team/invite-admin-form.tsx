"use client";

import { useState, useTransition } from "react";
import { inviteAdmin } from "@/app/admin/team/actions";

export function InviteAdminForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLink(null);
    startTransition(async () => {
      const result = await inviteAdmin(email, fullName);
      if (result.error) {
        setError(result.error);
      } else {
        setLink(result.link);
        setFullName("");
        setEmail("");
      }
    });
  }

  function handleCopy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-2">
        <input
          type="text"
          required
          placeholder="שם המנהל החדש"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-56 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
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
          <div className="flex items-center gap-2">
            <code className="break-all">{link}</code>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-700 hover:bg-neutral-100"
            >
              {copied ? "הועתק!" : "העתקת קישור"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
