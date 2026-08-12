import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/student-status";
import { AddStudentForm } from "@/app/admin/cohorts/[id]/add-student-form";
import { BulkImportForm } from "@/app/admin/cohorts/[id]/bulk-import-form";
import { StudentRowActions } from "@/app/admin/cohorts/[id]/student-row-actions";

export default async function CohortDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: cohort } = await supabase
    .from("cohorts")
    .select("id, name")
    .eq("id", id)
    .single();

  if (!cohort) notFound();

  const { data: students } = await supabase
    .from("students")
    .select(
      "id, full_name, email, phone, status, color_hue, color_variation, invite_token, invite_token_used, view_count",
    )
    .eq("cohort_id", id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">{cohort.name}</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">הוספת תלמיד</h2>
        <AddStudentForm cohortId={cohort.id} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">ייבוא מאקסל / CSV</h2>
        <p className="text-xs text-neutral-500">
          עמודות נדרשות: שם, אימייל, טלפון (בכל שפה/סדר, כותרת בשורה
          הראשונה).
        </p>
        <BulkImportForm cohortId={cohort.id} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          תלמידים ({students?.length ?? 0})
        </h2>
        {!students?.length ? (
          <p className="text-sm text-neutral-500">עדיין אין תלמידים במחזור.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-right">
                <tr>
                  <th className="px-3 py-2">שם</th>
                  <th className="px-3 py-2">אימייל</th>
                  <th className="px-3 py-2">טלפון</th>
                  <th className="px-3 py-2">גוון</th>
                  <th className="px-3 py-2">סטטוס</th>
                  <th className="px-3 py-2">הזמנה</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
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
                    <td className="px-3 py-2" dir="ltr">
                      {s.phone}
                    </td>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {s.color_hue}.{s.color_variation}
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
                        cohortId={cohort.id}
                        studentId={s.id}
                        inviteToken={s.invite_token}
                        status={s.status}
                        inviteTokenUsed={s.invite_token_used}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
