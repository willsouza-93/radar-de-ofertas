alter table public.approval_queue enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.review_notes enable row level security;

create policy approval_queue_select_curator
on public.approval_queue
for select
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy approval_queue_insert_curator
on public.approval_queue
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy approval_queue_update_curator
on public.approval_queue
for update
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)))
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy approval_decisions_select_curator
on public.approval_decisions
for select
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy approval_decisions_insert_curator
on public.approval_decisions
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy review_notes_select_curator
on public.review_notes
for select
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy review_notes_insert_curator
on public.review_notes
for insert
to authenticated
with check ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));
