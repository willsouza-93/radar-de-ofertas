revoke all on table public.workspaces from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.workspace_members from public, anon, authenticated;

revoke create on schema public from public, anon, authenticated;
grant usage on schema public to anon, authenticated;

grant select on table public.workspaces to authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.workspace_members to authenticated;

revoke all on type public.app_role from public, anon, authenticated;
revoke all on type public.member_status from public, anon, authenticated;
grant usage on type public.app_role to authenticated;
grant usage on type public.member_status to authenticated;

revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;

revoke all on all functions in schema app_private from public, anon, authenticated;
grant execute on function app_private.is_active_member(uuid) to authenticated;
grant execute on function app_private.has_role(uuid, public.app_role[]) to authenticated;
grant execute on function app_private.can_view_profile(uuid) to authenticated;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
