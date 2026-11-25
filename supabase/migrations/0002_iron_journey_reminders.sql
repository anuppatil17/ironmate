-- IronMate: push reminder plumbing.
-- Already applied to the live project. Kept here so you can rebuild the database from zero.
-- If you rebuild in another project, change the project address in the cron job below.
--
-- Secrets live in Supabase Vault. They are created inside the database or inside the edge function
-- and are never typed by a person.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Read one IronMate secret. Only the service role (the edge function) may call this.
create or replace function public.ij_secret(p_name text) returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_name and name like 'ij\_%' limit 1
$$;

-- Store an IronMate secret once. A second call with the same name changes nothing.
create or replace function public.ij_put_secret(p_name text, p_value text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if p_name not like 'ij\_%' then raise exception 'bad secret name'; end if;
  if exists (select 1 from vault.secrets where name = p_name) then return false; end if;
  perform vault.create_secret(p_value, p_name, 'IronMate');
  return true;
exception when unique_violation then
  return false;
end $$;

revoke all on function public.ij_secret(text) from public, anon, authenticated;
revoke all on function public.ij_put_secret(text, text) from public, anon, authenticated;
grant execute on function public.ij_secret(text) to service_role;
grant execute on function public.ij_put_secret(text, text) to service_role;

-- The scheduler's password for the edge function: made here, kept in Vault.
select public.ij_put_secret('ij_cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''));

-- Every 5 minutes: ask the edge function to send the reminders that are due.
select cron.schedule(
  'iron-journey-reminders',
  '*/5 * * * *',
  $cron$
  select net.http_post(
    url     := 'https://vlcsspkyfhmlmtdyucjt.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'ij_cron_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $cron$
);

-- To stop the reminders:  select cron.unschedule('iron-journey-reminders');
