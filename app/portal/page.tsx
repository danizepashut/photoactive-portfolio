import { createClient } from "@/lib/supabase/server";
import { IntakeForm } from "@/app/portal/intake-form";
import { RequestExtensionButton } from "@/app/portal/request-extension-button";
import type { StudentStatus } from "@/lib/supabase/types";

const STATUS_PRIORITY: StudentStatus[] = [
  "pending_submission",
  "not_submitted",
  "pending_review",
  "published",
  "expired",
];

export default async function StudentPortalPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: records } = await supabase
    .from("students")
    .select("*")
    .eq("profile_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const student =
    STATUS_PRIORITY.map((status) =>
      records?.find((r) => r.status === status),
    ).find(Boolean) ?? null;

  if (!student) {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">האזור האישי שלך</h1>
        <p className="text-sm text-neutral-600">
          לא נמצאה רשומת תיק עבודות עבור החשבון הזה.
        </p>
      </div>
    );
  }

  if (student.status === "pending_submission") {
    const { data: photos } = await supabase
      .from("photos")
      .select("id, storage_path, title")
      .eq("student_id", student.id)
      .order("created_at", { ascending: true });

    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">מילוי תיק העבודות</h1>
        <p className="mb-4 text-sm text-neutral-600">
          שדות הטקסט נשמרים אוטומטית. אפשר להעלות בין שש לעשרים תמונות.
        </p>
        <IntakeForm
          studentId={student.id}
          initialValues={{
            display_name: student.display_name,
            bio: student.bio,
            quote: student.quote,
            work_description: student.work_description,
            personal_note: student.personal_note,
            trait_1: student.trait_1,
            trait_2: student.trait_2,
            trait_3: student.trait_3,
            website_url: student.website_url,
          }}
          initialPhotos={photos ?? []}
          initialProfilePhotoPath={student.profile_photo_path}
          initialBirthYear={student.birth_year}
          initialShowContactInfo={student.show_contact_info}
        />
      </div>
    );
  }

  if (student.status === "not_submitted") {
    const isPending =
      !!student.extension_requested_at &&
      (!student.extension_approved_at ||
        student.extension_approved_at < student.extension_requested_at);

    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold">חלון ההגשה נסגר</h1>
        <p className="text-sm text-neutral-600">
          לא הגשת בזמן והחלון להגשת תיק העבודות נסגר.
        </p>
        {student.extension_request_count >= 2 ? (
          <p className="text-sm text-neutral-600">
            הגישה שלך נסגרה. אנא פנה לצוות פוטואקטיב.
          </p>
        ) : isPending ? (
          <p className="text-sm text-neutral-600">
            הבקשה שלך ממתינה לאישור הצוות.
          </p>
        ) : (
          <RequestExtensionButton />
        )}
      </div>
    );
  }

  if (student.status === "pending_review") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">התיק שלך נשלח לבדיקה</h1>
        <p className="text-sm text-neutral-600">
          אלדד עובר על התמונות שלך ובוחר את הסדר הסופי. נעדכן אותך כשהתיק
          יפורסם.
        </p>
      </div>
    );
  }

  if (student.status === "published") {
    return (
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">התיק שלך פורסם 🎉</h1>
        <p className="text-sm text-neutral-600">
          זה הקישור האישי שלך, אפשר לשתף אותו עם מי שרוצים:
        </p>
        <a
          href={`/p/${student.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          לצפייה בתיק שלך
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold">התיק פג תוקף</h1>
      <p className="text-sm text-neutral-600">
        התיק שלך פורסם ופג תוקפו. פנה לצוות פוטואקטיב לפרטים.
      </p>
    </div>
  );
}
