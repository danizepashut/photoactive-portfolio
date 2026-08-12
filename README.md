# פוטואקטיב, מנוע תיקי עבודות

Next.js + Supabase. ראו את `מנוע_תיקי_עבודות_פוטואקטיב_v2.md` למסמך הספק המלא.

## מצב נוכחי

שלבים אחת עד חמש: סכימת נתונים ו-RLS, מנגנון הרשמה/התחברות מבוסס הזמנה,
פאנל ניהול (פתיחת מחזורים, ייבוא אקסל/CSV, ניהול צוות), טופס הקליטה של
התלמיד (שדות טקסט כולל "שלושה דברים שמאפיינים את הצילום שלי", העלאת 6-20
תמונות, שליחה סופית), מסך העריכה/אישור של אלדד (`/admin/students/[id]`:
עריכת טקסטים, בחירת תמונות עם קאונטר 6-20, סידור בגרירה/כפתורים, פרסום —
כולל חזרה לעריכה ופרסום מחדש אחרי שכבר פורסם), ועמוד תיק העבודות הציבורי
(`/p/[id]`: עיצוב "יריעת מגע", גוון אישי לכל תלמיד מתוך 18 שילובים קבועים
ב-`lib/student-colors.ts`, toggle רצף/גריד, lightbox, אנימציית "פיתוח"
בגלילה, מונה צפיות, מסך פג תוקף נפרד). כולל גם בקשת הארכה לתלמיד שפספס
את חלון ההגשה (סטטוס `not_submitted`): מקסימום שתי בקשות, אישור מנהל
מפורש דרך `/admin/students/[id]`.

**שלב שש (בתהליך):** שני ה-cron של מעברי סטטוס אוטומטיים בנויים, נבדקו,
ורצים כל יום בפועל דרך פונקציית Netlify מתוזמנת
(`netlify/functions/daily-status-check.mts`) — `pending_submission`→
`not_submitted` כשחלון 7 הימים חולף, ו-`published`→`expired` שנתיים אחרי
הפרסום. נוסח ההודעות (וואטסאפ+מייל) כתוב כטיוטה ב-`lib/messages.ts`,
מבוסס מילה במילה על הנספח במסמך המקורי. **עדיין חסר**: חיבור בפועל של
שליחת התזכורות/ההודעות — תלוי בבחירת ערוץ מייל (שרת הדומיין מול ה-CRM)
ובאישורי Meta Cloud API (WhatsApp), ששניהם עדיין בתוכנית ולא חוברו.

**פריסה:** הפרויקט חי ב-GitHub (`danizepashut/photoactive-portfolio`)
ונפרס אוטומטית לנטליפיי בכל push ל-`main`.

## הרצה מקומית

```bash
npm install
cp .env.local.example .env.local   # למלא את המפתחות, ראו למטה
npm run dev
```

## חיבור לפרויקט Supabase

1. ליצור פרויקט חדש ב-Supabase (תוכנית בתשלום, לא Free — כדי שהפרויקט לא
   יושהה אוטומטית בחוסר פעילות).
2. להריץ את המיגרציה שב-`supabase/migrations/` על הפרויקט (דרך
   Supabase CLI: `supabase link` ואז `supabase db push`, או להדביק את תוכן
   הקובץ ב-SQL Editor בדשבורד).
3. למלא ב-`.env.local` את `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   ו-`SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API. אפשר גם המפתחות
   מהדור החדש, `sb_publishable_...` / `sb_secret_...` — עובדים באותה צורה).
4. **Authentication → Sign In / Providers → Email → לכבות את "Confirm email".**
   בפרויקט חדש זה דלוק כברירת מחדל, ואז ההרשמה לא נותנת session מיידי אלא
   מחכה לאישור במייל — שובר את זרימת ההזמנה. חובה לכבות.
5. להפעיל את ספק ההתחברות של Google תחת אותו עמוד (Third-Party Auth), עם
   Client ID/Secret מ-Google Cloud Console, ולהוסיף את כתובת ה-callback
   (`https://<project>.supabase.co/auth/v1/callback`) שם וגם ב-Google Cloud.

## יצירת המנהל הראשון

המנהל הראשון הוא דני (danizepashut@gmail.com), לא אלדד. מנהלים נוספים
(כולל אלדד) מוזמנים אחר כך דרך `/admin/team` בתוך האפליקציה עצמה. ליצירת
המנהל הראשון, לפני שיש בכלל מנהל שיכול להזמין דרך הממשק, ידנית פעם אחת:

1. Authentication → Users → Add user, ליצור משתמש עם danizepashut@gmail.com.
2. ב-SQL Editor להריץ (עם ה-UID של המשתמש שנוצר):
   ```sql
   insert into public.profiles (id, role) values ('<uid>', 'admin');
   ```
3. מהרגע הזה אפשר להתחבר עם המשתמש הזה דרך `/login` ולהגיע ל-`/admin`,
   ומשם להזמין את אלדד ואחרים דרך `/admin/team`.

## מבנה טכני

- `supabase/migrations/` — סכימת הנתונים, RLS, טריגרים, ה-RPCs של מנגנון ההזמנה.
- `lib/supabase/` — clients (browser/server/service-role) וטיפוסי TypeScript
  של מסד הנתונים.
- `middleware` (`proxy.ts`) — מפנה לפי תפקיד (`admin`/`student`) ומגן על
  `/admin/*` ו-`/portal/*`.
- `app/invite/[token]/` — עמוד מימוש הזמנה חד-פעמית ויצירת חשבון.
- `app/login/`, `app/auth/callback/` — התחברות משותפת (אימייל/סיסמה + גוגל).
