-- פוטואקטיב, עמוד תיק העבודות הציבורי (שלב חמש)
-- מונה צפיות: פונקציה anon-callable שמגדילה view_count רק לתיקים שפורסמו.
-- view_count לא נמצא ברשימת השדות האסורים ב-enforce_student_self_edit,
-- אז אין צורך בדגל מעקף כאן.

-- public_portfolio_view נוצר לפני שהתווספו trait_1/2/3 (סעיף "שלושה דברים
-- שמאפיינים את הצילום שלי"). מחליף את התצוגה כדי לכלול אותם. עמודות חדשות
-- ב-CREATE OR REPLACE VIEW חייבות להתווסף בסוף רשימת העמודות, לא באמצע,
-- אחרת פוסטגרס דוחה את השינוי.
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
  case when s.status = 'published' then s.trait_3 else null end as trait_3
from public.students s
where s.status in ('published', 'expired');

grant select on public.public_portfolio_view to anon, authenticated;

create or replace function public.increment_view_count(p_student_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.students
  set view_count = view_count + 1
  where id = p_student_id
    and status = 'published';
$$;

revoke all on function public.increment_view_count(uuid) from public;
grant execute on function public.increment_view_count(uuid) to anon, authenticated;

-- storage.objects עדיין לא הרשה קריאה ל-anon בכלל. מוסיף גישת קריאה מדויקת:
-- רק תמונות שסומנו is_selected על תלמיד שכבר published. לא public bucket
-- גורף, ולא שימוש ב-service role בצד השרת בשביל דף ציבורי.
create policy "storage_public_select_published" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'portfolio-photos'
    and exists (
      select 1 from public.photos p
      join public.students s on s.id = p.student_id
      where p.storage_path = storage.objects.name
        and p.is_selected = true
        and s.status = 'published'
    )
  );
