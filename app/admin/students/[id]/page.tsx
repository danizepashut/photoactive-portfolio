import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/student-status";
import { TextFieldsForm } from "@/app/portal/text-fields-form";
import { ReviewPanel } from "@/app/admin/students/[id]/review-panel";
import { ApproveExtensionButton } from "@/app/admin/students/[id]/approve-extension-button";

export default async function AdminStudentReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*, cohorts(name)")
    .eq("id", id)
    .single();

  if (!student) notFound();

  const { data: photos } = await supabase
    .from("photos")
    .select("id, storage_path, title, is_selected, display_order")
    .eq("student_id", id)
    .order("created_at", { ascending: true });

  const cohortName =
    (student.cohorts as unknown as { name: string } | null)?.name ?? "";

  const hasPendingExtensionRequest =
    student.status === "not_submitted" &&
    !!student.extension_requested_at &&
    (!student.extension_approved_at ||
      student.extension_approved_at < student.extension_requested_at);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{student.full_name}</h1>
        <p className="text-sm text-neutral-500">
          {cohortName} · {student.email} ·{" "}
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[student.status]}`}
          >
            {STATUS_LABELS[student.status]}
          </span>
        </p>
      </div>

      {hasPendingExtensionRequest && (
        <ApproveExtensionButton studentId={student.id} />
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">פרטי התלמיד</h2>
        <TextFieldsForm
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
          }}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">תמונות</h2>
        <ReviewPanel
          studentId={student.id}
          initialPhotos={photos ?? []}
          alreadyPublished={student.status === "published"}
        />
      </section>
    </div>
  );
}
