-- פוטואקטיב, תיקון: מדיניות students_update_own מ-20260811000000 הרשתה לתלמיד
-- לערוך את שדות הטקסט שלו (bio/quote/וכו') גם אחרי שהגיש (status != 'pending_submission').
-- ה-trigger enforce_student_self_edit מגביל אילו *עמודות* מותר לשנות, אבל לא בדק
-- באיזה סטטוס. התגלה בבדיקה חיה: תלמיד הצליח לערוך bio אחרי סטטוס pending_review.
-- "ההגשה חד פעמית ואינה ניתנת לעריכה נוספת לאחר אישור" (סעיף 4 במסמך).

drop policy if exists "students_update_own" on public.students;

create policy "students_update_own" on public.students
  for update to authenticated
  using (profile_id = auth.uid() and status = 'pending_submission')
  with check (profile_id = auth.uid() and status = 'pending_submission');
