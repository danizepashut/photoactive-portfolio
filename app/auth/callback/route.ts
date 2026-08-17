import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token = searchParams.get("token"); // invite token, only present on invite signup
  const adminInvite = searchParams.get("admin_invite"); // מוגדר רק בקישור הזמנת מנהל

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  if (token) {
    const { data: invite } = await supabase
      .rpc("check_invite_token", { p_token: token })
      .maybeSingle();

    const emailMatches =
      invite &&
      invite.student_email.trim().toLowerCase() ===
        (data.user.email ?? "").trim().toLowerCase();

    if (!emailMatches) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/invite/${token}?error=email_mismatch`,
      );
    }

    const { error: claimError } = await supabase.rpc("claim_invite", {
      p_token: token,
    });

    if (claimError) {
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${origin}/invite/${token}?error=already_claimed`,
      );
    }

    return NextResponse.redirect(`${origin}/portal`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profile?.role === "admin") {
    // הקישור הגיע מ-generateLink({type: 'invite' | 'recovery'}) - מזהה
    // את המשתמש ופותח session, אבל לא נותן לו הזדמנות לקבוע סיסמה בשום
    // מקום. בלי זה הוא נשאר עם חשבון בלי סיסמה ותקוע במסך ההתחברות הרגיל.
    if (adminInvite) {
      return NextResponse.redirect(`${origin}/admin/set-password`);
    }
    return NextResponse.redirect(`${origin}/admin`);
  }
  if (profile?.role === "student") {
    return NextResponse.redirect(`${origin}/portal`);
  }

  // authenticated but no profile: no valid invite was ever claimed
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login?error=no_profile`);
}
