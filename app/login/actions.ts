"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "אימייל או סיסמה שגויים." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "admin") redirect("/admin");
  if (profile?.role === "student") redirect("/portal");

  await supabase.auth.signOut();
  return { error: "לחשבון הזה אין עדיין הרשאה במערכת. פנה למנהל." };
}
