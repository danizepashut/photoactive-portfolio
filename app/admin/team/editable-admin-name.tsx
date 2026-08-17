"use client";

import { useState, useTransition } from "react";
import { updateAdminName } from "@/app/admin/team/actions";

export function EditableAdminName({
  profileId,
  initialName,
  canEdit,
}: {
  profileId: string;
  initialName: string | null;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return <span>{initialName ?? "—"}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-right hover:underline"
        title="עריכת שם"
      >
        {initialName ?? "—"}
        <span className="mr-1.5 text-xs text-neutral-400">עריכה</span>
      </button>
    );
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateAdminName(profileId, name);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          className="w-32 rounded border border-neutral-300 px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded bg-neutral-900 px-2 py-1 text-xs text-white disabled:opacity-50"
        >
          {isPending ? "שומר…" : "שמירה"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(initialName ?? "");
            setError(null);
          }}
          className="text-xs text-neutral-500 hover:text-neutral-900"
        >
          ביטול
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
