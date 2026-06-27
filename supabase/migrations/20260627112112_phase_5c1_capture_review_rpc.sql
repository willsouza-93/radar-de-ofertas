create or replace function public.submit_capture_for_review(
  target_offer_id uuid,
  target_priority_score integer,
  target_reentry_reason text default null,
  target_capture_run_id text default null,
  target_correlation_id text default null
)
returns table (
  queue_id uuid,
  offer_id uuid,
  queue_status public.approval_status,
  submitted boolean,
  action text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  offer_row public.offers%rowtype;
  queue_row public.approval_queue%rowtype;
  normalized_reason text := nullif(trim(target_reentry_reason), '');
  normalized_capture_run_id text := nullif(trim(target_capture_run_id), '');
  normalized_correlation_id text := nullif(trim(target_correlation_id), '');
  current_timestamp timestamptz := now();
  note_body text;
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if target_offer_id is null then
    raise exception 'offer id is required'
      using errcode = '23514';
  end if;

  if target_priority_score is null
    or target_priority_score < 0
    or target_priority_score > 100 then
    raise exception 'priority score must be between 0 and 100'
      using errcode = '23514';
  end if;

  if normalized_reason is not null
    and normalized_reason not in (
      'new_offer',
      'material_change',
      'cooldown_elapsed',
      'cooldown_not_elapsed',
      'already_pending'
    ) then
    raise exception 'unsupported capture review reason'
      using errcode = '23514';
  end if;

  if normalized_capture_run_id is not null and char_length(normalized_capture_run_id) > 200 then
    raise exception 'capture run id is too long'
      using errcode = '23514';
  end if;

  if normalized_correlation_id is not null and char_length(normalized_correlation_id) > 200 then
    raise exception 'correlation id is too long'
      using errcode = '23514';
  end if;

  select *
  into offer_row
  from public.offers as offer
  where offer.id = target_offer_id
  for update;

  if not found then
    raise exception 'offer not found'
      using errcode = 'P0002';
  end if;

  if not app_private.has_role(
    offer_row.workspace_id,
    array['admin'::public.app_role]
  ) then
    raise exception 'insufficient workspace permission'
      using errcode = '42501';
  end if;

  select *
  into queue_row
  from public.approval_queue as queue
  where queue.workspace_id = offer_row.workspace_id
    and queue.offer_id = offer_row.id
  for update;

  if not found then
    insert into public.approval_queue (
      workspace_id,
      offer_id,
      status,
      priority_score,
      created_at,
      updated_at
    )
    values (
      offer_row.workspace_id,
      offer_row.id,
      'pending'::public.approval_status,
      target_priority_score,
      current_timestamp,
      current_timestamp
    )
    returning * into queue_row;

    perform app_private.add_capture_review_note(
      queue_row.workspace_id,
      queue_row.id,
      queue_row.offer_id,
      actor_id,
      'created',
      normalized_reason,
      normalized_capture_run_id,
      normalized_correlation_id,
      current_timestamp
    );

    return query
    select
      queue_row.id,
      queue_row.offer_id,
      queue_row.status,
      true,
      'created'::text;
    return;
  end if;

  if queue_row.status = 'pending'::public.approval_status then
    update public.approval_queue as queue
    set priority_score = target_priority_score
    where queue.workspace_id = queue_row.workspace_id
      and queue.id = queue_row.id
    returning * into queue_row;

    perform app_private.add_capture_review_note(
      queue_row.workspace_id,
      queue_row.id,
      queue_row.offer_id,
      actor_id,
      'already_pending',
      coalesce(normalized_reason, 'already_pending'),
      normalized_capture_run_id,
      normalized_correlation_id,
      current_timestamp
    );

    return query
    select
      queue_row.id,
      queue_row.offer_id,
      queue_row.status,
      false,
      'already_pending'::text;
    return;
  end if;

  if normalized_reason not in ('material_change', 'cooldown_elapsed') then
    return query
    select
      queue_row.id,
      queue_row.offer_id,
      queue_row.status,
      false,
      'not_reentered'::text;
    return;
  end if;

  update public.approval_queue as queue
  set
    status = 'pending'::public.approval_status,
    priority_score = target_priority_score,
    last_decision_id = null,
    last_reviewed_by = null,
    last_reviewed_at = null
  where queue.workspace_id = queue_row.workspace_id
    and queue.id = queue_row.id
  returning * into queue_row;

  perform app_private.add_capture_review_note(
    queue_row.workspace_id,
    queue_row.id,
    queue_row.offer_id,
    actor_id,
    'reopened',
    normalized_reason,
    normalized_capture_run_id,
    normalized_correlation_id,
    current_timestamp
  );

  return query
  select
    queue_row.id,
    queue_row.offer_id,
    queue_row.status,
    true,
    'reopened'::text;
end;
$$;

create or replace function app_private.add_capture_review_note(
  target_workspace_id uuid,
  target_queue_id uuid,
  target_offer_id uuid,
  actor_id uuid,
  target_action text,
  target_reason text,
  target_capture_run_id text,
  target_correlation_id text,
  target_created_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  note_body text;
begin
  note_body := concat_ws(
    ' | ',
    'Captura encaminhada para curadoria',
    'action=' || coalesce(target_action, 'unknown'),
    'reason=' || coalesce(target_reason, 'not_provided'),
    'captureRunId=' || coalesce(target_capture_run_id, 'not_provided'),
    'correlationId=' || coalesce(target_correlation_id, 'not_provided')
  );

  insert into public.review_notes (
    workspace_id,
    queue_id,
    offer_id,
    body,
    created_by,
    created_at
  )
  values (
    target_workspace_id,
    target_queue_id,
    target_offer_id,
    note_body,
    actor_id,
    target_created_at
  );
end;
$$;

revoke all on function public.submit_capture_for_review(
  uuid,
  integer,
  text,
  text,
  text
) from public, anon, authenticated;

grant execute on function public.submit_capture_for_review(
  uuid,
  integer,
  text,
  text,
  text
) to authenticated;

revoke all on function app_private.add_capture_review_note(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  timestamptz
) from public, anon, authenticated;
