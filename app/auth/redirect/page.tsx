"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// עטיפה מכוונת: קישורי הזמנה/איפוס נשלחים לפעמים בערוצי צ'אט (וואטסאפ וכו')
// שמייצרים תצוגה מקדימה על ידי שליפת ה-URL בצד שרת, בלי הרצת JS. אם היינו
// שולחים ישירות את קישור ה-verify הגולמי של סופאבייס, השליפה הזו הייתה
// "צורכת" את הטוקן החד-פעמי לפני שהאדם בפועל בכלל לחץ עליו. הדף הזה בדומיין
// שלנו לא עושה כלום בטעינת השרת - ההפניה בפועל לסופאבייס קורית רק כאן,
// ב-useEffect בצד לקוח, כך שבוטים של תצוגה מקדימה (שלא מריצים JS) לא נוגעים
// בטוקן בכלל.
function RedirectInner() {
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const type = params.get("type") ?? "invite";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!token || !supabaseUrl) return;

    const redirectTo = `${window.location.origin}/auth/accept-invite`;
    const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token)}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(redirectTo)}`;
    window.location.href = verifyUrl;
  }, [params]);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
      <p className="text-sm text-neutral-500">מעביר אותך…</p>
    </div>
  );
}

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={null}>
      <RedirectInner />
    </Suspense>
  );
}
