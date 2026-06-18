create table public.approval_queue (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  offer_id uuid not null,
  status public.approval_status not null default 'pending',
  priority_score smallint not null,
  last_decision_id uuid,
  last_reviewed_by uuid references public.profiles(id) on delete set null,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_queue_workspace_id_id_unique unique (workspace_id, id),
  constraint approval_queue_workspace_offer_unique unique (workspace_id, offer_id),
  constraint approval_queue_workspace_offer_fk foreign key (workspace_id, offer_id)
    references public.offers(workspace_id, id) on delete cascade,
  constraint approval_queue_priority_score_range check (priority_score between 0 and 100),
  constraint approval_queue_last_review_pair check (
    (last_reviewed_by is null and last_reviewed_at is null)
    or (last_reviewed_by is not null and last_reviewed_at is not null)
  )
);

create table public.approval_decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  queue_id uuid not null,
  offer_id uuid not null,
  decision public.approval_decision_type not null,
  previous_status public.approval_status not null,
  next_status public.approval_status not null,
  reason text,
  decided_by uuid not null references public.profiles(id) on delete restrict,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint approval_decisions_workspace_id_id_unique unique (workspace_id, id),
  constraint approval_decisions_workspace_queue_fk foreign key (workspace_id, queue_id)
    references public.approval_queue(workspace_id, id) on delete cascade,
  constraint approval_decisions_workspace_offer_fk foreign key (workspace_id, offer_id)
    references public.offers(workspace_id, id) on delete cascade,
  constraint approval_decisions_previous_status_pending check (previous_status = 'pending'),
  constraint approval_decisions_next_status_matches_decision check (
    (decision = 'approved' and next_status = 'approved')
    or (decision = 'rejected' and next_status = 'rejected')
  ),
  constraint approval_decisions_reason_required_for_rejection check (
    (decision = 'rejected' and reason is not null and char_length(trim(reason)) between 3 and 2000)
    or (decision = 'approved' and (reason is null or char_length(trim(reason)) between 3 and 2000))
  )
);

alter table public.approval_queue
  add constraint approval_queue_last_decision_fk foreign key (workspace_id, last_decision_id)
    references public.approval_decisions(workspace_id, id);

create table public.review_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  queue_id uuid not null,
  offer_id uuid not null,
  body text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint review_notes_workspace_queue_fk foreign key (workspace_id, queue_id)
    references public.approval_queue(workspace_id, id) on delete cascade,
  constraint review_notes_workspace_offer_fk foreign key (workspace_id, offer_id)
    references public.offers(workspace_id, id) on delete cascade,
  constraint review_notes_body_length check (char_length(trim(body)) between 1 and 2000)
);
