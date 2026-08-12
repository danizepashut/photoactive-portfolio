-- פוטואקטיב, מנוע תיקי עבודות
-- מיגרציית יסוד: סכימת נתונים, הרשאות שורה (RLS) ומנגנון הזמנה/הרשמה
-- ראה: מנוע_תיקי_עבודות_פוטואקטיב_v2.md

create extension if not exists pgcrypto;

-- ==========================================================================
-- Enums
-- ==========================================================================

create type public.user_role as enum ('admin', 'student');

create type public.student_status as enum (
  'pending_submission', -- ממתין להגשה
  'not_submitted',       -- לא הוגש (סופי)
  'pending_review',      -- ממתין לעריכה (אצל אלדד)
  'published',           -- פורסם
  'expired'               -- פג תוקף
);

-- ==========================================================================
-- Tables
-- ==========================================================================

-- פרופיל אפליקטיבי אחד לכל משתמש התחברות (auth.users), נושא את התפקיד.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  full_name text,
  created_at timestamptz not null default now()
);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  opened_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- רשומת תלמיד היא per-cohort: תלמיד חוזר במחזור אחר מקבל רשומה חדשה,
-- אך יכול להתחבר עם אותו auth.users / profiles שכבר יש לו (ראה claim_invite).
create table public.students (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,

  -- מוזן על ידי המנהל בפתיחת המחזור
  full_name text not null,
  email text not null,
  phone text not null,

  -- מוזן על ידי התלמיד בטופס הקליטה
  display_name text,
  bio text,
  quote text,
  work_description text,
  personal_note text,

  status public.student_status not null default 'pending_submission',

  -- זהות עיצובית: 6 גוונים בסיסיים x 3 ואריאציות, מוקצה אקראית ב-trigger
  color_hue smallint not null check (color_hue between 1 and 6),
  color_variation smallint not null check (color_variation between 1 and 3),

  -- קישור הזמנה חד פעמי
  invite_token uuid not null default gen_random_uuid(),
  invite_token_used boolean not null default false,
  invite_sent_at timestamptz,
  submission_deadline timestamptz,

  submitted_at timestamptz,
  published_at timestamptz,

  extension_requested_at timestamptz,
  extension_approved_at timestamptz,
  extension_approved_by uuid references public.profiles (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint students_invite_token_unique unique (invite_token),
  constraint students_color_unique_per_cohort unique (cohort_id, color_hue, color_variation)
);

create index students_cohort_id_idx on public.students (cohort_id);
create index students_status_idx on public.students (status);
create index students_profile_id_idx on public.students (profile_id);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  storage_path text not null,
  title text,
  is_selected boolean not null default false,
  display_order smallint,
  created_at timestamptz not null default now()
);

create index photos_student_id_idx on public.photos (student_id);
create index photos_student_selected_idx on public.photos (student_id, is_selected);

-- ==========================================================================
-- Helper: is_admin()
-- ==========================================================================

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ==========================================================================
-- updated_at housekeeping
-- ==========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

-- ==========================================================================
-- הקצאת גוון אקראית, ללא חזרה בתוך אותו מחזור
-- ==========================================================================

create or replace function public.assign_student_color()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hue smallint;
  v_variation smallint;
begin
  if new.color_hue is not null and new.color_variation is not null then
    return new; -- דריסה ידנית מפורשת (למשל תיקון על ידי מנהל)
  end if;

  select h.hue, v.variation into v_hue, v_variation
  from generate_series(1, 6) as h(hue)
  cross join generate_series(1, 3) as v(variation)
  where not exists (
    select 1 from public.students s
    where s.cohort_id = new.cohort_id
      and s.color_hue = h.hue
      and s.color_variation = v.variation
  )
  order by random()
  limit 1;

  if v_hue is null then
    raise exception 'no_available_color_combination_in_cohort';
  end if;

  new.color_hue := v_hue;
  new.color_variation := v_variation;
  return new;
end;
$$;

create trigger trg_students_assign_color
before insert on public.students
for each row execute function public.assign_student_color();

-- ==========================================================================
-- אכיפת עריכה לפי תפקיד: תלמיד עורך רק את שדות הטקסט שלו,
-- לא סטטוס, לא גוון, לא טוקן, לא שיוך. מנהל עורך הכל.
-- (RLS קובע אילו *שורות* נגישות, ה-trigger קובע אילו *עמודות* מותר לשנות
-- כשמדובר במשתמש שאינו מנהל — הבדל שאי אפשר לבטא רק עם GRANT ברמת עמודה
-- כי גם תלמיד וגם מנהל מחוברים כאותו תפקיד authenticated ב-Postgres.)
-- ==========================================================================

create or replace function public.enforce_student_self_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- claim_invite קובע את הדגל הזה (טרנזקציה בלבד) כשהוא בעצמו, פונקציה
  -- מהימנה שלי, מקשר profile_id/invite_token_used בהצטרפות תלמיד חדש.
  -- בלי זה, ה-trigger הזה חוסם גם את claim_invite עצמו כי בזמן ההצטרפות
  -- המשתמש עדיין לא מנהל ועדיין לא בעל הרשומה.
  if public.is_admin()
     or current_setting('app.bypass_self_edit_guard', true) = 'true'
  then
    return new;
  end if;

  if new.status is distinct from old.status
     or new.cohort_id is distinct from old.cohort_id
     or new.full_name is distinct from old.full_name
     or new.email is distinct from old.email
     or new.phone is distinct from old.phone
     or new.color_hue is distinct from old.color_hue
     or new.color_variation is distinct from old.color_variation
     or new.invite_token is distinct from old.invite_token
     or new.invite_token_used is distinct from old.invite_token_used
     or new.invite_sent_at is distinct from old.invite_sent_at
     or new.submission_deadline is distinct from old.submission_deadline
     or new.profile_id is distinct from old.profile_id
     or new.submitted_at is distinct from old.submitted_at
     or new.published_at is distinct from old.published_at
     or new.extension_requested_at is distinct from old.extension_requested_at
     or new.extension_approved_at is distinct from old.extension_approved_at
     or new.extension_approved_by is distinct from old.extension_approved_by
  then
    raise exception 'not_allowed_to_edit_this_field';
  end if;

  return new;
end;
$$;

create trigger trg_students_self_edit
before update on public.students
for each row execute function public.enforce_student_self_edit();

create or replace function public.enforce_photo_self_edit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.is_selected is distinct from old.is_selected
     or new.display_order is distinct from old.display_order
     or new.student_id is distinct from old.student_id
  then
    raise exception 'not_allowed_to_edit_this_field';
  end if;

  return new;
end;
$$;

create trigger trg_photos_self_edit
before update on public.photos
for each row execute function public.enforce_photo_self_edit();

-- ==========================================================================
-- מנגנון הזמנה: בדיקת טוקן לפני הרשמה (anon), ומימוש הטוקן אחרי הרשמה
-- (authenticated). תומך בתלמיד חוזר: אם כבר קיים profile לאותו auth.uid(),
-- הוא מקושר לרשומת התלמיד החדשה במקום ליצור profile כפול.
-- ==========================================================================

create or replace function public.check_invite_token(p_token uuid)
returns table (student_full_name text, student_email text)
language sql
stable
security definer
set search_path = public
as $$
  select full_name, email
  from public.students
  where invite_token = p_token
    and invite_token_used = false
    and status = 'pending_submission';
$$;

revoke all on function public.check_invite_token(uuid) from public;
grant execute on function public.check_invite_token(uuid) to anon, authenticated;

create or replace function public.claim_invite(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  if exists (select 1 from public.profiles where id = v_uid and role = 'admin') then
    raise exception 'admin_cannot_claim_student_invite';
  end if;

  select id into v_student_id
  from public.students
  where invite_token = p_token
    and invite_token_used = false
    and status = 'pending_submission'
  for update;

  if v_student_id is null then
    raise exception 'invalid_or_used_token';
  end if;

  insert into public.profiles (id, role)
  values (v_uid, 'student')
  on conflict (id) do nothing;

  perform set_config('app.bypass_self_edit_guard', 'true', true);

  update public.students
  set profile_id = v_uid,
      invite_token_used = true
  where id = v_student_id;

  return v_student_id;
end;
$$;

revoke all on function public.claim_invite(uuid) from public;
grant execute on function public.claim_invite(uuid) to authenticated;

-- ==========================================================================
-- Row Level Security
-- ==========================================================================

alter table public.profiles enable row level security;
alter table public.cohorts enable row level security;
alter table public.students enable row level security;
alter table public.photos enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.cohorts to authenticated;
grant select, insert, update, delete on public.students to authenticated;
grant select, insert, update, delete on public.photos to authenticated;

-- profiles --
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = auth.uid());

create policy "profiles_select_admin" on public.profiles
  for select to authenticated using (public.is_admin());

create policy "profiles_update_admin" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated using (public.is_admin());

-- profiles ה-insert היחיד הוא דרך claim_invite (security definer, עוקף RLS)
-- או ידנית על ידי מנהל דרך ה-dashboard; אין policy ל-insert = deny כברירת מחדל.

-- cohorts --
create policy "cohorts_admin_all" on public.cohorts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- students --
create policy "students_select_own" on public.students
  for select to authenticated using (profile_id = auth.uid());

create policy "students_update_own" on public.students
  for update to authenticated using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy "students_admin_all" on public.students
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- photos --
create policy "photos_student_manage_before_submit" on public.photos
  for all to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = photos.student_id
        and s.profile_id = auth.uid()
        and s.status = 'pending_submission'
    )
  )
  with check (
    exists (
      select 1 from public.students s
      where s.id = photos.student_id
        and s.profile_id = auth.uid()
        and s.status = 'pending_submission'
    )
  );

create policy "photos_student_select_always" on public.photos
  for select to authenticated
  using (
    exists (
      select 1 from public.students s
      where s.id = photos.student_id
        and s.profile_id = auth.uid()
    )
  );

create policy "photos_admin_all" on public.photos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ==========================================================================
-- תצוגות ציבוריות: עמוד תיק העבודות הציבורי, ללא התחברות (anon).
-- חשוף רק מה שצריך: לא מייל, לא טלפון, לא טוקנים. תוכן מוסתר לגמרי
-- כשהסטטוס 'expired' — נשאר רק השם, כדי שהעמוד יוכל להציג הודעת פקיעה.
-- ==========================================================================

create view public.public_portfolio_view
with (security_invoker = false) as
select
  s.id,
  s.display_name,
  case when s.status = 'published' then s.bio else null end as bio,
  case when s.status = 'published' then s.quote else null end as quote,
  case when s.status = 'published' then s.work_description else null end as work_description,
  case when s.status = 'published' then s.personal_note else null end as personal_note,
  s.color_hue,
  s.color_variation,
  s.status,
  s.published_at
from public.students s
where s.status in ('published', 'expired');

create view public.public_portfolio_photos_view
with (security_invoker = false) as
select
  p.id,
  p.student_id,
  p.storage_path,
  p.title,
  p.display_order
from public.photos p
join public.students s on s.id = p.student_id
where s.status = 'published' and p.is_selected = true
order by p.display_order;

grant select on public.public_portfolio_view to anon, authenticated;
grant select on public.public_portfolio_photos_view to anon, authenticated;

-- ==========================================================================
-- Storage: bucket פרטי לתמונות, גישה נשלטת דרך policies על storage.objects.
-- נתיב אובייקט מוסכם: {student_id}/{photo_id}-{filename}
-- לצפייה ציבורית משתמשים ב-signed URLs שמונפקים בצד שרת (לא גישה ישירה).
-- ==========================================================================

insert into storage.buckets (id, name, public)
values ('portfolio-photos', 'portfolio-photos', false)
on conflict (id) do nothing;

create policy "storage_student_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'portfolio-photos'
    and exists (
      select 1 from public.students s
      where s.profile_id = auth.uid()
        and s.status = 'pending_submission'
        and (storage.foldername(name))[1] = s.id::text
    )
  );

create policy "storage_student_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'portfolio-photos'
    and exists (
      select 1 from public.students s
      where s.profile_id = auth.uid()
        and (storage.foldername(name))[1] = s.id::text
    )
  );

create policy "storage_student_delete_own_before_submit" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'portfolio-photos'
    and exists (
      select 1 from public.students s
      where s.profile_id = auth.uid()
        and s.status = 'pending_submission'
        and (storage.foldername(name))[1] = s.id::text
    )
  );

create policy "storage_admin_all" on storage.objects
  for all to authenticated
  using (bucket_id = 'portfolio-photos' and public.is_admin())
  with check (bucket_id = 'portfolio-photos' and public.is_admin());
