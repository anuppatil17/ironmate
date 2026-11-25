-- IronMate: tables, row level security and sign-up helpers.
-- Already applied to the live project. Kept here so you can rebuild the database from zero.
--
-- Who can do what
--   tracker (wife)   : reads everything in her family; writes day logs, lab results, settings.
--   partner (husband): reads everything in the family; cannot change logs or lab results;
--                      can add doctor visits / blood test dates and send notes.
--   anyone else      : sees nothing.

-- ---------------------------------------------------------------- tables

create table if not exists public.families (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references auth.users (id) on delete cascade,
  invite_code text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  tz          text not null default 'UTC',
  config      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.family_members (
  family_id    uuid not null references public.families (id) on delete cascade,
  user_id      uuid not null unique references auth.users (id) on delete cascade, -- one family per person
  role         text not null check (role in ('tracker', 'partner')),
  display_name text,
  joined_at    timestamptz not null default now(),
  primary key (family_id, user_id)
);
create unique index if not exists family_one_per_role on public.family_members (family_id, role);

create table if not exists public.days (
  family_id  uuid not null references public.families (id) on delete cascade,
  day        date not null,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (family_id, day)
);

create table if not exists public.labs (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families (id) on delete cascade,
  test_date  date not null,
  hb         numeric(4, 1) check (hb is null or (hb >= 1 and hb <= 25)),
  ferritin   numeric(7, 1) check (ferritin is null or (ferritin >= 0 and ferritin <= 5000)),
  lab        text check (char_length(lab) <= 80),
  note       text check (char_length(note) <= 300),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now(),
  check (hb is not null or ferritin is not null)
);
create index if not exists labs_family on public.labs (family_id, test_date);

create table if not exists public.appointments (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families (id) on delete cascade,
  kind       text not null default 'doctor' check (kind in ('doctor', 'blood_test', 'other')),
  on_date    date not null,
  at_time    time,
  title      text check (char_length(title) <= 80),
  place      text check (char_length(place) <= 80),
  note       text check (char_length(note) <= 300),
  done       boolean not null default false,
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);
create index if not exists appointments_family on public.appointments (family_id, on_date);

create table if not exists public.cheers (
  id         uuid primary key default gen_random_uuid(),
  family_id  uuid not null references public.families (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 200),
  from_user  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists cheers_family on public.cheers (family_id, created_at desc);

create table if not exists public.push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  family_id  uuid not null references public.families (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

-- Used only by the reminder function, so the same reminder is never sent twice.
create table if not exists public.reminder_log (
  family_id uuid not null references public.families (id) on delete cascade,
  day       date not null,
  key       text not null,
  sent_at   timestamptz not null default now(),
  primary key (family_id, day, key)
);

-- Slows down guessing of invite codes.
create table if not exists public.join_attempts (
  user_id uuid not null,
  at      timestamptz not null default now()
);
create index if not exists join_attempts_user on public.join_attempts (user_id, at);

-- ---------------------------------------------------------------- helpers

create or replace function public.ij_family_id() returns uuid
language sql stable security definer set search_path = public as $$
  select family_id from public.family_members where user_id = auth.uid()
$$;

create or replace function public.ij_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.family_members where user_id = auth.uid()
$$;

create or replace function public.ij_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists days_touch on public.days;
create trigger days_touch before update on public.days for each row execute function public.ij_touch();

-- The person who tracks creates the family space.
create or replace function public.create_family(p_name text default null, p_tz text default 'UTC') returns uuid
language plpgsql security definer set search_path = public as $$
declare
  fid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.family_members where user_id = auth.uid()) then
    raise exception 'already in a family';
  end if;
  insert into public.families (created_by, tz) values (auth.uid(), coalesce(nullif(p_tz, ''), 'UTC')) returning id into fid;
  insert into public.family_members (family_id, user_id, role, display_name)
  values (fid, auth.uid(), 'tracker', nullif(left(coalesce(p_name, ''), 40), ''));
  return fid;
end $$;

-- The partner joins with the invite code. Returns null when the code is wrong or already used.
create or replace function public.join_family(p_code text, p_name text default null) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  fid uuid;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if exists (select 1 from public.family_members where user_id = auth.uid()) then
    raise exception 'already in a family';
  end if;
  if (select count(*) from public.join_attempts where user_id = auth.uid() and at > now() - interval '1 hour') >= 10 then
    return null;
  end if;
  insert into public.join_attempts (user_id) values (auth.uid());

  select id into fid from public.families where invite_code = upper(trim(coalesce(p_code, ''))) for update;
  if fid is null then return null; end if;
  if exists (select 1 from public.family_members where family_id = fid and role = 'partner') then return null; end if;

  insert into public.family_members (family_id, user_id, role, display_name)
  values (fid, auth.uid(), 'partner', nullif(left(coalesce(p_name, ''), 40), ''));
  return fid;
end $$;

revoke all on function public.ij_touch() from public, anon, authenticated;
revoke all on function public.create_family(text, text) from public, anon;
revoke all on function public.join_family(text, text) from public, anon;
revoke all on function public.ij_family_id() from public, anon;
revoke all on function public.ij_role() from public, anon;
grant execute on function public.create_family(text, text) to authenticated;
grant execute on function public.join_family(text, text) to authenticated;
grant execute on function public.ij_family_id() to authenticated;
grant execute on function public.ij_role() to authenticated;

-- ---------------------------------------------------------------- row level security

alter table public.families           enable row level security;
alter table public.family_members     enable row level security;
alter table public.days               enable row level security;
alter table public.labs               enable row level security;
alter table public.appointments       enable row level security;
alter table public.cheers             enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.reminder_log       enable row level security; -- no policies: service role only
alter table public.join_attempts      enable row level security; -- no policies: used inside join_family only

revoke all on public.families, public.family_members, public.days, public.labs, public.appointments,
              public.cheers, public.push_subscriptions, public.reminder_log, public.join_attempts
  from anon, authenticated;

grant select on public.families to authenticated;
grant update (config, tz) on public.families to authenticated;
grant select on public.family_members to authenticated;
grant select, insert, update, delete on public.days, public.labs, public.appointments, public.push_subscriptions to authenticated;
grant select, insert, delete on public.cheers to authenticated;

drop policy if exists families_read on public.families;
create policy families_read on public.families for select to authenticated
  using (id = public.ij_family_id());
drop policy if exists families_update on public.families;
create policy families_update on public.families for update to authenticated
  using (id = public.ij_family_id() and public.ij_role() = 'tracker')
  with check (id = public.ij_family_id() and public.ij_role() = 'tracker');

drop policy if exists members_read on public.family_members;
create policy members_read on public.family_members for select to authenticated
  using (family_id = public.ij_family_id());

drop policy if exists days_read on public.days;
create policy days_read on public.days for select to authenticated
  using (family_id = public.ij_family_id());
drop policy if exists days_write on public.days;
create policy days_write on public.days for all to authenticated
  using (family_id = public.ij_family_id() and public.ij_role() = 'tracker')
  with check (family_id = public.ij_family_id() and public.ij_role() = 'tracker');

drop policy if exists labs_read on public.labs;
create policy labs_read on public.labs for select to authenticated
  using (family_id = public.ij_family_id());
drop policy if exists labs_write on public.labs;
create policy labs_write on public.labs for all to authenticated
  using (family_id = public.ij_family_id() and public.ij_role() = 'tracker')
  with check (family_id = public.ij_family_id() and public.ij_role() = 'tracker');

drop policy if exists appointments_all on public.appointments;
create policy appointments_all on public.appointments for all to authenticated
  using (family_id = public.ij_family_id())
  with check (family_id = public.ij_family_id());

drop policy if exists cheers_read on public.cheers;
create policy cheers_read on public.cheers for select to authenticated
  using (family_id = public.ij_family_id());
drop policy if exists cheers_insert on public.cheers;
create policy cheers_insert on public.cheers for insert to authenticated
  with check (family_id = public.ij_family_id() and from_user = auth.uid());
drop policy if exists cheers_delete on public.cheers;
create policy cheers_delete on public.cheers for delete to authenticated
  using (from_user = auth.uid());

drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and family_id = public.ij_family_id());

-- ---------------------------------------------------------------- live updates

do $$
declare
  t text;
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    foreach t in array array['families', 'days', 'labs', 'appointments', 'cheers'] loop
      if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
        execute format('alter publication supabase_realtime add table public.%I', t);
      end if;
    end loop;
  end if;
end $$;
