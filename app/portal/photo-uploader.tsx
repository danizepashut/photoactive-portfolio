"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  MAX_PHOTOS,
  MIN_PHOTOS,
  validatePhotoFile,
  sanitizeFilename,
} from "@/lib/photo-upload";

export type PhotoItem = {
  id: string;
  storagePath: string;
  title: string;
  previewUrl: string | null;
  uploading?: boolean;
};

const BUCKET = "portfolio-photos";

export function PhotoUploader({
  studentId,
  initialPhotos,
  onChange,
}: {
  studentId: string;
  initialPhotos: { id: string; storage_path: string; title: string | null }[];
  onChange?: (photos: PhotoItem[]) => void;
}) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPreviews() {
      const supabase = createClient();
      const withUrls = await Promise.all(
        initialPhotos.map(async (p) => {
          const { data } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(p.storage_path, 3600);
          return {
            id: p.id,
            storagePath: p.storage_path,
            title: p.title ?? "",
            previewUrl: data?.signedUrl ?? null,
          };
        }),
      );
      setPhotos(withUrls);
    }
    loadPreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange?.(photos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    const newErrors: string[] = [];
    const accepted: File[] = [];

    for (const file of files) {
      const err = validatePhotoFile(file);
      if (err) {
        newErrors.push(err);
        continue;
      }
      accepted.push(file);
    }

    if (accepted.length > remaining) {
      newErrors.push(
        `אפשר להעלות עד ${MAX_PHOTOS} תמונות בסך הכל. הועלו רק ${Math.max(remaining, 0)} מהקבצים שנבחרו.`,
      );
    }

    setErrors(newErrors);
    const toUpload = accepted.slice(0, Math.max(remaining, 0));

    for (const file of toUpload) {
      const localId = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setPhotos((prev) => [
        ...prev,
        { id: localId, storagePath: "", title: "", previewUrl, uploading: true },
      ]);

      const supabase = createClient();
      const path = `${studentId}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) {
        setPhotos((prev) => prev.filter((p) => p.id !== localId));
        setErrors((prev) => [...prev, `${file.name}: ההעלאה נכשלה.`]);
        continue;
      }

      const { data: row, error: insertError } = await supabase
        .from("photos")
        .insert({ student_id: studentId, storage_path: path })
        .select()
        .single();

      if (insertError || !row) {
        await supabase.storage.from(BUCKET).remove([path]);
        setPhotos((prev) => prev.filter((p) => p.id !== localId));
        setErrors((prev) => [...prev, `${file.name}: יצירת הרשומה נכשלה.`]);
        continue;
      }

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === localId
            ? { id: row.id, storagePath: path, title: "", previewUrl, uploading: false }
            : p,
        ),
      );
    }
  }

  async function handleTitleBlur(photoId: string, title: string) {
    const supabase = createClient();
    await supabase.from("photos").update({ title }).eq("id", photoId);
  }

  async function handleDelete(photo: PhotoItem) {
    const supabase = createClient();
    await supabase.from("photos").delete().eq("id", photo.id);
    if (photo.storagePath) {
      await supabase.storage.from(BUCKET).remove([photo.storagePath]);
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }

  const count = photos.length;
  const counterLabel =
    count < MIN_PHOTOS
      ? `${count} מתוך ${MIN_PHOTOS} לפחות`
      : `${count} מתוך ${MAX_PHOTOS} לכל היותר`;
  const counterColor = count < MIN_PHOTOS ? "text-amber-600" : "text-green-700";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className={`text-sm font-medium ${counterColor}`}>
          {counterLabel}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFilesSelected}
          disabled={count >= MAX_PHOTOS}
          className="text-sm"
        />
      </div>

      {errors.map((err, i) => (
        <p key={i} className="text-xs text-red-600">
          {err}
        </p>
      ))}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="flex flex-col gap-1 rounded-lg border border-neutral-200 p-2"
          >
            <div className="aspect-square overflow-hidden rounded bg-neutral-100">
              {photo.previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.previewUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <input
              type="text"
              placeholder="שם העבודה"
              defaultValue={photo.title}
              disabled={photo.uploading}
              onBlur={(e) => handleTitleBlur(photo.id, e.target.value)}
              className="rounded border border-neutral-300 px-2 py-1 text-xs"
            />
            <button
              type="button"
              onClick={() => handleDelete(photo)}
              disabled={photo.uploading}
              className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {photo.uploading ? "מעלה…" : "מחיקה"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
