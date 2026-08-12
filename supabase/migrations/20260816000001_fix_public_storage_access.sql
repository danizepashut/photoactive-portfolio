-- פוטואקטיב, תיקון: storage_public_select_published (מ-20260816000000) לא
-- עבד בפועל. הסיבה: ה-USING כלל תת-שאילתה על public.photos/public.students,
-- אבל ל-anon אין policy מתאימה על אותן טבלאות (רק authenticated), אז ה-RLS
-- שלהן סינן את התת-שאילתה עצמה לאפס שורות, גם כשה-GRANT קיים. הפתרון: פונקציה
-- SECURITY DEFINER (עוקפת RLS, כמו is_admin/check_invite_token הקיימות)
-- במקום subquery ישיר בתוך ה-policy.

create or replace function public.photo_is_publicly_visible(p_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.photos p
    join public.students s on s.id = p.student_id
    where p.storage_path = p_storage_path
      and p.is_selected = true
      and s.status = 'published'
  );
$$;

revoke all on function public.photo_is_publicly_visible(text) from public;
grant execute on function public.photo_is_publicly_visible(text) to anon, authenticated;

drop policy if exists "storage_public_select_published" on storage.objects;

create policy "storage_public_select_published" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'portfolio-photos'
    and public.photo_is_publicly_visible(storage.objects.name)
  );
