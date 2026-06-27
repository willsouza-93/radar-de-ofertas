begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

insert into public.offers (
  id,
  workspace_id,
  marketplace,
  external_id,
  dedupe_key,
  source_url,
  affiliate_url,
  title,
  current_price,
  currency,
  score,
  score_version,
  score_factors,
  created_by,
  updated_by
)
values
  (
    '41000000-0000-0000-0000-000000005101',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'phase-5c1-new',
    'manual:external:phase-5c1-new',
    'https://example.test/phase-5c1-new',
    'https://affiliate.example.test/phase-5c1-new',
    'Oferta nova para RPC de captura',
    199.90,
    'BRL',
    81,
    'capture-structure-v1',
    '{"version":"capture-structure-v1","factors":[]}'::jsonb,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '41000000-0000-0000-0000-000000005102',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'phase-5c1-approved',
    'manual:external:phase-5c1-approved',
    'https://example.test/phase-5c1-approved',
    'https://affiliate.example.test/phase-5c1-approved',
    'Oferta aprovada para cooldown',
    299.90,
    'BRL',
    78,
    'capture-structure-v1',
    '{"version":"capture-structure-v1","factors":[]}'::jsonb,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '41000000-0000-0000-0000-000000005103',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'phase-5c1-rejected',
    'manual:external:phase-5c1-rejected',
    'https://example.test/phase-5c1-rejected',
    'https://affiliate.example.test/phase-5c1-rejected',
    'Oferta rejeitada para mudanca material',
    89.90,
    'BRL',
    66,
    'capture-structure-v1',
    '{"version":"capture-structure-v1","factors":[]}'::jsonb,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  )
on conflict (id) do nothing;

insert into public.approval_queue (
  id,
  workspace_id,
  offer_id,
  status,
  priority_score,
  created_at,
  updated_at
)
values
  (
    '51000000-0000-0000-0000-000000005102',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '41000000-0000-0000-0000-000000005102',
    'pending',
    78,
    '2026-06-25T10:00:00Z',
    '2026-06-25T10:00:00Z'
  ),
  (
    '51000000-0000-0000-0000-000000005103',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '41000000-0000-0000-0000-000000005103',
    'pending',
    66,
    '2026-06-25T10:00:00Z',
    '2026-06-25T10:00:00Z'
  )
on conflict (id) do nothing;

insert into public.approval_decisions (
  id,
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
values
  (
    '61000000-0000-0000-0000-000000005102',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '51000000-0000-0000-0000-000000005102',
    '41000000-0000-0000-0000-000000005102',
    'approved',
    'pending',
    'approved',
    null,
    '10000000-0000-0000-0000-000000000001',
    '2026-06-25T10:30:00Z',
    '2026-06-25T10:30:00Z'
  ),
  (
    '61000000-0000-0000-0000-000000005103',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '51000000-0000-0000-0000-000000005103',
    '41000000-0000-0000-0000-000000005103',
    'rejected',
    'pending',
    'rejected',
    'Preco suspeito.',
    '10000000-0000-0000-0000-000000000001',
    '2026-06-25T10:30:00Z',
    '2026-06-25T10:30:00Z'
  )
on conflict (id) do nothing;

update public.approval_queue
set
  status = 'approved',
  last_decision_id = '61000000-0000-0000-0000-000000005102',
  last_reviewed_by = '10000000-0000-0000-0000-000000000001',
  last_reviewed_at = '2026-06-25T10:30:00Z',
  updated_at = '2026-06-25T10:30:00Z'
where id = '51000000-0000-0000-0000-000000005102';

update public.approval_queue
set
  status = 'rejected',
  last_decision_id = '61000000-0000-0000-0000-000000005103',
  last_reviewed_by = '10000000-0000-0000-0000-000000000001',
  last_reviewed_at = '2026-06-25T10:30:00Z',
  updated_at = '2026-06-25T10:30:00Z'
where id = '51000000-0000-0000-0000-000000005103';

insert into public.price_snapshots (
  workspace_id,
  offer_id,
  price,
  previous_price,
  discount_percent,
  coupon_code,
  free_shipping,
  observed_at
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '41000000-0000-0000-0000-000000005103',
    99.90,
    129.90,
    23.09,
    null,
    false,
    '2026-06-25T10:00:00Z'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '41000000-0000-0000-0000-000000005103',
    89.90,
    129.90,
    30.79,
    null,
    false,
    '2026-06-27T10:00:00Z'
  );

select ok(
  has_function_privilege(
    'authenticated',
    'public.submit_capture_for_review(uuid, integer, text, text, text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.submit_capture_for_review(uuid, integer, text, text, text)',
    'execute'
  ),
  'submit_capture_for_review is executable only by authenticated clients'
);

select ok(
  pg_get_function_arguments('public.submit_capture_for_review(uuid, integer, text, text, text)'::regprocedure)
    not ilike '%workspace%',
  'submit_capture_for_review does not accept workspaceId from clients'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select queue_status::text, submitted, action
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005101',
      81,
      'new_offer',
      'capture-run-new',
      'correlation-new'
    )$$,
  $$values ('pending'::text, true, 'created'::text)$$,
  'Admin A creates pending approval queue for a new captured offer'
);

select results_eq(
  $$select count(*)::bigint
    from public.approval_queue
    where workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and offer_id = '41000000-0000-0000-0000-000000005101'
      and status = 'pending'$$,
  array[1::bigint],
  'A captured offer has at most one pending approval queue'
);

select results_eq(
  $$select count(*)::bigint
    from public.review_notes
    where offer_id = '41000000-0000-0000-0000-000000005101'
      and created_by = '10000000-0000-0000-0000-000000000001'
      and body like '%captureRunId=capture-run-new%'
      and body like '%correlationId=correlation-new%'$$,
  array[1::bigint],
  'Capture submission records an operational review note with audit metadata'
);

select results_eq(
  $$select queue_id::text, queue_status::text, submitted, action
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005101',
      90,
      'already_pending',
      'capture-run-duplicate',
      'correlation-duplicate'
    )$$,
  $$select id::text, 'pending'::text, false, 'already_pending'::text
    from public.approval_queue
    where offer_id = '41000000-0000-0000-0000-000000005101'$$,
  'Repeated capture returns the existing pending queue instead of duplicating it'
);

select results_eq(
  $$select count(*)::bigint
    from public.approval_queue
    where offer_id = '41000000-0000-0000-0000-000000005101'$$,
  array[1::bigint],
  'Multiple submissions keep exactly one approval_queue row per offer/workspace'
);

select results_eq(
  $$select queue_status::text, submitted, action
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005102',
      78,
      'cooldown_not_elapsed',
      'capture-run-cooldown-blocked',
      'correlation-cooldown-blocked'
    )$$,
  $$values ('approved'::text, false, 'not_reentered'::text)$$,
  'Approved offer does not reenter review when editorial cooldown is not elapsed'
);

select results_eq(
  $$select queue_status::text, submitted, action
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005102',
      78,
      'material_change',
      'capture-run-material-without-snapshot',
      'correlation-material-without-snapshot'
    )$$,
  $$values ('approved'::text, false, 'not_reentered'::text)$$,
  'Terminal queue does not trust material_change without persisted snapshot evidence'
);

select results_eq(
  $$select queue_status::text, submitted, action
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005102',
      79,
      'cooldown_elapsed',
      'capture-run-cooldown',
      'correlation-cooldown'
    )$$,
  $$values ('pending'::text, true, 'reopened'::text)$$,
  'Approved offer reenters review when editorial cooldown is elapsed'
);

select results_eq(
  $$select status::text, last_decision_id is null, last_reviewed_by is null, last_reviewed_at is null
    from public.approval_queue
    where id = '51000000-0000-0000-0000-000000005102'$$,
  $$values ('pending'::text, true, true, true)$$,
  'Reopened queue clears terminal status pointers without deleting decision history'
);

select results_eq(
  $$select count(*)::bigint
    from public.approval_decisions
    where queue_id = '51000000-0000-0000-0000-000000005102'$$,
  array[1::bigint],
  'Capture submission never creates approval_decisions'
);

select results_eq(
  $$select queue_status::text, submitted, action
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005103',
      95,
      'material_change',
      'capture-run-material',
      'correlation-material'
    )$$,
  $$values ('pending'::text, true, 'reopened'::text)$$,
  'Rejected offer reenters review when material change is detected'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$select *
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005101',
      81,
      'new_offer',
      'capture-run-editor',
      'correlation-editor'
    )$$,
  '42501',
  null,
  'Editor A cannot submit captured offer to review'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select throws_ok(
  $$select *
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005101',
      81,
      'new_offer',
      'capture-run-suspended',
      'correlation-suspended'
    )$$,
  '42501',
  null,
  'Suspended user cannot submit captured offer to review'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);

select throws_ok(
  $$select *
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005101',
      81,
      'new_offer',
      'capture-run-other-workspace',
      'correlation-other-workspace'
    )$$,
  '42501',
  null,
  'Admin B cannot submit Workspace A offer to review'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);

select throws_ok(
  $$select *
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005101',
      81,
      'new_offer',
      'capture-run-no-membership',
      'correlation-no-membership'
    )$$,
  '42501',
  null,
  'User without membership cannot submit captured offer to review'
);

reset role;
set local role anon;

select throws_ok(
  $$select *
    from public.submit_capture_for_review(
      '41000000-0000-0000-0000-000000005101',
      81,
      'new_offer',
      'capture-run-anon',
      'correlation-anon'
    )$$,
  '42501',
  null,
  'Anon/Public Visitor cannot execute capture review RPC'
);

reset role;

select * from finish();
rollback;
