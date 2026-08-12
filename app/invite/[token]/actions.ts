"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

type ActionResult = { error: string } | never;

export async function signUpWithInvite(
  token: string,
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: invite, error: inviteError } = await supabase
    .rpc("check_invite_token", { p_token: token })
    .maybeSingle();

  if (inviteError || !invite) {
    return { error: "ההזמנה הזו כבר אינה תקפה. פנה למנהל לקבלת קישור חדש." };
  }

  if (
    invite.student_email.trim().toLowerCase() !== email.trim().toLowerCase()
  ) {
    return {
      error: "כתובת המייל חייבת להיות זהה לכתובת שאליה נשלחה ההזמנה.",
    };
  }

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
    { email, password },
  );

  if (signUpError || !signUpData.user) {
    return { error: signUpError?.message ?? "יצירת החשבון נכשלה." };
  }

  const { error: claimError } = await supabase.rpc("claim_invite", {
    p_token: token,
  });

  if (claimError) {
    const admin = createServiceRoleClient();
    await admin.auth.admin.deleteUser(signUpData.user.id);
    return {
      error: "ההזמנה כבר מומשה בינתיים, או שאינה תקפה יותר. פנה למנהל.",
    };
  }

  redirect("/portal");
}
