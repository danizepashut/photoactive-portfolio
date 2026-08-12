// זהות אישית בעיצוב (סעיף 6 במסמך): 6 גוונים בסיסיים, 3 ואריאציות טונאליות
// לכל אחד. שילוב אחד מוקצה אקראית לכל תלמיד ב-trigger assign_student_color
// (ראה supabase/migrations/20260811000000_init_schema.sql), ולא חוזר בתוך
// אותו מחזור. כל 18 הערכים נגזרים ממשפחת שחור/אדום/זהב של פוטואקטיב.

export const HUE_NAMES: Record<number, string> = {
  1: "קרימזון",
  2: "ענבר",
  3: "חלודה",
  4: "יין",
  5: "נחושת",
  6: "שמפניה",
};

// [ואריאציה 1 (בהיר/רווי), ואריאציה 2 (עמוק/מושתק), ואריאציה 3 (חיוור/רך)]
export const HUE_VARIATIONS: Record<number, [string, string, string]> = {
  1: ["#C72B35", "#7A1F26", "#D98A8F"],
  2: ["#C99A3E", "#8A6423", "#E0C687"],
  3: ["#C1552A", "#7A3319", "#D99C7A"],
  4: ["#8E2A4C", "#591A30", "#C588A0"],
  5: ["#B36A3E", "#723F22", "#D9AE87"],
  6: ["#C9B074", "#8F7A48", "#E3D6AF"],
};

export function getStudentColor(hue: number, variation: number): string {
  return HUE_VARIATIONS[hue]?.[variation - 1] ?? HUE_VARIATIONS[2][0];
}
