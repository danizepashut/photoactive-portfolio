"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="w-fit text-sm text-neutral-600 hover:text-neutral-900"
    >
      ← חזרה
    </button>
  );
}
