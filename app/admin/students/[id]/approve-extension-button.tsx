"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ApproveExtensionButton({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc(
        "admin_approve_extension",
        { p_student_id: studentId },
      );

      if (rpcError) {
        setError("האישור נכשל.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
      <p className="flex-1 text-sm text-amber-900">
        התלמיד ביקש הארכה של 7 ימים להגשה.
      </p>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "מאשר…" : "אשר הארכה"}
      </button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
