create index approval_queue_workspace_status_priority_idx
  on public.approval_queue (workspace_id, status, priority_score desc, created_at desc);

create index approval_queue_workspace_offer_idx
  on public.approval_queue (workspace_id, offer_id);

create index approval_queue_workspace_updated_idx
  on public.approval_queue (workspace_id, updated_at desc);

create index approval_queue_workspace_last_reviewed_idx
  on public.approval_queue (workspace_id, last_reviewed_by, last_reviewed_at desc)
  where last_reviewed_by is not null;

create index approval_decisions_workspace_queue_decided_idx
  on public.approval_decisions (workspace_id, queue_id, decided_at desc);

create index approval_decisions_workspace_offer_decided_idx
  on public.approval_decisions (workspace_id, offer_id, decided_at desc);

create index approval_decisions_workspace_decision_decided_idx
  on public.approval_decisions (workspace_id, decision, decided_at desc);

create index approval_decisions_workspace_decided_by_idx
  on public.approval_decisions (workspace_id, decided_by, decided_at desc);

create index review_notes_workspace_queue_created_idx
  on public.review_notes (workspace_id, queue_id, created_at desc);

create index review_notes_workspace_offer_created_idx
  on public.review_notes (workspace_id, offer_id, created_at desc);

create index review_notes_workspace_created_by_idx
  on public.review_notes (workspace_id, created_by, created_at desc);

create trigger approval_queue_set_updated_at
before update on public.approval_queue
for each row execute function app_private.set_updated_at();
