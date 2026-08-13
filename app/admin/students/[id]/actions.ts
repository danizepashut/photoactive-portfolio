"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function deleteStudent(studentId: string, cohortId: string) {
  const supabase = await createClient();

  const { data: photos } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("student_id", studentId);

  const paths = (photos ?? []).map((p) => p.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from("portfolio-photos").remove(paths);
  }

  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", studentId);

  if (error) return { error: "מחיקת התלמיד נכשלה." };

  redirect(`/admin/cohorts/${cohortId}`);
}
