import Link from "next/link";
import { LogoutButton } from "@/app/logout-button";
import { PresenceHeartbeat } from "@/app/admin/presence-heartbeat";
import { NotificationsBell } from "@/app/admin/notifications-bell";
import { createClient } from "@/lib/supabase/server";

const DANI_PROFILE_ID = "37ea9d81-93fb-4ba7-bb95-4405fcd78549";

// תואם למגבלה הזמנית ב-app/admin/team/page.tsx: כל עוד אלדד לא רכש, מסתירים
// גם את קישור הניווט עצמו ממנהלים שאינם דני, כדי לא להציג פינה שממילא
// תנתב אותם בחזרה.
const TEAM_NAV_RESTRICTED_TO_DANI = true;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showTeamNav =
    !TEAM_NAV_RESTRICTED_TO_DANI || user?.id === DANI_PROFILE_ID;

  const nav = [
    { href: "/admin", label: "דשבורד" },
    { href: "/admin/students", label: "תלמידים" },
    ...(showTeamNav ? [{ href: "/admin/team", label: "צוות" }] : []),
  ] as const;

  return (
    <div className="min-h-screen">
      <PresenceHeartbeat />
      <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
        <nav className="flex items-center gap-5">
          <span className="font-bold">פוטואקטיב · ניהול</span>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <NotificationsBell />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}
