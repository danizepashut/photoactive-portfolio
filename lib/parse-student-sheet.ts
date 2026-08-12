import * as XLSX from "xlsx";
import type { ImportRow } from "@/app/admin/cohorts/[id]/actions";

const NAME_HEADERS = ["שם", "שם מלא", "name", "full_name", "full name"];
const EMAIL_HEADERS = ["מייל", "אימייל", "email", "e-mail"];
const PHONE_HEADERS = ["טלפון", "נייד", "phone", "mobile", "phone number"];

function findColumn(headers: string[], candidates: string[]): number {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  return normalized.findIndex((h) => candidates.includes(h));
}

export async function parseStudentSheet(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: string[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    blankrows: false,
  });

  if (rows.length === 0) return [];

  const [header, ...body] = rows;
  const nameCol = findColumn(header, NAME_HEADERS);
  const emailCol = findColumn(header, EMAIL_HEADERS);
  const phoneCol = findColumn(header, PHONE_HEADERS);

  if (nameCol === -1 || emailCol === -1 || phoneCol === -1) {
    throw new Error(
      "לא זוהו עמודות שם/אימייל/טלפון. ודא שיש כותרות עמודה בשורה הראשונה.",
    );
  }

  return body
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => ({
      full_name: String(row[nameCol] ?? "").trim(),
      email: String(row[emailCol] ?? "").trim(),
      phone: String(row[phoneCol] ?? "").trim(),
    }));
}
