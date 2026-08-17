"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function inviteAdmin(email: string, fullName: string) {
  const trimmed = email.trim().toLowerCase();
  const trimmedName = fullName.trim();
  if (!trimmed) return { error: "צריך כתובת אימייל.", link: null };
  if (!trimmedName) return { error: "צריך שם למנהל.", link: null };

  const admin = createServiceRoleClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: trimmed,
  });

  if (error || !data.user) {
    return { error: "יצירת ההזמנה נכשלה. ייתכן שהמייל כבר בשימוש.", link: null };
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: data.user.id, role: "admin", full_name: trimmedName });

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "יצירת ההזמנה נכשלה.", link: null };
  }

  revalidatePath("/admin/team");
  return { error: null, link: data.properties.action_link };
}

export async function removeAdmin(profileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id === profileId) {
    return { error: "אי אפשר להסיר את החשבון שאיתו אתה מחובר כרגע." };
  }

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if ((count ?? 0) <= 1) {
    return { error: "לא ניתן להסיר את המנהל האחרון שנותר." };
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);

  if (error) return { error: "ההסרה נכשלה." };

  revalidatePath("/admin/team");
  return { error: null };
}
