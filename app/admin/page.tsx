import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateCohortForm } from "@/app/admin/create-cohort-form";
import { STATUS_LABELS, type StatusKey } from "@/lib/student-status";
import type { StudentStatus } from "@/lib/supabase/types";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ data: cohorts }, { data: students }] = await Promise.all([
    supabase
      .from("cohorts")
      .select("id, name, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("students").select("cohort_id, status"),
  ]);

  const countsByCohort = new Map<string, Record<StudentStatus, number>>();
  const overall: Record<string, number> = {};

  for (const s of students ?? []) {
    overall[s.status] = (overall[s.status] ?? 0) + 1;
    const bucket =
      countsByCohort.get(s.cohort_id) ??
      ({
        pending_submission: 0,
        not_submitted: 0,
        pending_review: 0,
        published: 0,
        expired: 0,
      } as Record<StudentStatus, number>);
    bucket[s.status as StatusKey] += 1;
    countsByCohort.set(s.cohort_id, bucket);
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">דשבורד</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          {(Object.keys(STATUS_LABELS) as StatusKey[]).map((status) => (
            <div
              key={status}
              className="rounded-lg border border-neutral-200 px-4 py-3"
            >
              <div className="text-2xl font-bold">{overall[status] ?? 0}</div>
              <div className="text-xs text-neutral-500">
                {STATUS_LABELS[status]}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">פתיחת מחזור חדש</h2>
        <CreateCohortForm />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">מחזורים</h2>
        {!cohorts?.length ? (
          <p className="text-sm text-neutral-500">עדיין אין מחזורים.</p>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-200 rounded-lg border border-neutral-200">
            {cohorts.map((cohort) => {
              const counts = countsByCohort.get(cohort.id);
              const total = counts
                ? Object.values(counts).reduce((a, b) => a + b, 0)
                : 0;
              return (
                <Link
                  key={cohort.id}
                  href={`/admin/cohorts/${cohort.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
                >
                  <span className="font-medium">{cohort.name}</span>
                  <span className="text-sm text-neutral-500">
                    {total} תלמידים
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
