-- פוטואקטיב, הסכמת תלמיד להצגת פרטי יצירת קשר (שם/טלפון/מייל) בכרטיס
-- הציבורי. ברירת מחדל true (מסומן מראש, opt-out) - תלמיד שלא רוצה מבטל
-- את הסימון בטופס הקליטה. לא ברשימת השדות החסומים ב-enforce_student_self_edit,
-- אז נערך בדיוק כמו bio/quote - כלומר ניתן לעריכה עצמית רק כל עוד
-- status = 'pending_submission' (students_update_own), ונחסם אוטומטית
-- אחרי submit_portfolio באותו נעילה הקיימת שכבר חוסמת את שאר השדות.
-- בכוונה אין לזה עורך בפאנל הניהול - זו בחירה חד-פעמית של התלמיד בהרשמה.

alter table public.students
  add column if not exists show_contact_info boolean not null default true;

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
  case when s.status = 'published' and s.show_contact_info then s.phone else null end as phone,
  case when s.status = 'published' and s.show_contact_info then s.email else null end as email,
  case when s.status = 'published' and s.show_contact_info then s.website_url else null end as website_url
from public.students s
where s.status in ('published', 'expired');

grant select on public.public_portfolio_view to anon, authenticated;
