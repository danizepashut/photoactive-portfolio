-- פוטואקטיב, בקשת הארכה לתלמיד שפספס את חלון ההגשה (סעיף 9 בביקורת המקורית)
-- מקסימום שתי בקשות. תלמיד מבקש, מנהל מאשר במפורש (לא אוטומטי) ומחזיר
-- אותו ל-pending_submission עם דדליין חדש של 7 ימים. אחרי שתי בקשות
-- ממוצות, אין יותר כפתור בקשה — רק הודעה קבועה.
--
-- הערה: המעבר האוטומטי ל-not_submitted אחרי שחלון ה-7 ימים חולף עדיין לא
-- קיים (זה ה-cron של שלב שש). התכונה כאן מוכנה ונבדקת, אבל בפועל תלמיד לא
-- יגיע ל-not_submitted עד שהאוטומציה של שלב שש תרוץ.

alter table public.students
  add column if not exists extension_request_count int not null default 0;

create or replace function public.request_extension()
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_student public.students;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_student
  from public.students
  where profile_id = v_uid
    and status = 'not_submitted'
  for update;

  if v_student.id is null then
    raise exception 'no_not_submitted_record_found';
  end if;

  if v_student.extension_request_count >= 2 then
    raise exception 'extension_limit_reached';
  end if;

  perform set_config('app.bypass_self_edit_guard', 'true', true);

  update public.students
  set extension_requested_at = now(),
      extension_request_count = extension_request_count + 1
  where id = v_student.id
  returning * into v_student;

  return v_student;
end;
$$;

revoke all on function public.request_extension() from public;
grant execute on function public.request_extension() to authenticated;

create or replace function public.admin_approve_extension(p_student_id uuid)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_student public.students;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  select * into v_student
  from public.students
  where id = p_student_id
  for update;

  if v_student.id is null then
    raise exception 'student_not_found';
  end if;

  if v_student.status <> 'not_submitted' then
    raise exception 'invalid_status_for_extension_approval';
  end if;

  update public.students
  set status = 'pending_submission',
      invite_sent_at = now(),
      submission_deadline = now() + interval '7 days',
      extension_approved_at = now(),
      extension_approved_by = v_uid
  where id = p_student_id
  returning * into v_student;

  return v_student;
end;
$$;

revoke all on function public.admin_approve_extension(uuid) from public;
grant execute on function public.admin_approve_extension(uuid) to authenticated;
