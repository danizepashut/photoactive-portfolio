-- פוטואקטיב, תמונת פרופיל ושנת לידה בכרטיס התלמיד.
-- שני השדות אופציונליים - לא נוספה דרישה ל-submit_portfolio, כדי לא לחסום
-- תלמידים שכבר באמצע מילוי הטופס. עורכים אותם בדיוק כמו bio/quote: הם לא
-- ברשימת השדות החסומים ב-enforce_student_self_edit, אז אין צורך בשינוי
-- בטריגר או ב-RLS של הטבלה עצמה.

alter table public.students
  add column if not exists profile_photo_path text,
  add column if not exists birth_year smallint;

alter table public.students
  add constraint students_birth_year_range
  check (
    birth_year is null
    or (birth_year between 1900 and extract(year from now())::int)
  );

-- public_portfolio_view: אותו דפוס הסתרה כמו bio/quote/trait - מוצג רק
-- כשהתיק published, מוסתר ב-expired. עמודות חדשות בסוף רשימת ה-select,
-- לא באמצע (ראה הערה במיגרציה 20260816000000 על אותה מגבלה).
create or replace view public.public_portfolio_view
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
  s.published_at,
  case when s.status = 'published' then s.trait_1 else null end as trait_1,
  case when s.status = 'published' then s.trait_2 else null end as trait_2,
  case when s.status = 'published' then s.trait_3 else null end as trait_3,
  case when s.status = 'published' then s.profile_photo_path else null end as profile_photo_path,
  case when s.status = 'published' then s.birth_year else null end as birth_year
from public.students s
where s.status in ('published', 'expired');

grant select on public.public_portfolio_view to anon, authenticated;

-- גישת anon לתמונת הפרופיל בסטורג', באותו דפוס בדיוק כמו
-- photo_is_publicly_visible לתמונות הגלריה (20260816000001): פונקציה
-- SECURITY DEFINER כדי לעקוף את ה-RLS של students בתוך ה-policy עצמה.
create or replace function public.profile_photo_is_publicly_visible(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.students s
    where s.profile_photo_path = p_storage_path
      and s.status = 'published'
  );
$$;

revoke all on function public.profile_photo_is_publicly_visible(text) from public;
grant execute on function public.profile_photo_is_publicly_visible(text) to anon, authenticated;

create policy "storage_public_select_profile_photo" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'portfolio-photos'
    and public.profile_photo_is_publicly_visible(storage.objects.name)
  );
