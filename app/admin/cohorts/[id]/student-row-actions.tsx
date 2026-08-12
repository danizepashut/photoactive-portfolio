"use client";

import { useState, useTransition } from "react";
import { resendInvite } from "@/app/admin/cohorts/[id]/actions";

export function StudentRowActions({
  cohortId,
  studentId,
  inviteToken,
  status,
  inviteTokenUsed,
}: {
  cohortId: string;
  studentId: string;
  inviteToken: string;
  status: string;
  inviteTokenUsed: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCopy() {
    const url = `${window.location.origin}/invite/${inviteToken}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleResend() {
    startTransition(async () => {
      await resendInvite(cohortId, studentId);
    });
  }

  if (inviteTokenUsed || status !== "pending_submission") {
    return <span className="text-xs text-neutral-400">—</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleCopy}
        className="text-xs text-neutral-600 hover:text-neutral-900"
      >
        {copied ? "הועתק!" : "העתקת קישור"}
      </button>
      <button
        type="button"
        onClick={handleResend}
        disabled={isPending}
        className="text-xs text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
      >
        {isPending ? "שולח…" : "שליחה חוזרת"}
      </button>
    </div>
  );
}
