begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

select is(
  (
    select string_agg(enumlabel::text collate "C", ',' order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.offer_marketplace'::regtype
  ),
  'manual,mercado_livre,shopee'::text collate "C",
  'offer marketplaces are limited to manual classifiers'
);

select is(
  (
    select string_agg(enumlabel::text collate "C", ',' order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.offer_status'::regtype
  ),
  'captured'::text collate "C",
  'Phase 2 offer status is limited to captured'
);

select is(
  (
    select string_agg(relname::text collate "C", ',' order by relname)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in ('categories', 'tags', 'offers', 'offer_tags', 'price_snapshots')
      and relrowsecurity
  ),
  'categories,offer_tags,offers,price_snapshots,tags'::text collate "C",
  'RLS is enabled on every Phase 2 public table'
);

select ok(
  not has_table_privilege('anon', 'public.categories', 'select')
  and not has_table_privilege('anon', 'public.tags', 'select')
  and not has_table_privilege('anon', 'public.offers', 'select')
  and not has_table_privilege('anon', 'public.offer_tags', 'select')
  and not has_table_privilege('anon', 'public.price_snapshots', 'select'),
  'anon/Public Visitor has no select grants on offer domain tables'
);

select ok(
  has_table_privilege('authenticated', 'public.offers', 'select')
  and has_table_privilege('authenticated', 'public.offers', 'insert')
  and has_table_privilege('authenticated', 'public.offers', 'update')
  and not has_table_privilege('authenticated', 'public.offers', 'delete'),
  'authenticated receives offer grants needed for Admin RLS but no offer delete'
);

select ok(
  has_table_privilege('authenticated', 'public.offer_tags', 'delete')
  and not has_table_privilege('authenticated', 'public.price_snapshots', 'delete'),
  'only offer_tags exposes delete grant and snapshots remain append-only'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select count(*)::bigint from public.offers$$,
  array[3::bigint],
  'Admin A reads only Workspace A offers'
);

select results_eq(
  $$select count(*)::bigint from public.price_snapshots$$,
  array[5::bigint],
  'Admin A reads only Workspace A snapshots'
);

select results_eq(
  $$with inserted as (
      insert into public.offers (
        id,
        workspace_id,
        marketplace,
        external_id,
        dedupe_key,
        source_url,
        affiliate_url,
        title,
        category_id,
        current_price,
        currency,
        score,
        score_version,
        score_factors,
        created_by,
        updated_by
      )
      values (
        '40000000-0000-0000-0000-000000000201',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'manual',
        'admin-insert-test',
        'manual:external:admin-insert-test',
        'https://example.test/admin-insert-test',
        'https://affiliate.example.test/admin-insert-test',
        'Oferta teste Admin',
        '20000000-0000-0000-0000-000000000003',
        10.00,
        'BRL',
        10,
        'mvp-v1',
        '{}'::jsonb,
        '10000000-0000-0000-0000-000000000001',
        '10000000-0000-0000-0000-000000000001'
      )
      returning 1
    )
    select count(*)::bigint from inserted$$,
  array[1::bigint],
  'Admin A inserts an offer in own workspace'
);

select results_eq(
  $$with inserted as (
      insert into public.offer_tags (
        workspace_id,
        offer_id,
        tag_id
      )
      values (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '40000000-0000-0000-0000-000000000201',
        '30000000-0000-0000-0000-000000000001'
      )
      returning 1
    )
    select count(*)::bigint from inserted$$,
  array[1::bigint],
  'Admin A links a tag to an offer'
);

select results_eq(
  $$with deleted as (
      delete from public.offer_tags
      where offer_id = '40000000-0000-0000-0000-000000000201'
        and tag_id = '30000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*)::bigint from deleted$$,
  array[1::bigint],
  'Admin A physically removes an offer_tags link'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$select count(*)::bigint from public.offers$$,
  array[4::bigint],
  'Editor A reads Workspace A offers'
);

select throws_ok(
  $$insert into public.categories (
      workspace_id,
      name,
      slug,
      color
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Editor categoria bloqueada',
      'editor-categoria-bloqueada',
      '#111827'
    )$$,
  '42501',
  null,
  'Editor A cannot insert categories because RLS requires admin'
);

select results_eq(
  $$with updated as (
      update public.categories
      set name = 'Editor tentou atualizar categoria'
      where id = '20000000-0000-0000-0000-000000000003'
      returning 1
    )
    select count(*)::bigint from updated$$,
  array[0::bigint],
  'Editor A cannot update categories because RLS update policy requires admin'
);

select throws_ok(
  $$delete from public.categories
    where id = '20000000-0000-0000-0000-000000000003'$$,
  '42501',
  null,
  'Editor A cannot delete categories because DELETE grant is absent'
);

select throws_ok(
  $$insert into public.tags (
      workspace_id,
      name,
      slug,
      color
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'Editor tag bloqueada',
      'editor-tag-bloqueada',
      '#111827'
    )$$,
  '42501',
  null,
  'Editor A cannot insert tags because RLS requires admin'
);

select results_eq(
  $$with updated as (
      update public.tags
      set name = 'Editor tentou atualizar tag'
      where id = '30000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*)::bigint from updated$$,
  array[0::bigint],
  'Editor A cannot update tags because RLS update policy requires admin'
);

select throws_ok(
  $$delete from public.tags
    where id = '30000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'Editor A cannot delete tags because DELETE grant is absent'
);

select throws_ok(
  $$insert into public.offers (
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
      score_factors
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'manual',
      'editor-insert-test',
      'manual:external:editor-insert-test',
      'https://example.test/editor-insert-test',
      'https://affiliate.example.test/editor-insert-test',
      'Oferta teste Editor',
      10.00,
      'BRL',
      10,
      'mvp-v1',
      '{}'::jsonb
    )$$,
  '42501',
  null,
  'Editor A cannot insert offers because RLS requires admin'
);

select results_eq(
  $$with updated as (
      update public.offers
      set title = 'Editor tentou atualizar oferta'
      where id = '40000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*)::bigint from updated$$,
  array[0::bigint],
  'Editor A cannot update offers because RLS update policy requires admin'
);

select throws_ok(
  $$delete from public.offers
    where id = '40000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'Editor A cannot delete offers because DELETE grant is absent'
);

select throws_ok(
  $$insert into public.offer_tags (
      workspace_id,
      offer_id,
      tag_id
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000006'
    )$$,
  '42501',
  null,
  'Editor A cannot insert offer_tags because RLS requires admin'
);

select throws_ok(
  $$update public.offer_tags
    set tag_id = '30000000-0000-0000-0000-000000000002'
    where offer_id = '40000000-0000-0000-0000-000000000001'
      and tag_id = '30000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'Editor A cannot update offer_tags because UPDATE grant is absent'
);

select results_eq(
  $$with deleted as (
      delete from public.offer_tags
      where offer_id = '40000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*)::bigint from deleted$$,
  array[0::bigint],
  'Editor A cannot delete offer_tags because RLS delete policy requires admin'
);

select throws_ok(
  $$insert into public.price_snapshots (
      workspace_id,
      offer_id,
      price,
      observed_at
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '40000000-0000-0000-0000-000000000001',
      88.90,
      '2026-06-17T12:00:00Z'
    )$$,
  '42501',
  null,
  'Editor A cannot insert price_snapshots because RLS requires admin'
);

select throws_ok(
  $$update public.price_snapshots
    set price = 77.70
    where offer_id = '40000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'Editor A cannot update price_snapshots because UPDATE grant is absent'
);

select throws_ok(
  $$delete from public.price_snapshots
    where offer_id = '40000000-0000-0000-0000-000000000001'$$,
  '42501',
  null,
  'Editor A cannot delete price_snapshots because DELETE grant is absent'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select results_eq(
  $$select count(*)::bigint from public.offers$$,
  array[0::bigint],
  'Suspended user cannot read offers'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);

select results_eq(
  $$select count(*)::bigint from public.offers$$,
  array[1::bigint],
  'Admin B reads only Workspace B offers'
);

select results_eq(
  $$select count(*)::bigint from public.offers
    where id = '40000000-0000-0000-0000-000000000001'$$,
  array[0::bigint],
  'Admin B cannot read Workspace A offer by ID'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);

select results_eq(
  $$select count(*)::bigint from public.offers$$,
  array[0::bigint],
  'User without membership cannot read offers'
);

reset role;

select throws_ok(
  $$insert into public.offers (
      id,
      workspace_id,
      marketplace,
      external_id,
      dedupe_key,
      source_url,
      affiliate_url,
      title,
      category_id,
      current_price,
      currency,
      score,
      score_version,
      score_factors
    )
    values (
      '40000000-0000-0000-0000-000000000301',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'mercado_livre',
      'MLB-FONE-001',
      'mercado_livre:external:duplicate-test',
      'https://example.test/duplicate',
      'https://affiliate.example.test/duplicate',
      'Oferta duplicada',
      '20000000-0000-0000-0000-000000000003',
      10.00,
      'BRL',
      10,
      'mvp-v1',
      '{}'::jsonb
    )$$,
  '23505',
  null,
  'Natural key prevents duplicate external offer in same workspace'
);

select throws_ok(
  $$insert into public.offer_tags (
      workspace_id,
      offer_id,
      tag_id
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      '40000000-0000-0000-0000-000000000001',
      '30000000-0000-0000-0000-000000000101'
    )$$,
  '23503',
  null,
  'offer_tags rejects tag from another workspace'
);

select throws_ok(
  $$insert into public.offers (
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
      score_factors
    )
    values (
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      'manual',
      'bad-url',
      'manual:external:bad-url',
      'javascript:alert(1)',
      'https://affiliate.example.test/bad-url',
      'Oferta com URL invalida',
      10.00,
      'BRL',
      10,
      'mvp-v1',
      '{}'::jsonb
    )$$,
  '23514',
  null,
  'source_url accepts only HTTP/HTTPS'
);

select * from finish();
rollback;
