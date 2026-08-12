-- פוטואקטיב, פאנל הניהול (שלב שתיים)
-- מונה צפיות (מוכן לשלב חמש), ופונקציות admin-only ליצירת תלמיד ושליחת
-- הזמנה מחדש.

alter table public.students
  add column if not exists view_count integer not null default 0;

create or replace function public.admin_create_student(
  p_cohort_id uuid,
  p_full_name text,
  p_email text,
  p_phone text
)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.students;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  insert into public.students (
    cohort_id, full_name, email, phone, invite_sent_at, submission_deadline
  )
  values (
    p_cohort_id, p_full_name, p_email, p_phone, now(), now() + interval '7 days'
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.admin_create_student(uuid, text, text, text) from public;
grant execute on function public.admin_create_student(uuid, text, text, text) to authenticated;

create or replace function public.admin_resend_invite(p_student_id uuid)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.students;
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  update public.students
  set invite_token = gen_random_uuid(),
      invite_token_used = false,
      invite_sent_at = now(),
      submission_deadline = now() + interval '7 days'
  where id = p_student_id
    and status = 'pending_submission'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'student_not_found_or_not_pending';
  end if;

  return v_row;
end;
$$;

revoke all on function public.admin_resend_invite(uuid) from public;
grant execute on function public.admin_resend_invite(uuid) to authenticated;
