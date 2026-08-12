"use client";

import { useRef, useState, useTransition } from "react";
import { parseStudentSheet } from "@/lib/parse-student-sheet";
import {
  bulkImportStudents,
  type ImportResult,
  type ImportRow,
} from "@/app/admin/cohorts/[id]/actions";

export function BulkImportForm({ cohortId }: { cohortId: string }) {
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);
    setResults(null);
    try {
      const parsed = await parseStudentSheet(file);
      if (parsed.length === 0) {
        setParseError("לא נמצאו שורות תלמידים בקובץ.");
        setRows(null);
        return;
      }
      setRows(parsed);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : "קריאת הקובץ נכשלה.");
      setRows(null);
    }
  }

  function handleImport() {
    if (!rows) return;
    startTransition(async () => {
      const res = await bulkImportStudents(cohortId, rows);
      setResults(res);
      if (res.every((r) => !r.error)) {
        setRows(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="text-sm"
      />
      {parseError && <p className="text-xs text-red-600">{parseError}</p>}

      {rows && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-neutral-600">
            נמצאו {rows.length} שורות. לבדוק ולאשר לפני הייבוא:
          </p>
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-right">
                <tr>
                  <th className="px-3 py-2">שם</th>
                  <th className="px-3 py-2">אימייל</th>
                  <th className="px-3 py-2">טלפון</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-neutral-200">
                    <td className="px-3 py-2">{row.full_name}</td>
                    <td className="px-3 py-2">{row.email}</td>
                    <td className="px-3 py-2">{row.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={handleImport}
            disabled={isPending}
            className="w-fit rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPending ? "מייבא…" : `ייבוא ${rows.length} תלמידים`}
          </button>
        </div>
      )}

      {results && (
        <div className="flex flex-col gap-1 text-sm">
          {results.map((r, i) => (
            <div
              key={i}
              className={r.error ? "text-red-600" : "text-green-700"}
            >
              {r.row.full_name} — {r.error ?? "נוצר בהצלחה"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
