"use client";

import { useState } from "react";
import { PhotoReviewGrid } from "@/app/admin/students/[id]/photo-review-grid";
import { PublishButton } from "@/app/admin/students/[id]/publish-button";

export function ReviewPanel({
  studentId,
  initialPhotos,
  alreadyPublished,
}: {
  studentId: string;
  initialPhotos: {
    id: string;
    storage_path: string;
    title: string | null;
    is_selected: boolean;
    display_order: number | null;
  }[];
  alreadyPublished: boolean;
}) {
  const [selectedCount, setSelectedCount] = useState(
    initialPhotos.filter((p) => p.is_selected).length,
  );

  return (
    <div className="flex flex-col gap-6">
      <PhotoReviewGrid
        initialPhotos={initialPhotos}
        onSelectedCountChange={setSelectedCount}
      />
      <PublishButton
        studentId={studentId}
        selectedCount={selectedCount}
        alreadyPublished={alreadyPublished}
      />
    </div>
  );
}
