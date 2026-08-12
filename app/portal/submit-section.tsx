"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  missing_required_text_fields: "יש למלא את כל חמשת שדות הטקסט לפני השליחה.",
  too_few_photos: "צריך לפחות שש תמונות כדי לשלוח.",
  too_many_photos: "אפשר לשלוח עד עשרים תמונות.",
  photos_missing_titles: "לכל תמונה חייב להיות שם עבודה.",
  no_pending_submission_found: "משהו השתבש. רענן את העמוד ונסה שוב.",
};

export function SubmitSection({ ready }: { ready: boolean }) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [confirmingMore, setConfirmingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmitClick() {
    setError(null);
    setConfirmingMore(true);
  }

  function handleFinalSubmit() {
    startTransition(async () => {
      const supabase = createClient();
      const { error: rpcError } = await supabase.rpc("submit_portfolio");

      if (rpcError) {
        const code = rpcError.message.match(/[a-z_]+/)?.[0] ?? "";
        setError(ERROR_MESSAGES[code] ?? "השליחה נכשלה. נסה שוב.");
        setConfirmingMore(false);
        return;
      }

      router.refresh();
    });
  }

  if (confirmingMore) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-neutral-300 p-4">
        <p className="text-sm font-medium">
          יש לך עוד עבודות להוסיף? לאחר השליחה לא ניתן יהיה לערוך יותר.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setConfirmingMore(false)}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm"
          >
            כן, אני רוצה להוסיף עוד
          </button>
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isPending}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "שולח…" : "לא, שלח לבדיקה"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
        />
        <span>
          אני מאשר/ת פרסום שמי, התמונות שהעליתי והטקסט שכתבתי בעמוד תיק
          עבודות ציבורי.
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmitClick}
        disabled={!ready || !consent}
        className="w-fit rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-40"
      >
        שליחה סופית
      </button>
      {!ready && (
        <p className="text-xs text-neutral-500">
          יש למלא את כל השדות ולהעלות בין שש לעשרים תמונות עם שם לכל אחת כדי
          לשלוח.
        </p>
      )}
    </div>
  );
}
