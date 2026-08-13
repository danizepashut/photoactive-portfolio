"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ContactConsentCheckbox({
  studentId,
  initialValue,
}: {
  studentId: string;
  initialValue: boolean;
}) {
  const [checked, setChecked] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: boolean) {
    setChecked(next);
    setSaving(true);
    const supabase = createClient();
    await supabase
      .from("students")
      .update({ show_contact_info: next })
      .eq("id", studentId);
    setSaving(false);
  }

  return (
    <label className="flex items-start gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => handleChange(e.target.checked)}
        className="mt-0.5"
      />
      <span>
        אני מסכים/ה שפרטי יצירת הקשר שלי (שם, טלפון, מייל) יוצגו בכרטיס
        הציבורי שלי. אפשר לבטל את הסימון כדי להסתיר אותם.{" "}
        <span className="text-neutral-500">
          לתשומת לבך: אחרי שליחת התיק לא ניתן לשנות את הבחירה הזו.
        </span>
        {saving && <span className="text-xs text-neutral-400"> שומר…</span>}
      </span>
    </label>
  );
}
