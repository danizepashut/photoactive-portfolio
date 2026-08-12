"use client";

import { useState, useTransition } from "react";
import { removeAdmin } from "@/app/admin/team/actions";

export function RemoveAdminButton({ profileId }: { profileId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("להסיר את המנהל הזה?")) return;
    setError(null);
    startTransition(async () => {
      const result = await removeAdmin(profileId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
      >
        {isPending ? "מסיר…" : "הסרה"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
