"use client";

import { useState, useTransition } from "react";
import { addStudent } from "@/app/admin/cohorts/[id]/actions";

export function AddStudentForm({ cohortId }: { cohortId: string }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addStudent(cohortId, fullName, email, phone);
      if (result?.error) {
        setError(result.error);
      } else {
        setFullName("");
        setEmail("");
        setPhone("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-2">
      <input
        type="text"
        required
        placeholder="שם מלא"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="w-40 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        type="email"
        required
        placeholder="אימייל"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-52 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <input
        type="tel"
        required
        placeholder="טלפון, למשל 0501234567"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-44 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isPending ? "מוסיף…" : "הוספת תלמיד"}
      </button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}
