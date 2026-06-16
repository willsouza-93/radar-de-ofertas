create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug extensions.citext not null unique,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workspaces_name_length check (char_length(trim(name)) between 2 and 120),
  constraint workspaces_slug_format check (slug::text ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint workspaces_timezone_not_blank check (char_length(trim(timezone)) > 0)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(trim(display_name)) between 2 and 120)
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  status public.member_status not null default 'active',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_status_idx
  on public.workspace_members (user_id, status);

create index workspace_members_workspace_role_status_idx
  on public.workspace_members (workspace_id, role, status);

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function app_private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create trigger workspace_members_set_updated_at
before update on public.workspace_members
for each row execute function app_private.set_updated_at();

create or replace function app_private.protect_last_active_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removes_last_admin boolean;
begin
  perform 1
  from public.workspaces
  where id = old.workspace_id
  for update;

  if tg_op = 'DELETE' then
    removes_last_admin :=
      old.role = 'admin'::public.app_role
      and old.status = 'active'::public.member_status;
  else
    removes_last_admin :=
      old.role = 'admin'::public.app_role
      and old.status = 'active'::public.member_status
      and (
        new.role <> 'admin'::public.app_role
        or new.status <> 'active'::public.member_status
      );
  end if;

  if removes_last_admin
     and not exists (
       select 1
       from public.workspace_members as other_admin
       where other_admin.workspace_id = old.workspace_id
         and other_admin.user_id <> old.user_id
         and other_admin.role = 'admin'::public.app_role
         and other_admin.status = 'active'::public.member_status
     ) then
    raise exception 'workspace must retain at least one active admin'
      using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function app_private.protect_last_active_admin() from public;
revoke all on function app_private.protect_last_active_admin() from anon;
revoke all on function app_private.protect_last_active_admin() from authenticated;

create trigger workspace_members_protect_last_active_admin
before update of role, status or delete on public.workspace_members
for each row execute function app_private.protect_last_active_admin();
