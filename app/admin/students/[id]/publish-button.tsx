"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  too_few_selected_photos: "צריך לבחור לפחות שש תמונות.",
  too_many_selected_photos: "אפשר לבחור עד עשרים תמונות.",
  selected_photos_missing_order: "יש בעיה בסדר התמונות. נסה לשנות סדר ולנסות שוב.",
};

export function PublishButton({
  studentId,
  selectedCount,
  alreadyPublished,
}: {
  studentId: string;
  selectedCount: number;
  alreadyPublished: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ready = selectedCount >= 6 && selectedCount <= 20;

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc(
        "admin_publish_portfolio",
        { p_student_id: studentId },
      );

      if (rpcError) {
        const code = rpcError.message.match(/[a-z_]+/)?.[0] ?? "";
        setError(ERROR_MESSAGES[code] ?? "הפרסום נכשל.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={!ready || isPending}
        className="w-fit rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        {isPending ? "מפרסם…" : alreadyPublished ? "עדכון פרסום" : "פרסום"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
