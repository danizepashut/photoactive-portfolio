"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MIN_PHOTOS, MAX_PHOTOS } from "@/lib/photo-upload";

const BUCKET = "portfolio-photos";
const PERSIST_DELAY_MS = 500;

type Photo = {
  id: string;
  storagePath: string;
  title: string;
  isSelected: boolean;
  displayOrder: number | null;
  previewUrl: string | null;
};

function renumberSelected(list: Photo[]): Photo[] {
  const selected = list
    .filter((p) => p.isSelected)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const orderMap = new Map(selected.map((p, i) => [p.id, i + 1]));
  return list.map((p) => ({
    ...p,
    displayOrder: p.isSelected ? (orderMap.get(p.id) ?? null) : null,
  }));
}

export function PhotoReviewGrid({
  initialPhotos,
  onSelectedCountChange,
}: {
  initialPhotos: {
    id: string;
    storage_path: string;
    title: string | null;
    is_selected: boolean;
    display_order: number | null;
  }[];
  onSelectedCountChange?: (count: number) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [dragId, setDragId] = useState<string | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            isSelected: p.is_selected,
            displayOrder: p.display_order,
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
    onSelectedCountChange?.(photos.filter((p) => p.isSelected).length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  // דפוס debounce, כמו בשמירת שדות הטקסט: כל שינוי (סימון/סידור) מעדכן את
  // ה-state המקומי מיידית ובאופן פונקציונלי (בטוח מול לחיצות מהירות ברצף),
  // ורק אחרי שקט קצר נכתב ה-state המלא ל-DB — כדי שכתיבות שמגיעות
  // בלי סדר מהרשת לא ידרסו זו את זו עם snapshot ישן.
  function schedulePersist(next: Photo[]) {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(async () => {
      const supabase = createClient();
      await Promise.all(
        next.map((p) =>
          supabase
            .from("photos")
            .update({
              is_selected: p.isSelected,
              display_order: p.displayOrder,
            })
            .eq("id", p.id),
        ),
      );
    }, PERSIST_DELAY_MS);
  }

  function updatePhotos(updater: (prev: Photo[]) => Photo[]) {
    setPhotos((prev) => {
      const next = updater(prev);
      schedulePersist(next);
      return next;
    });
  }

  function toggleSelected(id: string) {
    updatePhotos((prev) =>
      renumberSelected(
        prev.map((p) =>
          p.id === id ? { ...p, isSelected: !p.isSelected } : p,
        ),
      ),
    );
  }

  function moveSelected(id: string, direction: -1 | 1) {
    updatePhotos((prev) => {
      const selected = prev
        .filter((p) => p.isSelected)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      const index = selected.findIndex((p) => p.id === id);
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= selected.length) return prev;

      [selected[index], selected[targetIndex]] = [
        selected[targetIndex],
        selected[index],
      ];
      const orderMap = new Map(selected.map((p, i) => [p.id, i + 1]));
      return prev.map((p) =>
        p.isSelected ? { ...p, displayOrder: orderMap.get(p.id) ?? null } : p,
      );
    });
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) return;
    updatePhotos((prev) => {
      const selected = prev
        .filter((p) => p.isSelected)
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      const fromIndex = selected.findIndex((p) => p.id === dragId);
      const toIndex = selected.findIndex((p) => p.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return prev;

      const reordered = [...selected];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      const orderMap = new Map(reordered.map((p, i) => [p.id, i + 1]));
      return prev.map((p) =>
        p.isSelected ? { ...p, displayOrder: orderMap.get(p.id) ?? null } : p,
      );
    });
    setDragId(null);
  }

  const selectedPhotos = photos
    .filter((p) => p.isSelected)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  const selectedCount = selectedPhotos.length;
  const counterColor =
    selectedCount < MIN_PHOTOS || selectedCount > MAX_PHOTOS
      ? "text-amber-600"
      : "text-green-700";

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className={`mb-3 text-sm font-medium ${counterColor}`}>
          {selectedCount} נבחרו (נדרש {MIN_PHOTOS}–{MAX_PHOTOS})
        </p>
        {selectedCount === 0 ? (
          <p className="text-sm text-neutral-500">
            עדיין לא נבחרו תמונות לתיק הסופי.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {selectedPhotos.map((photo, i) => (
              <li
                key={photo.id}
                draggable
                onDragStart={() => setDragId(photo.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(photo.id)}
                className="flex items-center gap-3 rounded-lg border border-neutral-300 bg-white p-2"
              >
                <span className="w-6 text-center text-sm font-bold text-neutral-500">
                  {i + 1}
                </span>
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-neutral-100">
                  {photo.previewUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.previewUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <span className="flex-1 truncate text-sm">{photo.title}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => moveSelected(photo.id, -1)}
                    disabled={i === 0}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSelected(photo.id, 1)}
                    disabled={i === selectedPhotos.length - 1}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelected(photo.id)}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs text-red-600"
                  >
                    הסרה
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">
          כל התמונות המועמדות ({photos.length})
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => (
            <label
              key={photo.id}
              className={`flex cursor-pointer flex-col gap-1 rounded-lg border p-2 ${
                photo.isSelected
                  ? "border-neutral-900"
                  : "border-neutral-200"
              }`}
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
              <span className="truncate text-xs">{photo.title}</span>
              <span className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={photo.isSelected}
                  onChange={() => toggleSelected(photo.id)}
                />
                לתיק הסופי
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
