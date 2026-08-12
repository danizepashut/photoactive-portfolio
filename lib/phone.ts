// נרמול מספרי טלפון לפורמט בינלאומי (E.164), עם ברירת מחדל ישראלית
// למספרים מקומיים (05X-XXXXXXX -> +9725XXXXXXXX).
export function normalizePhone(raw: string): string | null {
  const digits = raw.trim().replace(/[\s()-]/g, "");

  if (/^\+\d{8,15}$/.test(digits)) return digits;
  if (/^0\d{8,9}$/.test(digits)) return `+972${digits.slice(1)}`;
  if (/^972\d{8,9}$/.test(digits)) return `+${digits}`;

  return null;
}
