-- פוטואקטיב, מעברי סטטוס אוטומטיים (שלב שש)
-- שתי פונקציות "מערכת", לא קשורות לשום auth.uid() ספציפי: מיועדות לקריאה
-- יומית ע"י פונקציית Netlify מתוזמנת, עם ה-service role key. במכוון לא
-- מוענק execute ל-anon/authenticated — service_role מקבל execute על הכל
-- ב-schema הזה כברירת מחדל בסופאבייס, בלי GRANT מפורש.

create or replace function public.cron_expire_not_submitted()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform set_config('app.bypass_self_edit_guard', 'true', true);

  with updated as (
    update public.students
    set status = 'not_submitted'
    where status = 'pending_submission'
      and submission_deadline is not null
      and submission_deadline < now()
    returning id
  )
  select count(*) into v_count from updated;

  return v_count;
end;
$$;

revoke all on function public.cron_expire_not_submitted() from public;

create or replace function public.cron_expire_published_portfolios()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform set_config('app.bypass_self_edit_guard', 'true', true);

  with updated as (
    update public.students
    set status = 'expired'
    where status = 'published'
      and published_at is not null
      and published_at < now() - interval '2 years'
    returning id
  )
  select count(*) into v_count from updated;

  return v_count;
end;
$$;

revoke all on function public.cron_expire_published_portfolios() from public;
