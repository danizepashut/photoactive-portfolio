-- פוטואקטיב, עדכוני מסך ניהול צוות: נוכחות (online) והתראות פנימיות.
--
-- last_seen_at מתעדכן ע"י heartbeat בצד הלקוח כל עוד יש עמוד ניהול פתוח -
-- "מחובר עכשיו" נגזר מזה שהוא בתוך 60 השניות האחרונות, לא presence אמיתי
-- (websocket), מספיק לצוות קטן ולא דורש ניהול ערוץ realtime נפרד.
--
-- notify_new_activity קובע מי מקבל התראות על אירועים תפעוליים (מחזור חדש,
-- תלמיד/ים חדשים). ברירת מחדל false - לא כל מנהל בהכרח רוצה את זה (למשל
-- אלדד, שמתעניין בסקירה/פרסום ולא בניהול שוטף), דני מודלק במפורש למטה.

alter table public.profiles
  add column if not exists last_seen_at timestamptz,
  add column if not exists notify_new_activity boolean not null default false;

update public.profiles
set notify_new_activity = true
where id = '37ea9d81-93fb-4ba7-bb95-4405fcd78549';

-- ==========================================================================
-- התראות פנימיות באפליקציה. שלב ביניים עד שערוץ מייל/וואטסאפ אמיתי יחובר
-- (ראה lib/messages.ts) - לא שולח שום דבר בפועל, רק נשמר ומוצג בפעמון
-- בפאנל הניהול למי שסימן notify_new_activity.
-- ==========================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx
  on public.notifications (recipient_id, read_at, created_at desc);

alter table public.notifications enable row level security;

grant select, update on public.notifications to authenticated;

create policy "notifications_select_own" on public.notifications
  for select to authenticated
  using (recipient_id = auth.uid());

create policy "notifications_update_own" on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- אין policy ל-insert לתפקיד authenticated בכוונה - יצירת התראה תמיד דרך
-- create_notification (SECURITY DEFINER) כדי שמנהל אחד יוכל ליצור התראה
-- למנהלים אחרים (לא רק לעצמו), ולא ישירות מהלקוח.
create or replace function public.create_notification(
  p_kind text,
  p_title text,
  p_body text,
  p_link text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_admin';
  end if;

  insert into public.notifications (recipient_id, kind, title, body, link)
  select id, p_kind, p_title, p_body, p_link
  from public.profiles
  where role = 'admin' and notify_new_activity = true;
end;
$$;

revoke all on function public.create_notification(text, text, text, text) from public;
grant execute on function public.create_notification(text, text, text, text) to authenticated;
