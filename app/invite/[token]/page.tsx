import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "@/app/invite/[token]/invite-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: invite } = await supabase
    .rpc("check_invite_token", { p_token: token })
    .maybeSingle();

  if (!invite) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
        <h1 className="text-xl font-bold">הקישור אינו תקף</h1>
        <p className="text-sm text-neutral-600">
          ייתכן שההזמנה כבר מומשה, שהיא פגה, או שהקישור אינו נכון. פנה לצוות
          פוטואקטיב לקבלת קישור חדש.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          היי {invite.student_full_name}, ברוך הבא לפוטואקטיב
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          צור חשבון כדי להתחיל למלא את תיק העבודות שלך.
        </p>
      </div>
      <InviteForm token={token} defaultEmail={invite.student_email} />
    </main>
  );
}
