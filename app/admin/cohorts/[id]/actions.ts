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
  const trimmedName = fullName.trim();
  const { error } = await supabase.rpc("admin_create_student", {
    p_cohort_id: cohortId,
    p_full_name: trimmedName,
    p_email: email.trim().toLowerCase(),
    p_phone: phone,
  });

  if (error) return { error: "הוספת התלמיד נכשלה." };

  await supabase.rpc("create_notification", {
    p_kind: "new_student",
    p_title: `נוסף תלמיד חדש: ${trimmedName}`,
    p_body: null,
    p_link: `/admin/cohorts/${cohortId}`,
  });

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

  const successCount = results.filter((r) => !r.error).length;
  if (successCount > 0) {
    await supabase.rpc("create_notification", {
      p_kind: "new_students_bulk",
      p_title: `יובאו ${successCount} תלמידים חדשים`,
      p_body: null,
      p_link: `/admin/cohorts/${cohortId}`,
    });
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
