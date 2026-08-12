export const MAX_PHOTOS = 20;
export const MIN_PHOTOS = 6;
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function validatePhotoFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return `${file.name}: פורמט לא נתמך. יש להעלות JPEG, PNG או WEBP.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: הקובץ גדול מדי (מקסימום 25MB).`;
  }
  return null;
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}
