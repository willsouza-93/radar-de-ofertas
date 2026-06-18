revoke all on table public.approval_queue from anon;
revoke all on table public.approval_decisions from anon;
revoke all on table public.review_notes from anon;

revoke all on table public.approval_queue from authenticated;
revoke all on table public.approval_decisions from authenticated;
revoke all on table public.review_notes from authenticated;

grant select, insert, update on table public.approval_queue to authenticated;
grant select, insert on table public.approval_decisions to authenticated;
grant select, insert on table public.review_notes to authenticated;

revoke all on type public.approval_status from public, anon, authenticated;
revoke all on type public.approval_decision_type from public, anon, authenticated;
grant usage on type public.approval_status to authenticated;
grant usage on type public.approval_decision_type to authenticated;
