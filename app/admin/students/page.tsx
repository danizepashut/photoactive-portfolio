import { createClient } from "@/lib/supabase/server";
import { StudentsTable } from "@/app/admin/students/students-table";

export default async function AllStudentsPage() {
  const supabase = await createClient();

  const [{ data: students }, { data: cohorts }] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, cohort_id, full_name, email, status, invite_token, invite_token_used, cohorts(name)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("cohorts").select("id, name").order("name"),
  ]);

  const rows = (students ?? []).map((s) => ({
    id: s.id,
    cohort_id: s.cohort_id,
    cohort_name: (s.cohorts as unknown as { name: string } | null)?.name ?? "",
    full_name: s.full_name,
    email: s.email,
    status: s.status,
    invite_token: s.invite_token,
    invite_token_used: s.invite_token_used,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">כל התלמידים</h1>
      <StudentsTable students={rows} cohorts={cohorts ?? []} />
    </div>
  );
}
