"use server";

import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { revalidatePath } from "next/cache";

export type ImportRow = { full_name: string; email: string; phone: string };
export type ImportResult = { row: ImportRow; error: string | null };

export async function addStudent(
  cohortId: string,
  fullName: string,
  email: string,
  phoneRaw: string,
) {
  const phone = normalizePhone(phoneRaw);
  if (!phone) return { error: "מספר הטלפון לא תקין." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_create_student", {
    p_cohort_id: cohortId,
    p_full_name: fullName.trim(),
    p_email: email.trim().toLowerCase(),
    p_phone: phone,
  });

  if (error) return { error: "הוספת התלמיד נכשלה." };

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { error: null };
}

export async function bulkImportStudents(
  cohortId: string,
  rows: ImportRow[],
): Promise<ImportResult[]> {
  const supabase = await createClient();
  const results: ImportResult[] = [];

  for (const row of rows) {
    const phone = normalizePhone(row.phone);
    if (!phone) {
      results.push({ row, error: "טלפון לא תקין" });
      continue;
    }

    const { error } = await supabase.rpc("admin_create_student", {
      p_cohort_id: cohortId,
      p_full_name: row.full_name.trim(),
      p_email: row.email.trim().toLowerCase(),
      p_phone: phone,
    });

    results.push({ row, error: error ? "יצירת הרשומה נכשלה" : null });
  }

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return results;
}

export async function resendInvite(cohortId: string, studentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resend_invite", {
    p_student_id: studentId,
  });

  if (error) return { error: "שליחה חוזרת נכשלה." };

  revalidatePath(`/admin/cohorts/${cohortId}`);
  return { error: null };
}
