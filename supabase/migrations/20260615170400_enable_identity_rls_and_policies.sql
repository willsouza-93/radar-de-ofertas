alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;

create policy workspaces_select_active_member
on public.workspaces
for select
to authenticated
using ((select app_private.is_active_member(id)));

create policy profiles_select_visible
on public.profiles
for select
to authenticated
using ((select app_private.can_view_profile(id)));

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy workspace_members_select_own
on public.workspace_members
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy workspace_members_select_admin_workspace
on public.workspace_members
for select
to authenticated
using (
  (select app_private.has_role(
    workspace_id,
    array['admin'::public.app_role]
  ))
);
