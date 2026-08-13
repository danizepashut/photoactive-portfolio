"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type TextField =
  | "display_name"
  | "bio"
  | "quote"
  | "work_description"
  | "personal_note"
  | "website_url"
  | "trait_1"
  | "trait_2"
  | "trait_3";

const FIELDS: { key: TextField; label: string; multiline?: boolean }[] = [
  { key: "display_name", label: "שם" },
  { key: "bio", label: "ביו" },
  { key: "quote", label: "ציטוט על הקורס", multiline: true },
  { key: "work_description", label: "הסבר קצר על העבודות", multiline: true },
  { key: "personal_note", label: "טקסט נעים להכיר", multiline: true },
  { key: "website_url", label: "קישור לאתר אישי (אופציונלי)" },
];

const TRAIT_FIELDS: { key: TextField; label: string }[] = [
  { key: "trait_1", label: "דבר ראשון" },
  { key: "trait_2", label: "דבר שני" },
  { key: "trait_3", label: "דבר שלישי" },
];

const ALL_FIELDS = [...FIELDS, ...TRAIT_FIELDS];
const SAVE_DELAY_MS = 800;

export function TextFieldsForm({
  studentId,
  initialValues,
  onChange,
}: {
  studentId: string;
  initialValues: Record<TextField, string | null>;
  onChange?: (values: Record<TextField, string>) => void;
}) {
  const [values, setValues] = useState<Record<TextField, string>>(
    Object.fromEntries(
      ALL_FIELDS.map((f) => [f.key, initialValues[f.key] ?? ""]),
    ) as Record<TextField, string>,
  );
  const [savedAt, setSavedAt] = useState<Record<string, boolean>>({});
  const timers = useRef<Partial<Record<TextField, ReturnType<typeof setTimeout>>>>(
    {},
  );

  useEffect(() => {
    onChange?.(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  useEffect(() => {
    const currentTimers = timers.current;
    return () => {
      Object.values(currentTimers).forEach((t) => t && clearTimeout(t));
    };
  }, []);

  async function saveField(field: TextField, value: string) {
    const supabase = createClient();
    const update: Partial<Record<TextField, string>> = {};
    update[field] = value;
    const { error } = await supabase
      .from("students")
      .update(update)
      .eq("id", studentId);

    if (!error) {
      setSavedAt((prev) => ({ ...prev, [field]: true }));
      setTimeout(
        () => setSavedAt((prev) => ({ ...prev, [field]: false })),
        1500,
      );
    }
  }

  function handleFieldChange(field: TextField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));

    const existing = timers.current[field];
    if (existing) clearTimeout(existing);
    timers.current[field] = setTimeout(() => {
      saveField(field, value);
    }, SAVE_DELAY_MS);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-2">
              {field.label}
              {savedAt[field.key] && (
                <span className="text-xs text-green-600">נשמר</span>
              )}
            </span>
            {field.multiline ? (
              <textarea
                rows={3}
                value={values[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            ) : (
              <input
                type="text"
                value={values[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            )}
          </label>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">
          שלושה דברים שמאפיינים את הצילום שלך
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {TRAIT_FIELDS.map((field) => (
            <label key={field.key} className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-2 text-xs text-neutral-500">
                {field.label}
                {savedAt[field.key] && (
                  <span className="text-green-600">נשמר</span>
                )}
              </span>
              <input
                type="text"
                maxLength={40}
                value={values[field.key]}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { TextField };
