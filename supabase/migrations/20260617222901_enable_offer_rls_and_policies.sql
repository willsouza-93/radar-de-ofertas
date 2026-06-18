alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.offers enable row level security;
alter table public.offer_tags enable row level security;
alter table public.price_snapshots enable row level security;

create policy categories_select_active_member
on public.categories
for select
to authenticated
using ((select app_private.is_active_member(workspace_id)));

create policy categories_insert_admin
on public.categories
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy categories_update_admin
on public.categories
for update
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)))
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy tags_select_active_member
on public.tags
for select
to authenticated
using ((select app_private.is_active_member(workspace_id)));

create policy tags_insert_admin
on public.tags
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy tags_update_admin
on public.tags
for update
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)))
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy offers_select_active_member
on public.offers
for select
to authenticated
using ((select app_private.is_active_member(workspace_id)));

create policy offers_insert_admin
on public.offers
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy offers_update_admin
on public.offers
for update
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)))
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy offer_tags_select_active_member
on public.offer_tags
for select
to authenticated
using ((select app_private.is_active_member(workspace_id)));

create policy offer_tags_insert_admin
on public.offer_tags
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy offer_tags_delete_admin
on public.offer_tags
for delete
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));

create policy price_snapshots_select_active_member
on public.price_snapshots
for select
to authenticated
using ((select app_private.is_active_member(workspace_id)));

create policy price_snapshots_insert_admin
on public.price_snapshots
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role]
)));
