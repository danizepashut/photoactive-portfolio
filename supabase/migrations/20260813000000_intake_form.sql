-- פוטואקטיב, טופס הקליטה (שלב שלוש)
-- שליחה סופית: מאמתת 6-20 תמונות עם שם לכולן וכל 5 שדות הטקסט מלאים,
-- ומעבירה את הסטטוס ל-pending_review. משתמשת בדגל המעקף הקיים מ-claim_invite
-- כדי לעקוף את enforce_student_self_edit לצורך שינוי הסטטוס הזה בלבד.

create or replace function public.submit_portfolio()
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_student public.students;
  v_photo_count int;
  v_untitled_count int;
begin
  select * into v_student
  from public.students
  where profile_id = v_uid
    and status = 'pending_submission'
  for update;

  if v_student.id is null then
    raise exception 'no_pending_submission_found';
  end if;

  if coalesce(trim(v_student.display_name), '') = ''
     or coalesce(trim(v_student.bio), '') = ''
     or coalesce(trim(v_student.quote), '') = ''
     or coalesce(trim(v_student.work_description), '') = ''
     or coalesce(trim(v_student.personal_note), '') = ''
  then
    raise exception 'missing_required_text_fields';
  end if;

  select count(*) into v_photo_count
  from public.photos
  where student_id = v_student.id;

  if v_photo_count < 6 then
    raise exception 'too_few_photos';
  end if;

  if v_photo_count > 20 then
    raise exception 'too_many_photos';
  end if;

  select count(*) into v_untitled_count
  from public.photos
  where student_id = v_student.id
    and coalesce(trim(title), '') = '';

  if v_untitled_count > 0 then
    raise exception 'photos_missing_titles';
  end if;

  perform set_config('app.bypass_self_edit_guard', 'true', true);

  update public.students
  set status = 'pending_review',
      submitted_at = now()
  where id = v_student.id
  returning * into v_student;

  return v_student;
end;
$$;

revoke all on function public.submit_portfolio() from public;
grant execute on function public.submit_portfolio() to authenticated;
