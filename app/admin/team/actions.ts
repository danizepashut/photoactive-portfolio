"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

// עריכת שם מנהל קיים מוגבלת לדני בלבד - לא חלק ממודל ההרשאות השווה בין
// מנהלים (כל השאר בכוונה זהה), חריג מפורש לפי בקשה כדי שלא כל מנהל יוכל
// לשנות שמות של אחרים.
const DANI_PROFILE_ID = "37ea9d81-93fb-4ba7-bb95-4405fcd78549";

export async function updateAdminName(profileId: string, fullName: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.id !== DANI_PROFILE_ID) {
    return { error: "אין לך הרשאה לערוך שמות מנהלים." };
  }

  const trimmed = fullName.trim();
  if (!trimmed) return { error: "השם לא יכול להיות ריק." };

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: trimmed })
    .eq("id", profileId);

  if (error) return { error: "עדכון השם נכשל." };

  revalidatePath("/admin/team");
  return { error: null };
}

export async function inviteAdmin(email: string, fullName: string) {
  const trimmed = email.trim().toLowerCase();
  const trimmedName = fullName.trim();
  if (!trimmed) return { error: "צריך כתובת אימייל.", link: null };
  if (!trimmedName) return { error: "צריך שם למנהל.", link: null };

  const admin = createServiceRoleClient();
  const origin = await getOrigin();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: trimmed,
    options: { redirectTo: `${origin}/auth/accept-invite` },
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
