"use client";

import { useState, useTransition } from "react";
import { deleteStudent } from "@/app/admin/students/[id]/actions";

export function DeleteStudentButton({
  studentId,
  cohortId,
  studentName,
}: {
  studentId: string;
  cohortId: string;
  studentName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    const confirmed = window.confirm(
      `למחוק לצמיתות את הכרטיס של ${studentName}? כולל כל התמונות. אי אפשר לשחזר.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteStudent(studentId, cohortId);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="w-fit rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
      >
        {isPending ? "מוחק…" : "מחיקת תלמיד"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
