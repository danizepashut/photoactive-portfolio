"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { validatePhotoFile, sanitizeFilename } from "@/lib/photo-upload";

const BUCKET = "portfolio-photos";

export function ProfilePhotoField({
  studentId,
  initialPath,
}: {
  studentId: string;
  initialPath: string | null;
}) {
  const [path, setPath] = useState<string | null>(initialPath);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPreview() {
      if (!path) {
        setPreviewUrl(null);
        return;
      }
      const supabase = createClient();
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(path, 3600);
      if (!cancelled) setPreviewUrl(data?.signedUrl ?? null);
    }
    loadPreview();
    return () => {
      cancelled = true;
    };
  }, [path]);

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    const validationError = validatePhotoFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setUploading(true);

    const supabase = createClient();
    const previousPath = path;
    const newPath = `${studentId}/profile-${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(newPath, file);
    if (uploadError) {
      setError("ההעלאה נכשלה.");
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("students")
      .update({ profile_photo_path: newPath })
      .eq("id", studentId);

    if (updateError) {
      await supabase.storage.from(BUCKET).remove([newPath]);
      setError("שמירת התמונה נכשלה.");
      setUploading(false);
      return;
    }

    if (previousPath) {
      await supabase.storage.from(BUCKET).remove([previousPath]);
    }

    setPath(newPath);
    setUploading(false);
  }

  async function handleRemove() {
    if (!path) return;
    const supabase = createClient();
    const removedPath = path;
    const { error: updateError } = await supabase
      .from("students")
      .update({ profile_photo_path: null })
      .eq("id", studentId);

    if (updateError) {
      setError("ההסרה נכשלה.");
      return;
    }
    await supabase.storage.from(BUCKET).remove([removedPath]);
    setPath(null);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">תמונת פרופיל</span>
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-neutral-100">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-col gap-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelected}
            disabled={uploading}
            className="text-sm"
          />
          {path && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="w-fit text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              הסרת תמונה
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
