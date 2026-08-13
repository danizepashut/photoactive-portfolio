-- פוטואקטיב, פוטר "רוצים ליצור איתי קשר?" בעמוד הציבורי.
-- טלפון ומייל כבר קיימים בטבלה אבל מעולם לא נחשפו ב-public_portfolio_view
-- (במפורש הוסתרו במיגרציה 20260816000000: "לא מייל, לא טלפון"). זה שינוי
-- מכוון - נחשפים עכשיו כחלק מפרטי יצירת קשר, באותו דפוס הסתרה כמו bio/quote:
-- רק כש-published, מוסתר ב-expired.
--
-- website_url הוא שדה חדש, אופציונלי, לא ברשימת השדות החסומים ב-
-- enforce_student_self_edit, אז נערך עצמאית על ידי התלמיד בדיוק כמו bio/quote.

alter table public.students
  add column if not exists website_url text;

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
  case when s.status = 'published' then s.birth_year else null end as birth_year,
  case when s.status = 'published' then s.phone else null end as phone,
  case when s.status = 'published' then s.email else null end as email,
  case when s.status = 'published' then s.website_url else null end as website_url
from public.students s
where s.status in ('published', 'expired');

grant select on public.public_portfolio_view to anon, authenticated;
