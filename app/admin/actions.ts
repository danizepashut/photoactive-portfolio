"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCohort(name: string) {
  if (!name.trim()) return { error: "צריך שם למחזור." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("cohorts")
    .insert({ name: name.trim(), opened_by: user?.id })
    .select()
    .single();

  if (error) return { error: "פתיחת המחזור נכשלה." };

  revalidatePath("/admin");
  redirect(`/admin/cohorts/${data.id}`);
}
