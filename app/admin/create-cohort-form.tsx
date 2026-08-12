"use client";

import { useState, useTransition } from "react";
import { createCohort } from "@/app/admin/actions";

export function CreateCohortForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCohort(name);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-2">
      <div className="flex flex-col gap-1">
        <input
          type="text"
          required
          placeholder="שם המחזור, למשל מחזור אוגוסט 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-72 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "פותח…" : "פתיחת מחזור"}
      </button>
    </form>
  );
}
