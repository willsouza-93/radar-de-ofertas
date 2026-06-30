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
  previous_price,
  currency,
  discount_percent,
  coupon_code,
  free_shipping,
  score,
  score_version,
  score_factors,
  created_by,
  updated_by
)
values
  (
    '46000000-0000-0000-0000-000000006001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'phase-6c-approved',
    'manual:external:phase-6c-approved',
    'https://example.test/phase-6c-approved',
    'https://affiliate.example.test/phase-6c-approved',
    'Oferta aprovada para Telegram',
    149.90,
    199.90,
    'BRL',
    25.00,
    'PROMO10',
    true,
    88,
    'mvp-v1',
    '{}'::jsonb,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '46000000-0000-0000-0000-000000006002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'phase-6c-rejected',
    'manual:external:phase-6c-rejected',
    'https://example.test/phase-6c-rejected',
    'https://affiliate.example.test/phase-6c-rejected',
    'Oferta rejeitada para Telegram',
    79.90,
    null,
    'BRL',
    null,
    null,
    false,
    30,
    'mvp-v1',
    '{}'::jsonb,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '46000000-0000-0000-0000-000000006003',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'manual',
    'phase-6c-workspace-b',
    'manual:external:phase-6c-workspace-b',
    'https://example.test/phase-6c-workspace-b',
    'https://affiliate.example.test/phase-6c-workspace-b',
    'Oferta de outro workspace',
    59.90,
    null,
    'BRL',
    null,
    null,
    false,
    40,
    'mvp-v1',
    '{}'::jsonb,
    '10000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004'
  );

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
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '46000000-0000-0000-0000-000000006001',
  149.90,
  199.90,
  25.00,
  'PROMO10',
  true,
  '2026-06-30T09:00:00Z'
);

insert into public.approval_queue (
  id,
  workspace_id,
  offer_id,
  status,
  priority_score
)
values
  (
    '56000000-0000-0000-0000-000000006001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '46000000-0000-0000-0000-000000006001',
    'pending',
    88
  ),
  (
    '56000000-0000-0000-0000-000000006002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '46000000-0000-0000-0000-000000006002',
    'pending',
    30
  );

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
    '66000000-0000-0000-0000-000000006001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '56000000-0000-0000-0000-000000006001',
    '46000000-0000-0000-0000-000000006001',
    'approved',
    'pending',
    'approved',
    null,
    '10000000-0000-0000-0000-000000000001',
    '2026-06-30T10:00:00Z',
    '2026-06-30T10:00:00Z'
  ),
  (
    '66000000-0000-0000-0000-000000006002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '56000000-0000-0000-0000-000000006002',
    '46000000-0000-0000-0000-000000006002',
    'rejected',
    'pending',
    'rejected',
    'Oferta sem atratividade.',
    '10000000-0000-0000-0000-000000000001',
    '2026-06-30T10:00:00Z',
    '2026-06-30T10:00:00Z'
  );

update public.approval_queue
set
  status = 'approved',
  last_decision_id = '66000000-0000-0000-0000-000000006001',
  last_reviewed_by = '10000000-0000-0000-0000-000000000001',
  last_reviewed_at = '2026-06-30T10:00:00Z'
where id = '56000000-0000-0000-0000-000000006001';

update public.approval_queue
set
  status = 'rejected',
  last_decision_id = '66000000-0000-0000-0000-000000006002',
  last_reviewed_by = '10000000-0000-0000-0000-000000000001',
  last_reviewed_at = '2026-06-30T10:00:00Z'
where id = '56000000-0000-0000-0000-000000006002';

select ok(
  has_table_privilege('authenticated', 'public.publication_candidates', 'select')
  and not has_table_privilege('authenticated', 'public.publication_candidates', 'insert')
  and not has_table_privilege('authenticated', 'public.publication_jobs', 'update')
  and not has_table_privilege('authenticated', 'public.publication_attempts', 'delete'),
  'authenticated can read publication internals but cannot mutate them directly'
);

select ok(
  not has_table_privilege('anon', 'public.publication_candidates', 'select')
  and not has_table_privilege('anon', 'public.publication_jobs', 'select')
  and not has_table_privilege('anon', 'public.publication_attempts', 'select')
  and not has_table_privilege('anon', 'public.publication_redirect_links', 'select'),
  'anon cannot access internal publication tables'
);

select ok(
  has_function_privilege('authenticated', 'public.request_telegram_publication(uuid)', 'execute')
  and not has_function_privilege('anon', 'public.request_telegram_publication(uuid)', 'execute'),
  'request_telegram_publication is authenticated-only'
);

select ok(
  pg_get_function_arguments('public.request_telegram_publication(uuid)'::regprocedure)
    not ilike '%workspace%'
  and pg_get_function_arguments('public.request_telegram_publication(uuid)'::regprocedure)
    not ilike '%chat%',
  'request_telegram_publication does not accept workspaceId or chatId from clients'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select job_status::text, action
    from public.request_telegram_publication('46000000-0000-0000-0000-000000006001')$$,
  $$values ('requested'::text, 'created'::text)$$,
  'Admin A can request Telegram publication for current approved offer'
);

select results_eq(
  $$select count(*)::bigint from public.request_telegram_publication('46000000-0000-0000-0000-000000006001')$$,
  array[1::bigint],
  'Duplicate publication request returns one existing idempotent job'
);

select results_eq(
  $$select count(*)::bigint from public.publication_jobs
    where workspace_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and candidate_id in (
        select id from public.publication_candidates
        where offer_id = '46000000-0000-0000-0000-000000006001'
      )$$,
  array[1::bigint],
  'Duplicate request does not create a second equivalent job'
);

select results_eq(
  $$select job_status::text
    from public.claim_telegram_publication_job(
      (select id from public.publication_jobs where idempotency_key like 'publication:%46000000-0000-0000-0000-000000006001%' limit 1),
      'OFERTA ENCONTRADA' || chr(10) || 'Confira: https://app.example.test/r/abc',
      '{"templateId":"telegram-mvp-v1"}'::jsonb,
      'run-admin-a'
    )$$,
  $$values ('processing'::text)$$,
  'Admin A claims the requested job and persists the rendered message before external call'
);

select throws_ok(
  $$select *
    from public.claim_telegram_publication_job(
      (select id from public.publication_jobs where idempotency_key like 'publication:%46000000-0000-0000-0000-000000006001%' limit 1),
      'Mensagem duplicada',
      '{}'::jsonb,
      'run-duplicate'
    )$$,
  '40001',
  null,
  'Concurrent claim is blocked while job is processing'
);

select results_eq(
  $$select result::text
    from public.record_telegram_publication_result(
      (select id from public.publication_jobs where idempotency_key like 'publication:%46000000-0000-0000-0000-000000006001%' limit 1),
      'success',
      'telegram-message-1',
      null,
      null,
      null,
      'Publicacao enviada com sucesso.',
      null,
      '{}'::jsonb
    )$$,
  $$values ('success'::text)$$,
  'Admin A records a successful append-only attempt'
);

select throws_ok(
  $$select *
    from public.record_telegram_publication_result(
      (select id from public.publication_jobs where idempotency_key like 'publication:%46000000-0000-0000-0000-000000006001%' limit 1),
      'permanent_failure',
      null,
      null,
      'SHOULD_NOT_OVERWRITE',
      'permanent',
      'Tentativa indevida.',
      null,
      '{}'::jsonb
    )$$,
  '40001',
  null,
  'Success cannot be overwritten by later result'
);

select throws_ok(
  $$update public.publication_attempts
    set safe_message = 'editada'$$,
  '42501',
  null,
  'Publication attempts are append-only'
);

select results_eq(
  $$select count(*)::bigint from public.resolve_publication_redirect(
    (select short_code from public.publication_redirect_links limit 1)
  )$$,
  array[1::bigint],
  'Public redirect resolver returns a destination for active code'
);

select results_eq(
  $$select count(*)::bigint from public.resolve_publication_redirect('invalid-code')$$,
  array[0::bigint],
  'Invalid redirect code resolves to no rows'
);

select throws_ok(
  $$select * from public.request_telegram_publication('46000000-0000-0000-0000-000000006002')$$,
  '23514',
  null,
  'Rejected offer cannot be published'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select throws_ok(
  $$select * from public.request_telegram_publication('46000000-0000-0000-0000-000000006001')$$,
  '42501',
  null,
  'Editor A cannot request Telegram publication'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select throws_ok(
  $$select * from public.request_telegram_publication('46000000-0000-0000-0000-000000006001')$$,
  '42501',
  null,
  'Suspended user cannot request Telegram publication'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);

select throws_ok(
  $$select * from public.request_telegram_publication('46000000-0000-0000-0000-000000006001')$$,
  '42501',
  null,
  'Admin B cannot publish Workspace A offer'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.request_telegram_publication('46000000-0000-0000-0000-000000006001')$$,
  '42501',
  null,
  'Anon cannot request Telegram publication'
);

reset role;

select * from finish();
rollback;
