"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RequestExtensionButton() {
  const router = useRouter();
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("request_extension");

      if (rpcError) {
        setError("הבקשה נכשלה. נסה שוב או פנה לצוות פוטואקטיב.");
        return;
      }

      setRequested(true);
      router.refresh();
    });
  }

  if (requested) {
    return (
      <p className="text-sm text-green-700">
        הבקשה נשלחה. נעדכן אותך כשהיא תאושר.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-fit rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "שולח…" : "בקש הארכה של 7 ימים"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
