"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function setOwnPassword(password: string) {
  if (password.length < 8) {
    return { error: "הסיסמה צריכה להיות באורך של 8 תווים לפחות." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "החיבור פג תוקף. תתחבר מחדש." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "קביעת הסיסמה נכשלה." };

  redirect("/admin");
}
