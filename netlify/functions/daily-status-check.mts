import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

// פוטואקטיב, בדיקה יומית: מעברי סטטוס אוטומטיים.
// קורא לשתי הפונקציות הטהורות שכבר נבדקו ידנית ב-Supabase
// (supabase/migrations/20260818000000_status_cron_functions.sql):
//   - pending_submission -> not_submitted, כשחלון 7 הימים חלף
//   - published -> expired, שנתיים אחרי הפרסום
// לא שולח שום התראה בעצמו — שליחת התזכורות/הודעות מחוברת בנפרד, ברגע
// שערוץ המייל ו-Meta Cloud API יהיו מוגדרים (עדיין פתוח, ראו README).

export default async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const [notSubmitted, expired] = await Promise.all([
    supabase.rpc("cron_expire_not_submitted"),
    supabase.rpc("cron_expire_published_portfolios"),
  ]);

  if (notSubmitted.error || expired.error) {
    console.error("daily-status-check failed", {
      notSubmittedError: notSubmitted.error,
      expiredError: expired.error,
    });
    return new Response("error", { status: 500 });
  }

  console.log("daily-status-check done", {
    movedToNotSubmitted: notSubmitted.data,
    movedToExpired: expired.data,
  });

  return new Response("ok");
};

export const config: Config = {
  // כל יום ב-04:00 UTC (06:00/07:00 בישראל, תלוי בשעון קיץ)
  schedule: "0 4 * * *",
};
