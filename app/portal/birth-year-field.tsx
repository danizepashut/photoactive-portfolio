"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const SAVE_DELAY_MS = 800;
const CURRENT_YEAR = new Date().getFullYear();

export function BirthYearField({
  studentId,
  initialValue,
}: {
  studentId: string;
  initialValue: number | null;
}) {
  const [value, setValue] = useState(
    initialValue ? String(initialValue) : "",
  );
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function save(raw: string) {
    const supabase = createClient();

    if (raw.trim() === "") {
      setError(null);
      const { error: updateError } = await supabase
        .from("students")
        .update({ birth_year: null })
        .eq("id", studentId);
      if (!updateError) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
      return;
    }

    const year = Number(raw);
    if (!Number.isInteger(year) || year < 1900 || year > CURRENT_YEAR) {
      setError(`יש להזין שנה בין 1900 ל-${CURRENT_YEAR}.`);
      return;
    }
    setError(null);

    const { error: updateError } = await supabase
      .from("students")
      .update({ birth_year: year })
      .eq("id", studentId);

    if (!updateError) {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }

  function handleChange(raw: string) {
    setValue(raw);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(raw), SAVE_DELAY_MS);
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-center gap-2">
        שנת לידה
        {saved && <span className="text-xs text-green-600">נשמר</span>}
      </span>
      <input
        type="number"
        inputMode="numeric"
        min={1900}
        max={CURRENT_YEAR}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="w-32 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </label>
  );
}
