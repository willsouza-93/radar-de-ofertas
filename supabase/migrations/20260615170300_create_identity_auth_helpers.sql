create or replace function app_private.is_active_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'::public.member_status
  );
$$;

create or replace function app_private.current_role(target_workspace_id uuid)
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select membership.role
  from public.workspace_members as membership
  where membership.workspace_id = target_workspace_id
    and membership.user_id = (select auth.uid())
    and membership.status = 'active'::public.member_status
  limit 1;
$$;

create or replace function app_private.has_role(
  target_workspace_id uuid,
  allowed_roles public.app_role[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members as membership
    where membership.workspace_id = target_workspace_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'::public.member_status
      and membership.role = any(allowed_roles)
  );
$$;

create or replace function app_private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.workspace_members as actor
      join public.workspace_members as target
        on target.workspace_id = actor.workspace_id
      where actor.user_id = (select auth.uid())
        and actor.role = 'admin'::public.app_role
        and actor.status = 'active'::public.member_status
        and target.user_id = target_user_id
    );
$$;

create or replace function app_private.assert_role(
  target_workspace_id uuid,
  allowed_roles public.app_role[]
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app_private.has_role(target_workspace_id, allowed_roles) then
    raise exception 'insufficient workspace permission'
      using errcode = '42501';
  end if;
end;
$$;

revoke all on all functions in schema app_private from public;
revoke all on all functions in schema app_private from anon;
revoke all on all functions in schema app_private from authenticated;
