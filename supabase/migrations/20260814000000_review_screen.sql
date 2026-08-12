-- פוטואקטיב, מסך העריכה והאישור של אלדד (שלב ארבע)
-- פרסום: מאמת 6-20 תמונות מסומנות עם display_order תקין (ייחודי לכל אחת),
-- ומעביר את הסטטוס ל-published. מנהלים כבר עוקפים RLS/trigger לגמרי דרך
-- students_admin_all / photos_admin_all / is_admin() בתוך enforce_*_self_edit,
-- כך שזה פתוח גם לחזרה לעריכה ופרסום מחדש אחרי שכבר פורסם (סעיף 12 בביקורת).
-- published_at נשמר כפי שהיה בפרסום חוזר, לא מתאפס.

create or replace function public.admin_publish_portfolio(p_student_id uuid)
returns public.students
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.students;
  v_selected_count int;
  v_distinct_orders int;
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

  select count(*) into v_selected_count
  from public.photos
  where student_id = p_student_id and is_selected = true;

  if v_selected_count < 6 then
    raise exception 'too_few_selected_photos';
  end if;

  if v_selected_count > 20 then
    raise exception 'too_many_selected_photos';
  end if;

  select count(distinct display_order) into v_distinct_orders
  from public.photos
  where student_id = p_student_id and is_selected = true;

  if v_distinct_orders <> v_selected_count then
    raise exception 'selected_photos_missing_order';
  end if;

  update public.students
  set status = 'published',
      published_at = coalesce(published_at, now())
  where id = p_student_id
  returning * into v_student;

  return v_student;
end;
$$;

revoke all on function public.admin_publish_portfolio(uuid) from public;
grant execute on function public.admin_publish_portfolio(uuid) to authenticated;
