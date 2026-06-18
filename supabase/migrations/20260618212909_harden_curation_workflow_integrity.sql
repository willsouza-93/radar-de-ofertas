drop policy if exists approval_queue_insert_curator on public.approval_queue;
drop policy if exists approval_queue_update_curator on public.approval_queue;
drop policy if exists approval_decisions_insert_curator on public.approval_decisions;
drop policy if exists review_notes_insert_curator on public.review_notes;

revoke insert, update, delete on table public.approval_queue from authenticated;
revoke insert, update, delete on table public.approval_decisions from authenticated;
revoke update, delete on table public.review_notes from authenticated;

create policy review_notes_insert_curator_pending
on public.review_notes
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select app_private.has_role(
    workspace_id,
    array['admin'::public.app_role, 'editor'::public.app_role]
  ))
  and exists (
    select 1
    from public.approval_queue as queue
    where queue.workspace_id = review_notes.workspace_id
      and queue.id = review_notes.queue_id
      and queue.offer_id = review_notes.offer_id
      and queue.status = 'pending'::public.approval_status
  )
);

create or replace function public.apply_approval_decision(
  target_queue_id uuid,
  expected_status public.approval_status,
  target_decision public.approval_decision_type,
  decision_reason text default null,
  note_body text default null
)
returns table (
  queue_id uuid,
  offer_id uuid,
  queue_status public.approval_status,
  decision_id uuid,
  decided_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  queue_row public.approval_queue%rowtype;
  inserted_decision_id uuid;
  current_decided_at timestamptz := now();
  normalized_reason text := nullif(trim(decision_reason), '');
  normalized_note text := nullif(trim(note_body), '');
  next_status public.approval_status := target_decision::text::public.approval_status;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
  into queue_row
  from public.approval_queue as queue
  where queue.id = target_queue_id
  for update;

  if not found then
    raise exception 'curation queue not found'
      using errcode = 'P0002';
  end if;

  if not app_private.has_role(
    queue_row.workspace_id,
    array['admin'::public.app_role, 'editor'::public.app_role]
  ) then
    raise exception 'insufficient workspace permission'
      using errcode = '42501';
  end if;

  if expected_status <> 'pending'::public.approval_status
    or queue_row.status <> expected_status then
    raise exception 'approval queue status conflict'
      using errcode = '40001';
  end if;

  if target_decision = 'rejected'::public.approval_decision_type
    and (normalized_reason is null or char_length(normalized_reason) not between 3 and 2000) then
    raise exception 'rejection reason is required'
      using errcode = '23514';
  end if;

  if target_decision = 'approved'::public.approval_decision_type
    and normalized_reason is not null
    and char_length(normalized_reason) not between 3 and 2000 then
    raise exception 'approval reason is invalid'
      using errcode = '23514';
  end if;

  if normalized_note is not null
    and char_length(normalized_note) not between 1 and 2000 then
    raise exception 'review note is invalid'
      using errcode = '23514';
  end if;

  insert into public.approval_decisions (
    workspace_id,
    queue_id,
    offer_id,
    decision,
    previous_status,
    next_status,
    reason,
    decided_by,
    decided_at,
    created_at
  )
  values (
    queue_row.workspace_id,
    queue_row.id,
    queue_row.offer_id,
    target_decision,
    queue_row.status,
    next_status,
    normalized_reason,
    actor_id,
    current_decided_at,
    current_decided_at
  )
  returning id into inserted_decision_id;

  if normalized_note is not null then
    insert into public.review_notes (
      workspace_id,
      queue_id,
      offer_id,
      body,
      created_by,
      created_at
    )
    values (
      queue_row.workspace_id,
      queue_row.id,
      queue_row.offer_id,
      normalized_note,
      actor_id,
      current_decided_at
    );
  end if;

  update public.approval_queue as queue
  set
    status = next_status,
    last_decision_id = inserted_decision_id,
    last_reviewed_by = actor_id,
    last_reviewed_at = current_decided_at
  where queue.workspace_id = queue_row.workspace_id
    and queue.id = queue_row.id;

  return query
  select
    queue_row.id,
    queue_row.offer_id,
    next_status,
    inserted_decision_id,
    current_decided_at;
end;
$$;

revoke all on function public.apply_approval_decision(
  uuid,
  public.approval_status,
  public.approval_decision_type,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.apply_approval_decision(
  uuid,
  public.approval_status,
  public.approval_decision_type,
  text,
  text
) to authenticated;
