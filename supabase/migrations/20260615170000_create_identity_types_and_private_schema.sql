create extension if not exists citext with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;

create type public.app_role as enum ('admin', 'editor');
create type public.member_status as enum ('active', 'suspended', 'invited');

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function app_private.set_updated_at() from public;
revoke all on function app_private.set_updated_at() from anon;
revoke all on function app_private.set_updated_at() from authenticated;
