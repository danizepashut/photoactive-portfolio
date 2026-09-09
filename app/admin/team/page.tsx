import { redirect } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { InviteAdminForm } from "@/app/admin/team/invite-admin-form";
import { RemoveAdminButton } from "@/app/admin/team/remove-admin-button";
import { EditableAdminName } from "@/app/admin/team/editable-admin-name";
import { FreezeAdminButton } from "@/app/admin/team/freeze-admin-button";

const ONLINE_WINDOW_MS = 60_000;
const DANI_PROFILE_ID = "37ea9d81-93fb-4ba7-bb95-4405fcd78549";

// מגבלה זמנית (2026-09): כל עוד אלדד לא סגר רכישה, מסך "צוות" כולו נגיש
// לדני בלבד - לא רק הפעולות (ראה actions.ts), אלא הדף עצמו. מנהלים אחרים
// (כרגע מיכאל) מנותבים חזרה לדשבורד. להסיר כשדני יאשר שאלדד רכש.
const TEAM_PAGE_RESTRICTED_TO_DANI = true;

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (TEAM_PAGE_RESTRICTED_TO_DANI && currentUser?.id !== DANI_PROFILE_ID) {
    redirect("/admin");
  }

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, last_seen_at, created_at, frozen_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  const service = createServiceRoleClient();
  const withDetails = await Promise.all(
    (admins ?? []).map(async (a) => {
      const { data } = await service.auth.admin.getUserById(a.id);
      return {
        ...a,
        email: data.user?.email ?? "—",
        lastSignInAt: data.user?.last_sign_in_at ?? null,
      };
    }),
  );

  const now = Date.now();

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">צוות</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">הזמנת מנהל חדש</h2>
        <InviteAdminForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">מנהלים ({withDetails.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-right text-neutral-600">
              <tr>
                <th className="px-3 py-2">שם</th>
                <th className="px-3 py-2">אימייל</th>
                <th className="px-3 py-2">סטטוס הצטרפות</th>
                <th className="px-3 py-2">מחובר עכשיו</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {withDetails.map((a) => {
                const isOnline =
                  !!a.last_seen_at &&
                  now - new Date(a.last_seen_at).getTime() < ONLINE_WINDOW_MS;
                const isFrozen = !!a.frozen_at;
                return (
                  <tr
                    key={a.id}
                    className={`border-t border-neutral-200 ${
                      isFrozen ? "bg-neutral-50 text-neutral-400" : ""
                    }`}
                  >
                    <td className="px-3 py-2">
                      <EditableAdminName
                        profileId={a.id}
                        initialName={a.full_name}
                        canEdit={currentUser?.id === DANI_PROFILE_ID}
                      />
                      {a.id === currentUser?.id && (
                        <span className="mr-2 text-xs text-neutral-400">
                          (אתה)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">{a.email}</td>
                    <td className="px-3 py-2">
                      <span className="flex flex-wrap items-center gap-1.5">
                        {a.lastSignInAt ? (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                            התחבר
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            ממתין להצטרפות
                          </span>
                        )}
                        {isFrozen && (
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
                            מוקפא
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isOnline ? "bg-green-500" : "bg-neutral-300"
                          }`}
                        />
                        <span className="text-xs text-neutral-500">
                          {isOnline ? "מחובר" : "לא מחובר"}
                        </span>
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {a.id !== currentUser?.id && (
                        <div className="flex items-center gap-3">
                          <FreezeAdminButton profileId={a.id} isFrozen={isFrozen} />
                          <RemoveAdminButton profileId={a.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
