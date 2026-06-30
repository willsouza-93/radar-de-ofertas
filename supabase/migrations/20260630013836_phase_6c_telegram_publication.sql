create type public.publication_candidate_status as enum (
  'created',
  'blocked',
  'queued'
);

create type public.publication_job_status as enum (
  'requested',
  'processing',
  'succeeded',
  'failed',
  'paused',
  'cancelled'
);

create type public.publication_attempt_result as enum (
  'success',
  'transient_failure',
  'permanent_failure',
  'rate_limited',
  'ambiguous'
);

alter table public.approval_queue
  add constraint approval_queue_workspace_id_id_offer_unique unique (workspace_id, id, offer_id);

alter table public.approval_decisions
  add constraint approval_decisions_workspace_id_id_queue_offer_unique unique (
    workspace_id,
    id,
    queue_id,
    offer_id
  );

create table public.publication_candidates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  offer_id uuid not null,
  approval_queue_id uuid not null,
  approval_decision_id uuid not null,
  snapshot_id bigint,
  snapshot_version text not null,
  target_channel text not null,
  target_key text not null,
  template_id text not null,
  content_version text not null,
  status public.publication_candidate_status not null default 'created',
  idempotency_key text not null,
  snapshot_payload jsonb not null,
  blocked_reason text,
  safe_message text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publication_candidates_workspace_id_id_unique unique (workspace_id, id),
  constraint publication_candidates_workspace_offer_fk foreign key (workspace_id, offer_id)
    references public.offers(workspace_id, id) on delete cascade,
  constraint publication_candidates_workspace_queue_fk foreign key (workspace_id, approval_queue_id)
    references public.approval_queue(workspace_id, id) on delete restrict,
  constraint publication_candidates_workspace_decision_fk foreign key (workspace_id, approval_decision_id)
    references public.approval_decisions(workspace_id, id) on delete restrict,
  constraint publication_candidates_current_decision_fk foreign key (
    workspace_id,
    approval_decision_id,
    approval_queue_id,
    offer_id
  ) references public.approval_decisions(workspace_id, id, queue_id, offer_id) on delete restrict,
  constraint publication_candidates_queue_offer_fk foreign key (workspace_id, approval_queue_id, offer_id)
    references public.approval_queue(workspace_id, id, offer_id) on delete restrict,
  constraint publication_candidates_workspace_idempotency_unique unique (workspace_id, idempotency_key),
  constraint publication_candidates_telegram_target check (
    target_channel = 'telegram'
    and target_key = 'telegram-default'
    and template_id = 'telegram-mvp-v1'
    and content_version = 'telegram-mvp-v1'
  ),
  constraint publication_candidates_snapshot_version_not_blank check (char_length(trim(snapshot_version)) > 0),
  constraint publication_candidates_idempotency_not_blank check (char_length(trim(idempotency_key)) > 0),
  constraint publication_candidates_payload_object check (jsonb_typeof(snapshot_payload) = 'object')
);

create table public.publication_redirect_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  candidate_id uuid not null,
  short_code text not null unique,
  destination_url text not null,
  status text not null default 'active',
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint publication_redirect_links_workspace_id_id_unique unique (workspace_id, id),
  constraint publication_redirect_links_workspace_candidate_unique unique (workspace_id, candidate_id),
  constraint publication_redirect_links_workspace_candidate_fk foreign key (workspace_id, candidate_id)
    references public.publication_candidates(workspace_id, id) on delete restrict,
  constraint publication_redirect_links_short_code_format check (short_code ~ '^[A-Za-z0-9_-]{16,40}$'),
  constraint publication_redirect_links_status check (status in ('active', 'disabled')),
  constraint publication_redirect_links_destination_http check (destination_url ~* '^https?://')
);

create table public.publication_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  candidate_id uuid not null,
  redirect_link_id uuid not null,
  status public.publication_job_status not null default 'requested',
  idempotency_key text not null,
  target_channel text not null,
  target_key text not null,
  template_id text not null,
  content_version text not null,
  rendered_message_text text,
  rendered_message_metadata jsonb not null default '{}'::jsonb,
  correlation_id text not null,
  publication_run_id text,
  attempt_count integer not null default 0,
  external_message_id text,
  failure_code text,
  failure_category text,
  safe_message text not null default 'Publicacao solicitada.',
  retry_after_seconds integer,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  claimed_by uuid references public.profiles(id) on delete restrict,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint publication_jobs_workspace_id_id_unique unique (workspace_id, id),
  constraint publication_jobs_workspace_candidate_unique unique (workspace_id, candidate_id),
  constraint publication_jobs_workspace_idempotency_unique unique (workspace_id, idempotency_key),
  constraint publication_jobs_workspace_candidate_fk foreign key (workspace_id, candidate_id)
    references public.publication_candidates(workspace_id, id) on delete restrict,
  constraint publication_jobs_workspace_redirect_fk foreign key (workspace_id, redirect_link_id)
    references public.publication_redirect_links(workspace_id, id) on delete restrict,
  constraint publication_jobs_telegram_target check (
    target_channel = 'telegram'
    and target_key = 'telegram-default'
    and template_id = 'telegram-mvp-v1'
    and content_version = 'telegram-mvp-v1'
  ),
  constraint publication_jobs_attempt_count_non_negative check (attempt_count >= 0),
  constraint publication_jobs_retry_after_non_negative check (
    retry_after_seconds is null or retry_after_seconds >= 0
  ),
  constraint publication_jobs_rendered_message_limit check (
    rendered_message_text is null or char_length(rendered_message_text) between 1 and 4096
  ),
  constraint publication_jobs_processing_claim_pair check (
    (status <> 'processing'::public.publication_job_status)
    or (claimed_by is not null and claimed_at is not null and publication_run_id is not null)
  )
);

create table public.publication_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  job_id uuid not null,
  candidate_id uuid not null,
  attempt_number integer not null,
  result public.publication_attempt_result not null,
  external_message_id text,
  provider_request_id text,
  failure_code text,
  failure_category text,
  safe_message text not null,
  retry_after_seconds integer,
  publication_run_id text,
  correlation_id text not null,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint publication_attempts_workspace_id_id_unique unique (workspace_id, id),
  constraint publication_attempts_workspace_job_attempt_unique unique (workspace_id, job_id, attempt_number),
  constraint publication_attempts_workspace_job_fk foreign key (workspace_id, job_id)
    references public.publication_jobs(workspace_id, id) on delete restrict,
  constraint publication_attempts_workspace_candidate_fk foreign key (workspace_id, candidate_id)
    references public.publication_candidates(workspace_id, id) on delete restrict,
  constraint publication_attempts_attempt_positive check (attempt_number > 0),
  constraint publication_attempts_retry_after_non_negative check (
    retry_after_seconds is null or retry_after_seconds >= 0
  ),
  constraint publication_attempts_success_external_id check (
    result <> 'success'::public.publication_attempt_result
    or external_message_id is not null
  )
);

create index publication_candidates_workspace_offer_created_idx
  on public.publication_candidates (workspace_id, offer_id, created_at desc);

create index publication_candidates_workspace_status_idx
  on public.publication_candidates (workspace_id, status, created_at desc);

create index publication_jobs_workspace_status_created_idx
  on public.publication_jobs (workspace_id, status, created_at desc);

create index publication_jobs_workspace_offer_lookup_idx
  on public.publication_jobs (workspace_id, candidate_id, created_at desc);

create index publication_attempts_workspace_job_recorded_idx
  on public.publication_attempts (workspace_id, job_id, recorded_at desc);

create trigger publication_candidates_set_updated_at
before update on public.publication_candidates
for each row execute function app_private.set_updated_at();

create trigger publication_jobs_set_updated_at
before update on public.publication_jobs
for each row execute function app_private.set_updated_at();

create or replace function app_private.prevent_publication_attempt_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'publication attempts are append-only'
    using errcode = '42501';
end;
$$;

create trigger publication_attempts_prevent_update
before update on public.publication_attempts
for each row execute function app_private.prevent_publication_attempt_mutation();

create trigger publication_attempts_prevent_delete
before delete on public.publication_attempts
for each row execute function app_private.prevent_publication_attempt_mutation();

alter table public.publication_candidates enable row level security;
alter table public.publication_jobs enable row level security;
alter table public.publication_attempts enable row level security;
alter table public.publication_redirect_links enable row level security;

create policy publication_candidates_select_curator
on public.publication_candidates
for select
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy publication_jobs_select_curator
on public.publication_jobs
for select
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy publication_attempts_select_curator
on public.publication_attempts
for select
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

create policy publication_redirect_links_select_curator
on public.publication_redirect_links
for select
to authenticated
using ((select app_private.has_role(
  workspace_id,
  array['admin'::public.app_role, 'editor'::public.app_role]
)));

revoke all on table public.publication_candidates from anon, authenticated;
revoke all on table public.publication_jobs from anon, authenticated;
revoke all on table public.publication_attempts from anon, authenticated;
revoke all on table public.publication_redirect_links from anon, authenticated;

grant select on table public.publication_candidates to authenticated;
grant select on table public.publication_jobs to authenticated;
grant select on table public.publication_attempts to authenticated;
grant select on table public.publication_redirect_links to authenticated;

revoke all on type public.publication_candidate_status from public, anon, authenticated;
revoke all on type public.publication_job_status from public, anon, authenticated;
revoke all on type public.publication_attempt_result from public, anon, authenticated;
grant usage on type public.publication_candidate_status to authenticated;
grant usage on type public.publication_job_status to authenticated;
grant usage on type public.publication_attempt_result to authenticated;

create or replace function app_private.is_allowed_publication_destination_url(target_url text)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  parsed_host text;
begin
  if target_url is null or char_length(trim(target_url)) > 2048 then
    return false;
  end if;

  if target_url !~* '^https?://[^[:space:]/?#]+[^[:space:]]*$' then
    return false;
  end if;

  parsed_host := lower(substring(target_url from '^https?://([^/@:?#]+)'));
  if parsed_host is null or parsed_host in ('localhost', '127.0.0.1', '0.0.0.0') then
    return false;
  end if;

  if target_url ~* '^https?://[^/]*@' then
    return false;
  end if;

  return true;
end;
$$;

create or replace function app_private.generate_publication_short_code()
returns text
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  generated_code text;
begin
  loop
    generated_code := substring(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') from 1 for 22);
    exit when not exists (
      select 1
      from public.publication_redirect_links as link
      where link.short_code = generated_code
    );
  end loop;

  return generated_code;
end;
$$;

create or replace function public.request_telegram_publication(target_offer_id uuid)
returns table (
  candidate_id uuid,
  job_id uuid,
  job_status public.publication_job_status,
  action text,
  redirect_url text,
  snapshot_payload jsonb,
  approval_decision_id uuid,
  idempotency_key text,
  safe_message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  offer_row public.offers%rowtype;
  queue_row public.approval_queue%rowtype;
  decision_row public.approval_decisions%rowtype;
  latest_snapshot public.price_snapshots%rowtype;
  candidate_row public.publication_candidates%rowtype;
  redirect_row public.publication_redirect_links%rowtype;
  job_row public.publication_jobs%rowtype;
  current_timestamp timestamptz := now();
  target_template_id text := 'telegram-mvp-v1';
  target_key text := 'telegram-default';
  target_channel text := 'telegram';
  computed_snapshot_version text;
  computed_idempotency_key text;
  computed_payload jsonb;
  computed_short_code text;
  computed_redirect_url text;
  app_url text := nullif(trim(current_setting('app.settings.app_url', true)), '');
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if target_offer_id is null then
    raise exception 'offer id is required'
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

  if not found or queue_row.status <> 'approved'::public.approval_status or queue_row.last_decision_id is null then
    raise exception 'offer is not currently approved'
      using errcode = '23514';
  end if;

  select *
  into decision_row
  from public.approval_decisions as decision
  where decision.workspace_id = queue_row.workspace_id
    and decision.id = queue_row.last_decision_id
    and decision.queue_id = queue_row.id
    and decision.offer_id = queue_row.offer_id
  for share;

  if not found or decision_row.decision <> 'approved'::public.approval_decision_type then
    raise exception 'current approval decision is not publishable'
      using errcode = '23514';
  end if;

  if not app_private.is_allowed_publication_destination_url(offer_row.affiliate_url) then
    raise exception 'offer does not have a valid affiliate destination'
      using errcode = '23514';
  end if;

  select *
  into latest_snapshot
  from public.price_snapshots as snapshot
  where snapshot.workspace_id = offer_row.workspace_id
    and snapshot.offer_id = offer_row.id
  order by snapshot.observed_at desc, snapshot.id desc
  limit 1;

  computed_snapshot_version := case
    when found then 'price-snapshot:' || latest_snapshot.id::text
    else 'offer-updated-at:' || extract(epoch from offer_row.updated_at)::bigint::text
  end;

  computed_idempotency_key := concat_ws(
    ':',
    'publication',
    offer_row.workspace_id::text,
    offer_row.id::text,
    target_key,
    decision_row.id::text,
    computed_snapshot_version,
    target_template_id
  );

  computed_payload := jsonb_build_object(
    'workspaceId', offer_row.workspace_id,
    'offerId', offer_row.id,
    'title', offer_row.title,
    'currentPrice', offer_row.current_price,
    'previousPrice', offer_row.previous_price,
    'currency', offer_row.currency,
    'discountPercent', offer_row.discount_percent,
    'couponCode', offer_row.coupon_code,
    'freeShipping', offer_row.free_shipping,
    'commissionPercent', offer_row.commission_percent,
    'highlights', offer_row.highlights,
    'sourceUrl', offer_row.source_url,
    'affiliateUrl', offer_row.affiliate_url,
    'snapshotVersion', computed_snapshot_version,
    'capturedAt', offer_row.captured_at
  );

  insert into public.publication_candidates (
    workspace_id,
    offer_id,
    approval_queue_id,
    approval_decision_id,
    snapshot_id,
    snapshot_version,
    target_channel,
    target_key,
    template_id,
    content_version,
    status,
    idempotency_key,
    snapshot_payload,
    safe_message,
    created_by,
    created_at,
    updated_at
  )
  values (
    offer_row.workspace_id,
    offer_row.id,
    queue_row.id,
    decision_row.id,
    case when latest_snapshot.id is null then null else latest_snapshot.id end,
    computed_snapshot_version,
    target_channel,
    target_key,
    target_template_id,
    target_template_id,
    'queued'::public.publication_candidate_status,
    computed_idempotency_key,
    computed_payload,
    'Publicacao Telegram solicitada.',
    actor_id,
    current_timestamp,
    current_timestamp
  )
  on conflict on constraint publication_candidates_workspace_idempotency_unique do update
  set updated_at = public.publication_candidates.updated_at
  returning * into candidate_row;

  select *
  into redirect_row
  from public.publication_redirect_links as link
  where link.workspace_id = candidate_row.workspace_id
    and link.candidate_id = candidate_row.id
  for update;

  if not found then
    computed_short_code := app_private.generate_publication_short_code();
    insert into public.publication_redirect_links (
      workspace_id,
      candidate_id,
      short_code,
      destination_url,
      status,
      created_by,
      created_at
    )
    values (
      candidate_row.workspace_id,
      candidate_row.id,
      computed_short_code,
      offer_row.affiliate_url,
      'active',
      actor_id,
      current_timestamp
    )
    returning * into redirect_row;
  end if;

  insert into public.publication_jobs (
    workspace_id,
    candidate_id,
    redirect_link_id,
    status,
    idempotency_key,
    target_channel,
    target_key,
    template_id,
    content_version,
    correlation_id,
    requested_by,
    safe_message,
    created_at,
    updated_at
  )
  values (
    candidate_row.workspace_id,
    candidate_row.id,
    redirect_row.id,
    'requested'::public.publication_job_status,
    candidate_row.idempotency_key,
    target_channel,
    target_key,
    target_template_id,
    target_template_id,
    'publication-' || gen_random_uuid()::text,
    actor_id,
    'Publicacao Telegram solicitada.',
    current_timestamp,
    current_timestamp
  )
  on conflict on constraint publication_jobs_workspace_candidate_unique do update
  set updated_at = public.publication_jobs.updated_at
  returning * into job_row;

  computed_redirect_url := coalesce(app_url, 'http://localhost:3000') || '/r/' || redirect_row.short_code;

  return query
  select
    candidate_row.id,
    job_row.id,
    job_row.status,
    case when job_row.created_at = current_timestamp then 'created' else 'existing' end,
    computed_redirect_url,
    candidate_row.snapshot_payload,
    candidate_row.approval_decision_id,
    candidate_row.idempotency_key,
    job_row.safe_message;
end;
$$;

create or replace function public.claim_telegram_publication_job(
  target_job_id uuid,
  target_rendered_message_text text,
  target_rendered_message_metadata jsonb default '{}'::jsonb,
  target_publication_run_id text default null
)
returns table (
  job_id uuid,
  job_status public.publication_job_status,
  rendered_message_text text,
  idempotency_key text,
  correlation_id text,
  publication_run_id text,
  safe_message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_row public.publication_jobs%rowtype;
  normalized_run_id text := coalesce(nullif(trim(target_publication_run_id), ''), 'telegram-run-' || gen_random_uuid()::text);
  normalized_metadata jsonb := coalesce(target_rendered_message_metadata, '{}'::jsonb);
  current_timestamp timestamptz := now();
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  if target_job_id is null then
    raise exception 'job id is required'
      using errcode = '23514';
  end if;

  if target_rendered_message_text is null
    or char_length(trim(target_rendered_message_text)) not between 1 and 4096 then
    raise exception 'rendered message is invalid'
      using errcode = '23514';
  end if;

  select *
  into job_row
  from public.publication_jobs as job
  where job.id = target_job_id
  for update;

  if not found then
    raise exception 'publication job not found'
      using errcode = 'P0002';
  end if;

  if not app_private.has_role(
    job_row.workspace_id,
    array['admin'::public.app_role]
  ) then
    raise exception 'insufficient workspace permission'
      using errcode = '42501';
  end if;

  if job_row.status in (
    'processing'::public.publication_job_status,
    'succeeded'::public.publication_job_status,
    'failed'::public.publication_job_status,
    'paused'::public.publication_job_status,
    'cancelled'::public.publication_job_status
  ) then
    raise exception 'publication job cannot be claimed'
      using errcode = '40001';
  end if;

  if exists (
    select 1
    from public.publication_attempts as attempt
    where attempt.workspace_id = job_row.workspace_id
      and attempt.job_id = job_row.id
      and attempt.result = 'success'::public.publication_attempt_result
  ) then
    raise exception 'successful publication cannot be overwritten'
      using errcode = '40001';
  end if;

  update public.publication_jobs as job
  set
    status = 'processing'::public.publication_job_status,
    rendered_message_text = target_rendered_message_text,
    rendered_message_metadata = normalized_metadata,
    publication_run_id = normalized_run_id,
    claimed_by = actor_id,
    claimed_at = current_timestamp,
    safe_message = 'Publicacao Telegram em processamento.'
  where job.workspace_id = job_row.workspace_id
    and job.id = job_row.id
  returning * into job_row;

  return query
  select
    job_row.id,
    job_row.status,
    job_row.rendered_message_text,
    job_row.idempotency_key,
    job_row.correlation_id,
    job_row.publication_run_id,
    job_row.safe_message;
end;
$$;

create or replace function public.record_telegram_publication_result(
  target_job_id uuid,
  target_result public.publication_attempt_result,
  target_external_message_id text default null,
  target_provider_request_id text default null,
  target_failure_code text default null,
  target_failure_category text default null,
  target_safe_message text default null,
  target_retry_after_seconds integer default null,
  target_metadata jsonb default '{}'::jsonb
)
returns table (
  job_id uuid,
  job_status public.publication_job_status,
  attempt_id uuid,
  attempt_number integer,
  result public.publication_attempt_result,
  safe_message text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := (select auth.uid());
  job_row public.publication_jobs%rowtype;
  attempt_row public.publication_attempts%rowtype;
  next_attempt_number integer;
  next_status public.publication_job_status;
  normalized_safe_message text := nullif(trim(target_safe_message), '');
  current_timestamp timestamptz := now();
begin
  if actor_id is null then
    raise exception 'authentication required'
      using errcode = '42501';
  end if;

  select *
  into job_row
  from public.publication_jobs as job
  where job.id = target_job_id
  for update;

  if not found then
    raise exception 'publication job not found'
      using errcode = 'P0002';
  end if;

  if not app_private.has_role(
    job_row.workspace_id,
    array['admin'::public.app_role]
  ) then
    raise exception 'insufficient workspace permission'
      using errcode = '42501';
  end if;

  if job_row.status = 'succeeded'::public.publication_job_status
    or exists (
      select 1
      from public.publication_attempts as attempt
      where attempt.workspace_id = job_row.workspace_id
        and attempt.job_id = job_row.id
        and attempt.result = 'success'::public.publication_attempt_result
    ) then
    raise exception 'successful publication cannot be overwritten'
      using errcode = '40001';
  end if;

  if job_row.status <> 'processing'::public.publication_job_status then
    raise exception 'publication job is not processing'
      using errcode = '40001';
  end if;

  if target_result = 'success'::public.publication_attempt_result
    and nullif(trim(target_external_message_id), '') is null then
    raise exception 'external message id is required for success'
      using errcode = '23514';
  end if;

  if target_retry_after_seconds is not null and target_retry_after_seconds < 0 then
    raise exception 'retry after must be non-negative'
      using errcode = '23514';
  end if;

  next_attempt_number := job_row.attempt_count + 1;
  next_status := case
    when target_result = 'success'::public.publication_attempt_result then 'succeeded'::public.publication_job_status
    when target_result = 'ambiguous'::public.publication_attempt_result then 'paused'::public.publication_job_status
    else 'failed'::public.publication_job_status
  end;

  normalized_safe_message := coalesce(
    normalized_safe_message,
    case
      when target_result = 'success'::public.publication_attempt_result then 'Publicacao enviada com sucesso.'
      when target_result = 'rate_limited'::public.publication_attempt_result then 'Telegram limitou temporariamente a publicacao.'
      when target_result = 'ambiguous'::public.publication_attempt_result then 'Resultado ambiguo. Revisao manual necessaria antes de nova tentativa.'
      when target_result = 'transient_failure'::public.publication_attempt_result then 'Falha transitoria ao publicar no Telegram.'
      else 'Falha permanente ao publicar no Telegram.'
    end
  );

  insert into public.publication_attempts (
    workspace_id,
    job_id,
    candidate_id,
    attempt_number,
    result,
    external_message_id,
    provider_request_id,
    failure_code,
    failure_category,
    safe_message,
    retry_after_seconds,
    publication_run_id,
    correlation_id,
    recorded_by,
    recorded_at,
    metadata
  )
  values (
    job_row.workspace_id,
    job_row.id,
    job_row.candidate_id,
    next_attempt_number,
    target_result,
    nullif(trim(target_external_message_id), ''),
    nullif(trim(target_provider_request_id), ''),
    nullif(trim(target_failure_code), ''),
    nullif(trim(target_failure_category), ''),
    normalized_safe_message,
    target_retry_after_seconds,
    job_row.publication_run_id,
    job_row.correlation_id,
    actor_id,
    current_timestamp,
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning * into attempt_row;

  update public.publication_jobs as job
  set
    status = next_status,
    attempt_count = next_attempt_number,
    external_message_id = attempt_row.external_message_id,
    failure_code = attempt_row.failure_code,
    failure_category = attempt_row.failure_category,
    safe_message = normalized_safe_message,
    retry_after_seconds = attempt_row.retry_after_seconds,
    completed_at = current_timestamp
  where job.workspace_id = job_row.workspace_id
    and job.id = job_row.id
  returning * into job_row;

  return query
  select
    job_row.id,
    job_row.status,
    attempt_row.id,
    attempt_row.attempt_number,
    attempt_row.result,
    attempt_row.safe_message;
end;
$$;

create or replace function public.resolve_publication_redirect(target_short_code text)
returns table (
  destination_url text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_short_code text := nullif(trim(target_short_code), '');
begin
  if normalized_short_code is null or normalized_short_code !~ '^[A-Za-z0-9_-]{16,40}$' then
    return;
  end if;

  return query
  select link.destination_url
  from public.publication_redirect_links as link
  where link.short_code = normalized_short_code
    and link.status = 'active'
    and app_private.is_allowed_publication_destination_url(link.destination_url)
  limit 1;
end;
$$;

revoke all on function app_private.prevent_publication_attempt_mutation() from public, anon, authenticated;
revoke all on function app_private.is_allowed_publication_destination_url(text) from public, anon, authenticated;
revoke all on function app_private.generate_publication_short_code() from public, anon, authenticated;

revoke all on function public.request_telegram_publication(uuid) from public, anon, authenticated;
revoke all on function public.claim_telegram_publication_job(uuid, text, jsonb, text) from public, anon, authenticated;
revoke all on function public.record_telegram_publication_result(
  uuid,
  public.publication_attempt_result,
  text,
  text,
  text,
  text,
  text,
  integer,
  jsonb
) from public, anon, authenticated;
revoke all on function public.resolve_publication_redirect(text) from public, anon, authenticated;

grant execute on function public.request_telegram_publication(uuid) to authenticated;
grant execute on function public.claim_telegram_publication_job(uuid, text, jsonb, text) to authenticated;
grant execute on function public.record_telegram_publication_result(
  uuid,
  public.publication_attempt_result,
  text,
  text,
  text,
  text,
  text,
  integer,
  jsonb
) to authenticated;
grant execute on function public.resolve_publication_redirect(text) to anon, authenticated;
