-- הקפאת מנהל: מאפשר לחסום התחברות זמנית בלי למחוק את החשבון (כדי לא להקים
-- מחדש כשמישהו עוזב זמנית/מושעה). frozen_at כאן הוא רק לתצוגה בטבלת הצוות -
-- החסימה האמיתית של ההתחברות נעשית בקוד דרך
-- service.auth.admin.updateUserById(id, { ban_duration }) על משתמש ה-auth
-- עצמו (מנגנון ה-ban המובנה של Supabase), לא דרך RLS/עמודה כאן.

alter table public.profiles
  add column if not exists frozen_at timestamptz;
