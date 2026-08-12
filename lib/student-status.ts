import type { StudentStatus } from "@/lib/supabase/types";

export type StatusKey = StudentStatus;

export const STATUS_LABELS: Record<StudentStatus, string> = {
  pending_submission: "ממתין להגשה",
  not_submitted: "לא הוגש",
  pending_review: "ממתין לעריכה",
  published: "פורסם",
  expired: "פג תוקף",
};

export const STATUS_COLORS: Record<StudentStatus, string> = {
  pending_submission: "bg-amber-100 text-amber-800",
  not_submitted: "bg-red-100 text-red-800",
  pending_review: "bg-blue-100 text-blue-800",
  published: "bg-green-100 text-green-800",
  expired: "bg-neutral-200 text-neutral-600",
};
