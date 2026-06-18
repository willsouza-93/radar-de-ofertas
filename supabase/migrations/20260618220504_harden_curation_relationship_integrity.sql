alter table public.approval_queue
  add constraint approval_queue_workspace_id_offer_unique unique (workspace_id, id, offer_id);

alter table public.approval_decisions
  add constraint approval_decisions_workspace_queue_id_unique unique (workspace_id, queue_id, id),
  add constraint approval_decisions_queue_offer_fk foreign key (workspace_id, queue_id, offer_id)
    references public.approval_queue(workspace_id, id, offer_id) on delete cascade;

alter table public.review_notes
  add constraint review_notes_queue_offer_fk foreign key (workspace_id, queue_id, offer_id)
    references public.approval_queue(workspace_id, id, offer_id) on delete cascade;

alter table public.approval_queue
  add constraint approval_queue_last_decision_queue_fk foreign key (
    workspace_id,
    id,
    last_decision_id
  )
    references public.approval_decisions(workspace_id, queue_id, id);

create or replace function app_private.enforce_approval_queue_insert_pending()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status <> 'pending'::public.approval_status then
    raise exception 'approval_queue rows must be created as pending'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function app_private.enforce_approval_queue_insert_pending()
from public, anon, authenticated;

create trigger approval_queue_insert_pending
before insert on public.approval_queue
for each row execute function app_private.enforce_approval_queue_insert_pending();
