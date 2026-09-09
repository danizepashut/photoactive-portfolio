"use client";

import { useState, useTransition } from "react";
import { freezeAdmin, unfreezeAdmin } from "@/app/admin/team/actions";

export function FreezeAdminButton({
  profileId,
  isFrozen,
}: {
  profileId: string;
  isFrozen: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmMsg = isFrozen
      ? "לבטל את ההקפאה ולאפשר למנהל הזה להתחבר שוב?"
      : "להקפיא את המנהל הזה? הוא לא יוכל להתחבר עד שתבטל את ההקפאה.";
    if (!confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const result = isFrozen
        ? await unfreezeAdmin(profileId)
        : await freezeAdmin(profileId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className={
          isFrozen
            ? "text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
            : "text-xs text-amber-600 hover:text-amber-800 disabled:opacity-50"
        }
      >
        {isPending ? "מעדכן…" : isFrozen ? "ביטול הקפאה" : "הקפאה"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
