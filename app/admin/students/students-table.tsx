"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { STATUS_LABELS, STATUS_COLORS, type StatusKey } from "@/lib/student-status";
import { StudentRowActions } from "@/app/admin/cohorts/[id]/student-row-actions";

type Row = {
  id: string;
  cohort_id: string;
  cohort_name: string;
  full_name: string;
  email: string;
  status: StatusKey;
  invite_token: string;
  invite_token_used: boolean;
};

export function StudentsTable({
  students,
  cohorts,
}: {
  students: Row[];
  cohorts: { id: string; name: string }[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusKey | "all">("all");
  const [cohortFilter, setCohortFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (cohortFilter !== "all" && s.cohort_id !== cohortFilter) return false;
      if (
        q &&
        !s.full_name.toLowerCase().includes(q) &&
        !s.email.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [students, query, statusFilter, cohortFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="חיפוש לפי שם או אימייל"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusKey | "all")}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="all">כל הסטטוסים</option>
          {(Object.keys(STATUS_LABELS) as StatusKey[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          value={cohortFilter}
          onChange={(e) => setCohortFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="all">כל המחזורים</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-right">
            <tr>
              <th className="px-3 py-2">שם</th>
              <th className="px-3 py-2">אימייל</th>
              <th className="px-3 py-2">מחזור</th>
              <th className="px-3 py-2">סטטוס</th>
              <th className="px-3 py-2">הזמנה</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-neutral-200">
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="text-neutral-900 underline-offset-2 hover:underline"
                  >
                    {s.full_name}
                  </Link>
                </td>
                <td className="px-3 py-2">{s.email}</td>
                <td className="px-3 py-2 text-neutral-500">
                  {s.cohort_name}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[s.status]}`}
                  >
                    {STATUS_LABELS[s.status]}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <StudentRowActions
                    cohortId={s.cohort_id}
                    studentId={s.id}
                    inviteToken={s.invite_token}
                    status={s.status}
                    inviteTokenUsed={s.invite_token_used}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">
                  אין תוצאות.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
