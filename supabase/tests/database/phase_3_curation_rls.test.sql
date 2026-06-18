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
    '40000000-0000-0000-0000-000000000901',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'phase-3-approve',
    'manual:external:phase-3-approve',
    'https://example.test/phase-3-approve',
    'https://affiliate.example.test/phase-3-approve',
    'Oferta para aprovar na Fase 3',
    49.90,
    'BRL',
    70,
    'mvp-v1',
    '{}'::jsonb,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000902',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'phase-3-reject',
    'manual:external:phase-3-reject',
    'https://example.test/phase-3-reject',
    'https://affiliate.example.test/phase-3-reject',
    'Oferta para rejeitar na Fase 3',
    89.90,
    'BRL',
    20,
    'mvp-v1',
    '{}'::jsonb,
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
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
    '50000000-0000-0000-0000-000000000901',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '40000000-0000-0000-0000-000000000901',
    'pending',
    70
  ),
  (
    '50000000-0000-0000-0000-000000000902',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '40000000-0000-0000-0000-000000000902',
    'pending',
    20
  );

select is(
  (
    select string_agg(enumlabel::text collate "C", ',' order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.approval_status'::regtype
  ),
  'pending,approved,rejected'::text collate "C",
  'approval_status follows Phase 3A review and does not include under_review'
);

select is(
  (
    select string_agg(enumlabel::text collate "C", ',' order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.approval_decision_type'::regtype
  ),
  'approved,rejected'::text collate "C",
  'approval decisions are limited to approved and rejected'
);

select is(
  (
    select string_agg(relname::text collate "C", ',' order by relname)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in ('approval_queue', 'approval_decisions', 'review_notes')
      and relrowsecurity
  ),
  'approval_decisions,approval_queue,review_notes'::text collate "C",
  'RLS is enabled on every Phase 3 public table'
);

select ok(
  not has_table_privilege('anon', 'public.approval_queue', 'select')
  and not has_table_privilege('anon', 'public.approval_decisions', 'select')
  and not has_table_privilege('anon', 'public.review_notes', 'select'),
  'anon/Public Visitor has no select grants on curation tables'
);

select ok(
  has_table_privilege('authenticated', 'public.approval_queue', 'select')
  and not has_table_privilege('authenticated', 'public.approval_queue', 'insert')
  and not has_table_privilege('authenticated', 'public.approval_queue', 'update')
  and not has_table_privilege('authenticated', 'public.approval_queue', 'delete'),
  'authenticated can read approval_queue but cannot mutate status directly'
);

select ok(
  has_table_privilege('authenticated', 'public.approval_decisions', 'select')
  and not has_table_privilege('authenticated', 'public.approval_decisions', 'insert')
  and not has_table_privilege('authenticated', 'public.approval_decisions', 'update')
  and not has_table_privilege('authenticated', 'public.approval_decisions', 'delete'),
  'authenticated can read approval_decisions but cannot insert decisions directly'
);

select ok(
  has_table_privilege('authenticated', 'public.review_notes', 'select')
  and has_table_privilege('authenticated', 'public.review_notes', 'insert')
  and not has_table_privilege('authenticated', 'public.review_notes', 'update')
  and not has_table_privilege('authenticated', 'public.review_notes', 'delete'),
  'review_notes is append-only for authenticated clients'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.apply_approval_decision(uuid, public.approval_status, public.approval_decision_type, text, text)',
    'execute'
  )
  and not has_function_privilege(
    'anon',
    'public.apply_approval_decision(uuid, public.approval_status, public.approval_decision_type, text, text)',
    'execute'
  ),
  'only authenticated clients can execute the official approval decision function'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select count(*)::bigint from public.approval_queue$$,
  array[5::bigint],
  'Admin A reads only Workspace A approval queue rows'
);

select results_eq(
  $$select count(*)::bigint from public.approval_queue
    where id = '50000000-0000-0000-0000-000000000101'$$,
  array[0::bigint],
  'Admin A cannot read Workspace B queue row'
);

select results_eq(
  $$with inserted as (
      insert into public.review_notes (
        id,
        workspace_id,
        queue_id,
        offer_id,
        body,
        created_by
      )
      values (
        '70000000-0000-0000-0000-000000000901',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '50000000-0000-0000-0000-000000000901',
        '40000000-0000-0000-0000-000000000901',
        'Admin adicionou nota de curadoria.',
        '10000000-0000-0000-0000-000000000001'
      )
      returning 1
    )
    select count(*)::bigint from inserted$$,
  array[1::bigint],
  'Admin A inserts review note in own workspace'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$select count(*)::bigint from public.approval_queue$$,
  array[5::bigint],
  'Editor A reads Workspace A approval queue rows'
);

select results_eq(
  $$with inserted as (
      insert into public.review_notes (
        id,
        workspace_id,
        queue_id,
        offer_id,
        body,
        created_by
      )
      values (
        '70000000-0000-0000-0000-000000000902',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '50000000-0000-0000-0000-000000000902',
        '40000000-0000-0000-0000-000000000902',
        'Editor adicionou nota de curadoria.',
        '10000000-0000-0000-0000-000000000002'
      )
      returning 1
    )
    select count(*)::bigint from inserted$$,
  array[1::bigint],
  'Editor A inserts review note in own workspace'
);

select results_eq(
  $$select count(*)::bigint
    from public.apply_approval_decision(
      '50000000-0000-0000-0000-000000000901',
      'pending',
      'approved',
      null,
      'Nota atomica criada junto com aprovacao.'
    )$$,
  array[1::bigint],
  'Editor A approves a pending queue row through the official atomic function'
);

select results_eq(
  $$select count(*)::bigint
    from public.apply_approval_decision(
      '50000000-0000-0000-0000-000000000902',
      'pending',
      'rejected',
      'Preco perdeu atratividade durante a revisao.',
      null
    )$$,
  array[1::bigint],
  'Editor A rejects a pending queue row through the official atomic function'
);

select results_eq(
  $$select count(*)::bigint
    from public.approval_queue
    where id = '50000000-0000-0000-0000-000000000901'
      and status = 'approved'
      and last_decision_id is not null
      and last_reviewed_by = '10000000-0000-0000-0000-000000000002'$$,
  array[1::bigint],
  'Official approval updates queue status and audit pointers together'
);

select results_eq(
  $$select count(*)::bigint
    from public.approval_decisions
    where queue_id = '50000000-0000-0000-0000-000000000901'
      and decision = 'approved'
      and previous_status = 'pending'
      and next_status = 'approved'$$,
  array[1::bigint],
  'Official approval records exactly one approval decision'
);

select results_eq(
  $$select count(*)::bigint
    from public.review_notes
    where queue_id = '50000000-0000-0000-0000-000000000901'
      and body = 'Nota atomica criada junto com aprovacao.'$$,
  array[1::bigint],
  'Official approval inserts optional review note atomically'
);

select throws_ok(
  $$update public.approval_queue
    set status = 'approved'
    where id = '50000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'Editor A cannot update approval_queue.status directly'
);

select throws_ok(
  $$insert into public.approval_decisions (
      workspace_id,
      queue_id,
      offer_id,
      decision,
      previous_status,
      next_status,
      decided_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '50000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      'approved',
      'pending',
      'approved',
      '10000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'Editor A cannot insert approval_decisions directly'
);

select throws_ok(
  $$select *
    from public.apply_approval_decision(
      '50000000-0000-0000-0000-000000000901',
      'pending',
      'approved',
      null,
      null
    )$$,
  '40001',
  null,
  'Official approval function enforces expectedStatus and blocks approve twice'
);

select throws_ok(
  $$update public.review_notes
    set body = 'Editor tentou editar nota append-only.'
    where id = '70000000-0000-0000-0000-000000000902'$$,
  '42501',
  null,
  'Editor A cannot update review_notes because UPDATE grant is absent'
);

select throws_ok(
  $$delete from public.review_notes
    where id = '70000000-0000-0000-0000-000000000902'$$,
  '42501',
  null,
  'Editor A cannot delete review_notes because DELETE grant is absent'
);

select throws_ok(
  $$update public.approval_decisions
    set reason = 'Editor tentou editar decisao append-only.'
    where id = '60000000-0000-0000-0000-000000000902'$$,
  '42501',
  null,
  'Editor A cannot update approval_decisions because UPDATE grant is absent'
);

select throws_ok(
  $$delete from public.approval_decisions
    where id = '60000000-0000-0000-0000-000000000902'$$,
  '42501',
  null,
  'Editor A cannot delete approval_decisions because DELETE grant is absent'
);

select throws_ok(
  $$delete from public.approval_queue
    where id = '50000000-0000-0000-0000-000000000902'$$,
  '42501',
  null,
  'Editor A cannot delete approval_queue because DELETE grant is absent'
);

select throws_ok(
  $$insert into public.review_notes (
      workspace_id,
      queue_id,
      offer_id,
      body,
      created_by
    )
    values (
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      '50000000-0000-0000-0000-000000000101',
      '40000000-0000-0000-0000-000000000101',
      'Editor A tentou inserir nota em outro workspace.',
      '10000000-0000-0000-0000-000000000002'
    )$$,
  '42501',
  null,
  'Editor A cannot insert review note into Workspace B because RLS blocks it'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select results_eq(
  $$select count(*)::bigint from public.approval_queue$$,
  array[0::bigint],
  'Suspended user cannot read approval queue'
);

select throws_ok(
  $$insert into public.review_notes (
      workspace_id,
      queue_id,
      offer_id,
      body,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '50000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      'Suspenso tentou inserir nota.',
      '10000000-0000-0000-0000-000000000003'
    )$$,
  '42501',
  null,
  'Suspended user cannot insert review note'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);

select results_eq(
  $$select count(*)::bigint from public.approval_queue$$,
  array[1::bigint],
  'Admin B reads only Workspace B queue'
);

select results_eq(
  $$select count(*)::bigint from public.approval_queue
    where id = '50000000-0000-0000-0000-000000000001'$$,
  array[0::bigint],
  'Admin B cannot read Workspace A queue by ID'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);

select results_eq(
  $$select count(*)::bigint from public.approval_queue$$,
  array[0::bigint],
  'User without membership cannot read curation rows'
);

reset role;

select throws_ok(
  $$insert into public.approval_decisions (
      workspace_id,
      queue_id,
      offer_id,
      decision,
      previous_status,
      next_status,
      decided_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '50000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      'rejected',
      'pending',
      'rejected',
      '10000000-0000-0000-0000-000000000001'
    )$$,
  '23514',
  null,
  'Rejected decision requires reason'
);

select throws_ok(
  $$insert into public.approval_queue (
      workspace_id,
      offer_id,
      status,
      priority_score
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '40000000-0000-0000-0000-000000000101',
      'pending',
      72
    )$$,
  '23503',
  null,
  'approval_queue rejects offer from another workspace'
);

select throws_ok(
  $$insert into public.review_notes (
      workspace_id,
      queue_id,
      offer_id,
      body,
      created_by
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '50000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000101',
      'Nota com oferta de outro workspace.',
      '10000000-0000-0000-0000-000000000001'
    )$$,
  '23503',
  null,
  'review_notes rejects offer from another workspace'
);

select results_eq(
  $$select type, created_at
    from (
      select 'note'::text as type, created_at
      from public.review_notes
      where queue_id = '50000000-0000-0000-0000-000000000002'
      union all
      select 'decision'::text as type, decided_at as created_at
      from public.approval_decisions
      where queue_id = '50000000-0000-0000-0000-000000000002'
    ) as history
    order by created_at asc$$,
  $$values
    ('note'::text, '2026-06-18T10:20:00Z'::timestamptz),
    ('decision'::text, '2026-06-18T10:30:00Z'::timestamptz)$$,
  'Review history can be listed in chronological order'
);

select * from finish();
rollback;
