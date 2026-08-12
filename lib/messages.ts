// פוטואקטיב, תוכן ההודעות האוטומטיות (וואטסאפ + מייל).
//
// טיוטה, לא נוסח סופי — כל הנוסחים כאן מבוססים מילה במילה על הנספח
// במסמך הספק (מנוע_תיקי_עבודות_פוטואקטיב_v2.md, סעיף 10), שמוגדר שם
// במפורש כ"טיוטה ראשונית, לצורך המשך עבודה, לא נוסח סופי". טעון עריכה
// ואישור סופי של אלדד לפני שליחה בפועל.
//
// כל פונקציה מחזירה מחרוזת אחת, מוכנה לשימוש גם כטקסט הודעת וואטסאפ
// וגם כגוף מייל (בלי HTML) — פשוט כדי שיהיה קל להחליף ניסוח מאוחר יותר
// בלי לגעת בקוד ששולח את ההודעות.

export function inviteMessage(studentName: string, link: string): string {
  return `היי ${studentName},
תיק העבודות האישי שלך נפתח ומחכה לחומרים שלך.
זה הקישור למילוי הפרטים והעלאת התמונות,
${link}
יש לך שבעה ימים למלא, זה לוקח כמה דקות.`;
}

export function reminder1Message(studentName: string, link: string): string {
  return `היי ${studentName},
עדיין לא מילאת את הפרטים לתיק העבודות שלך.
הקישור עדיין פעיל,
${link}
נשארו לך רק שישה ימים.`;
}

export function reminder2Message(studentName: string, link: string): string {
  return `היי ${studentName},
נשארו ארבעה ימים
למלא את תיק העבודות שלך,
לפני שהחלון נסגר.
זה הקישור,
${link}`;
}

export function finalReminderMessage(
  studentName: string,
  link: string,
): string {
  return `היי ${studentName},
מחר בשעה הזו נסגר החלון להגשת תיק העבודות שלך.
אם לא תמלא עד אז,
התיק לא ייכנס לקטלוג של הקורס.
הקישור,
${link}`;
}

export function adminReviewReadyMessage(
  studentFullName: string,
  panelLink: string,
): string {
  return `תיק העבודות של ${studentFullName}
מוכן לבדיקה ואישור.
${panelLink}`;
}

export function publishedMessage(link: string): string {
  return `התיק שלך פורסם.
זה הקישור האישי שלך,
${link}`;
}

// לא היה בנספח המקורי — נוסף בשלב שש כי בשלב חמש נבנתה תכונת בקשת ההארכה
// (ראו request_extension / admin_approve_extension), וזו הודעה טבעית
// שנדרשת בשבילה. גם זה טעון אישור אלדד, באותה מידה כמו כל השאר.
export function extensionApprovedMessage(
  studentName: string,
  link: string,
): string {
  return `היי ${studentName},
הבקשה שלך אושרה.
יש לך עוד שבעה ימים למלא את תיק העבודות שלך.
${link}`;
}
