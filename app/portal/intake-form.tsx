"use client";

import { useMemo, useState } from "react";
import { TextFieldsForm, type TextField } from "@/app/portal/text-fields-form";
import { PhotoUploader, type PhotoItem } from "@/app/portal/photo-uploader";
import { SubmitSection } from "@/app/portal/submit-section";
import { MIN_PHOTOS, MAX_PHOTOS } from "@/lib/photo-upload";

export function IntakeForm({
  studentId,
  initialValues,
  initialPhotos,
}: {
  studentId: string;
  initialValues: Record<TextField, string | null>;
  initialPhotos: { id: string; storage_path: string; title: string | null }[];
}) {
  const [textValues, setTextValues] = useState<Record<
    TextField,
    string
  > | null>(null);
  const [photos, setPhotos] = useState<PhotoItem[] | null>(null);

  const ready = useMemo(() => {
    if (!textValues || !photos) return false;
    const allTextFilled = Object.values(textValues).every(
      (v) => v.trim() !== "",
    );
    const countOk = photos.length >= MIN_PHOTOS && photos.length <= MAX_PHOTOS;
    const allTitled = photos.every(
      (p) => p.title.trim() !== "" && !p.uploading,
    );
    return allTextFilled && countOk && allTitled;
  }, [textValues, photos]);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">פרטים</h2>
        <TextFieldsForm
          studentId={studentId}
          initialValues={initialValues}
          onChange={setTextValues}
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">תמונות</h2>
        <PhotoUploader
          studentId={studentId}
          initialPhotos={initialPhotos}
          onChange={setPhotos}
        />
      </section>

      <SubmitSection ready={ready} />
    </div>
  );
}
