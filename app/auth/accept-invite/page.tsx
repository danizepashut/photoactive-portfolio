"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// קישורי admin.generateLink (הזמנת מנהל) מגיעים עם access_token/refresh_token
// ב-hash fragment של ה-URL (implicit flow), לא עם ?code= כמו זרימת ה-PKCE
// שאר האפליקציה משתמשת בה. ה-fragment לא נשלח לשרת בכלל, אז חייבים לקרוא
// אותו כאן בצד הלקוח ולהשלים את ה-session ידנית לפני שממשיכים.
export default function AcceptInvitePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) {
        setError("הקישור לא תקין או שפג תוקפו.");
        return;
      }

      const supabase = createClient();
      const { error: sessionError } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (sessionError) {
        setError("החיבור נכשל. ייתכן שהקישור כבר נוצל.");
        return;
      }

      router.replace("/admin/set-password");
    }
    run();
  }, [router]);

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-3 py-16 text-center">
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <p className="text-sm text-neutral-500">מתחבר…</p>
      )}
    </div>
  );
}
