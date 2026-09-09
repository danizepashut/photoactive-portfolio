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

// מגבלה זמנית (2026-09): כל עוד אלדד לא סגר רכישה, מסך ניהול הצוות כולו -
// גם הפעולות, לא רק ה-UI - מוגבל לדני בלבד. שאר המנהלים (כרגע מיכאל) לא
// אמורים לנהל הזמנות/הקפאות/הסרות של מנהלים אחרים בשלב הזה. כשדני יאשר
// שאלדד רכש, אפשר להסיר את הבדיקה הזו מארבע הפעולות שמשתמשות בה.
const TEAM_ACTIONS_RESTRICTED_TO_DANI = true;

async function requireDani(user: { id: string } | null) {
  if (!TEAM_ACTIONS_RESTRICTED_TO_DANI) return null;
  if (user?.id !== DANI_PROFILE_ID) {
    return "מסך ניהול הצוות זמנית זמין לדני בלבד.";
  }
  return null;
}

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
  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();
  const restrictionError = await requireDani(caller);
  if (restrictionError) return { error: restrictionError, link: null };

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

  // עוטפים את קישור ה-verify הגולמי של סופאבייס בדף שלנו (/auth/redirect):
  // אם הקישור נשלח בוואטסאפ, תצוגה מקדימה שנוצרת בצד שרת (בלי JS) עלולה
  // "לצרוך" בטעות את הטוקן החד-פעמי לפני שהמנהל בכלל לחץ עליו. הדף שלנו
  // לא עושה כלום בטעינה רגילה - ההפניה בפועל לסופאבייס קורית רק ב-JS
  // בצד לקוח, שבוט תצוגה מקדימה אף פעם לא מריץ.
  const wrappedLink = `${origin}/auth/redirect?token=${encodeURIComponent(data.properties.hashed_token)}&type=invite`;

  return { error: null, link: wrappedLink };
}

// חסימת התחברות אמיתית דרך מנגנון ה-ban המובנה של Supabase (ban_duration),
// לא רק דגל תצוגה - כך גם ניסיון התחברות עם סיסמה תקינה נדחה בפועל. הקפאה
// עדיפה על מחיקה כשמדובר בהשעיה זמנית, כדי לא להקים את המשתמש מחדש.
const FREEZE_BAN_DURATION = "876000h"; // ~100 שנה, אין ערך "לצמיתות" ב-API

export async function freezeAdmin(profileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const restrictionError = await requireDani(user);
  if (restrictionError) return { error: restrictionError };

  if (user?.id === profileId) {
    return { error: "אי אפשר להקפיא את החשבון שאיתו אתה מחובר כרגע." };
  }

  // הגנה קבועה, לא קשורה למגבלה הזמנית למעלה: דני נשאר מנהל קבוע במערכת
  // הזאת עד שהוא עצמו יבקש אחרת בשיחה ישירה - אף מנהל אחר (כולל אלדד,
  // בעתיד) לא יכול להקפיא את החשבון שלו דרך המסך הזה.
  if (profileId === DANI_PROFILE_ID) {
    return { error: "לא ניתן להקפיא את חשבון זה." };
  }

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin")
    .is("frozen_at", null);

  if ((count ?? 0) <= 1) {
    return { error: "לא ניתן להקפיא את המנהל הפעיל האחרון שנותר." };
  }

  const admin = createServiceRoleClient();
  const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
    ban_duration: FREEZE_BAN_DURATION,
  });
  if (authError) return { error: "ההקפאה נכשלה." };

  const { error } = await admin
    .from("profiles")
    .update({ frozen_at: new Date().toISOString() })
    .eq("id", profileId);

  if (error) return { error: "ההקפאה נכשלה." };

  revalidatePath("/admin/team");
  return { error: null };
}

export async function unfreezeAdmin(profileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const restrictionError = await requireDani(user);
  if (restrictionError) return { error: restrictionError };

  const admin = createServiceRoleClient();
  const { error: authError } = await admin.auth.admin.updateUserById(profileId, {
    ban_duration: "none",
  });
  if (authError) return { error: "ביטול ההקפאה נכשל." };

  const { error } = await admin
    .from("profiles")
    .update({ frozen_at: null })
    .eq("id", profileId);

  if (error) return { error: "ביטול ההקפאה נכשל." };

  revalidatePath("/admin/team");
  return { error: null };
}

export async function removeAdmin(profileId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const restrictionError = await requireDani(user);
  if (restrictionError) return { error: restrictionError };

  if (user?.id === profileId) {
    return { error: "אי אפשר להסיר את החשבון שאיתו אתה מחובר כרגע." };
  }

  // הגנה קבועה, לא קשורה למגבלה הזמנית למעלה: דני נשאר מנהל קבוע במערכת
  // הזאת עד שהוא עצמו יבקש אחרת בשיחה ישירה - אף מנהל אחר (כולל אלדד,
  // בעתיד) לא יכול להסיר את החשבון שלו דרך המסך הזה.
  if (profileId === DANI_PROFILE_ID) {
    return { error: "לא ניתן להסיר את חשבון זה." };
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
