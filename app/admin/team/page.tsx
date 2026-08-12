import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { InviteAdminForm } from "@/app/admin/team/invite-admin-form";
import { RemoveAdminButton } from "@/app/admin/team/remove-admin-button";

export default async function TeamPage() {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("role", "admin")
    .order("created_at", { ascending: true });

  const service = createServiceRoleClient();
  const withEmails = await Promise.all(
    (admins ?? []).map(async (a) => {
      const { data } = await service.auth.admin.getUserById(a.id);
      return { ...a, email: data.user?.email ?? "—" };
    }),
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-bold">צוות</h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">הזמנת מנהל חדש</h2>
        <InviteAdminForm />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">מנהלים ({withEmails.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-right">
              <tr>
                <th className="px-3 py-2">אימייל</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {withEmails.map((a) => (
                <tr key={a.id} className="border-t border-neutral-200">
                  <td className="px-3 py-2">
                    {a.email}
                    {a.id === currentUser?.id && (
                      <span className="mr-2 text-xs text-neutral-400">
                        (אתה)
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <RemoveAdminButton profileId={a.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
