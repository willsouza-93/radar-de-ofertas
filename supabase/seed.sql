-- Local/test only. The password below is a fixture and must never be reused.
-- Password for all local users: LocalPassword123!

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'willian.souza2007@hotmail.com',
    extensions.crypt('LocalPassword123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Willian Cesar"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'souza.willian.93@outlook.com',
    extensions.crypt('LocalPassword123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Editor Local"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'suspended@example.test',
    extensions.crypt('LocalPassword123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Suspended Local"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'admin-b@example.test',
    extensions.crypt('LocalPassword123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Admin Workspace B"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000005',
    'authenticated',
    'authenticated',
    'no-membership@example.test',
    extensions.crypt('LocalPassword123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"No Membership"}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
on conflict (id) do update
set
  email = excluded.email,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  user_id,
  user_id,
  email,
  jsonb_build_object('sub', user_id::text, 'email', email),
  'email',
  now(),
  now(),
  now()
from (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, 'willian.souza2007@hotmail.com'),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'souza.willian.93@outlook.com'),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'suspended@example.test'),
    ('10000000-0000-0000-0000-000000000004'::uuid, 'admin-b@example.test'),
    ('10000000-0000-0000-0000-000000000005'::uuid, 'no-membership@example.test')
) as fixture_users(user_id, email)
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.profiles (id, display_name)
values
  ('10000000-0000-0000-0000-000000000001', 'Willian Cesar'),
  ('10000000-0000-0000-0000-000000000002', 'Editor Local'),
  ('10000000-0000-0000-0000-000000000003', 'Suspended Local'),
  ('10000000-0000-0000-0000-000000000004', 'Admin Workspace B'),
  ('10000000-0000-0000-0000-000000000005', 'No Membership')
on conflict (id) do update
set display_name = excluded.display_name;

insert into public.workspaces (id, name, slug, timezone)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Radar de Ofertas',
    'radar-de-ofertas',
    'America/Sao_Paulo'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Workspace de isolamento',
    'workspace-isolamento',
    'America/Sao_Paulo'
  )
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  timezone = excluded.timezone;

insert into public.workspace_members (
  workspace_id,
  user_id,
  role,
  status,
  invited_by
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '10000000-0000-0000-0000-000000000001',
    'admin',
    'active',
    null
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '10000000-0000-0000-0000-000000000002',
    'editor',
    'active',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '10000000-0000-0000-0000-000000000003',
    'editor',
    'suspended',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '10000000-0000-0000-0000-000000000004',
    'admin',
    'active',
    null
  )
on conflict (workspace_id, user_id) do update
set
  role = excluded.role,
  status = excluded.status,
  invited_by = excluded.invited_by;

insert into public.categories (id, workspace_id, name, slug, color, is_active)
values
  ('20000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Pet', 'pet', '#16A34A', true),
  ('20000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mercado', 'mercado', '#F97316', true),
  ('20000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tecnologia', 'tecnologia', '#2563EB', true),
  ('20000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Casa', 'casa', '#7C3AED', true),
  ('20000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Automotivo', 'automotivo', '#475569', true),
  ('20000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gamer', 'gamer', '#DB2777', true),
  ('20000000-0000-0000-0000-000000000007', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bebes', 'bebes', '#06B6D4', true),
  ('20000000-0000-0000-0000-000000000008', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Eletrodomesticos', 'eletrodomesticos', '#0F766E', true),
  ('20000000-0000-0000-0000-000000000101', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Tecnologia B', 'tecnologia-b', '#1D4ED8', true)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  color = excluded.color,
  is_active = excluded.is_active;

insert into public.tags (id, workspace_id, name, slug, color, is_active)
values
  ('30000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Cupom', 'cupom', '#EA580C', true),
  ('30000000-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Frete gratis', 'frete-gratis', '#059669', true),
  ('30000000-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Menor preco', 'menor-preco', '#2563EB', true),
  ('30000000-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alta comissao', 'alta-comissao', '#9333EA', true),
  ('30000000-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Black Friday', 'black-friday', '#111827', true),
  ('30000000-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Achadinho', 'achadinho', '#EAB308', true),
  ('30000000-0000-0000-0000-000000000101', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Isolamento', 'isolamento', '#64748B', true)
on conflict (id) do update
set
  name = excluded.name,
  slug = excluded.slug,
  color = excluded.color,
  is_active = excluded.is_active;

insert into public.offers (
  id,
  workspace_id,
  marketplace,
  external_id,
  dedupe_key,
  source_url,
  affiliate_url,
  title,
  image_url,
  category_id,
  current_price,
  previous_price,
  currency,
  discount_percent,
  coupon_code,
  free_shipping,
  commission_percent,
  score,
  score_version,
  score_factors,
  highlights,
  status,
  captured_at,
  last_seen_at,
  created_by,
  updated_by
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'mercado_livre',
    'MLB-FONE-001',
    'mercado_livre:external:MLB-FONE-001',
    'https://www.mercadolivre.com.br/fone-bluetooth/p/MLB-FONE-001',
    'https://afiliados.example.test/mlb-fone-001',
    'Fone Bluetooth com cancelamento de ruido',
    'https://images.example.test/fone.jpg',
    '20000000-0000-0000-0000-000000000003',
    99.90,
    149.90,
    'BRL',
    33.36,
    'APP10',
    true,
    10.00,
    82,
    'mvp-v1',
    '{"version":"mvp-v1","discount":{"points":23,"max":35},"priceHistory":{"points":30,"max":30},"commission":{"points":14,"max":20},"completeness":{"points":15,"max":15}}'::jsonb,
    array['lowest_price','coupon','free_shipping','high_commission']::public.offer_highlight[],
    'captured',
    '2026-06-17T10:00:00Z',
    '2026-06-17T10:00:00Z',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'manual',
    'url:manual-cafeteira',
    'manual:url:manual-cafeteira',
    'https://loja.example.test/cafeteira',
    'https://afiliados.example.test/cafeteira',
    'Cafeteira compacta',
    null,
    '20000000-0000-0000-0000-000000000004',
    79.90,
    null,
    'BRL',
    null,
    null,
    false,
    null,
    11,
    'mvp-v1',
    '{"version":"mvp-v1","discount":{"points":0,"max":35},"priceHistory":{"points":0,"max":30},"commission":{"points":0,"max":20},"completeness":{"points":11,"max":15}}'::jsonb,
    array[]::public.offer_highlight[],
    'captured',
    '2026-06-17T11:00:00Z',
    '2026-06-17T11:00:00Z',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'shopee',
    'SHP-GAME-001',
    'shopee:external:SHP-GAME-001',
    'https://shopee.com.br/produto-game-i.SHP-GAME-001',
    'https://afiliados.example.test/shp-game-001',
    'Mouse gamer RGB',
    'https://images.example.test/mouse.jpg',
    '20000000-0000-0000-0000-000000000006',
    129.90,
    149.90,
    'BRL',
    13.34,
    null,
    false,
    3.00,
    25,
    'mvp-v1',
    '{"version":"mvp-v1","discount":{"points":9,"max":35},"priceHistory":{"points":10,"max":30},"commission":{"points":4,"max":20},"completeness":{"points":15,"max":15}}'::jsonb,
    array[]::public.offer_highlight[],
    'captured',
    '2026-06-17T12:00:00Z',
    '2026-06-17T12:00:00Z',
    '10000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000101',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'manual',
    'workspace-b-offer',
    'manual:external:workspace-b-offer',
    'https://workspace-b.example.test/produto',
    'https://workspace-b.example.test/afiliado',
    'Oferta isolada Workspace B',
    null,
    '20000000-0000-0000-0000-000000000101',
    59.90,
    99.90,
    'BRL',
    40.04,
    null,
    true,
    12.00,
    72,
    'mvp-v1',
    '{"version":"mvp-v1","discount":{"points":28,"max":35},"priceHistory":{"points":0,"max":30},"commission":{"points":20,"max":20},"completeness":{"points":11,"max":15}}'::jsonb,
    array['free_shipping','high_commission']::public.offer_highlight[],
    'captured',
    '2026-06-17T13:00:00Z',
    '2026-06-17T13:00:00Z',
    '10000000-0000-0000-0000-000000000004',
    '10000000-0000-0000-0000-000000000004'
  )
on conflict (id) do update
set
  marketplace = excluded.marketplace,
  external_id = excluded.external_id,
  dedupe_key = excluded.dedupe_key,
  source_url = excluded.source_url,
  affiliate_url = excluded.affiliate_url,
  title = excluded.title,
  image_url = excluded.image_url,
  category_id = excluded.category_id,
  current_price = excluded.current_price,
  previous_price = excluded.previous_price,
  currency = excluded.currency,
  discount_percent = excluded.discount_percent,
  coupon_code = excluded.coupon_code,
  free_shipping = excluded.free_shipping,
  commission_percent = excluded.commission_percent,
  score = excluded.score,
  score_version = excluded.score_version,
  score_factors = excluded.score_factors,
  highlights = excluded.highlights,
  status = excluded.status,
  captured_at = excluded.captured_at,
  last_seen_at = excluded.last_seen_at,
  updated_by = excluded.updated_by;

insert into public.offer_tags (workspace_id, offer_id, tag_id)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000004'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '40000000-0000-0000-0000-000000000101', '30000000-0000-0000-0000-000000000101')
on conflict (offer_id, tag_id) do nothing;

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
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000001', 119.90, 149.90, 20.01, 'APP5', true, '2026-06-16T10:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000001', 99.90, 149.90, 33.36, 'APP10', true, '2026-06-17T10:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000002', 79.90, null, null, null, false, '2026-06-17T11:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000003', 109.90, 159.90, 31.27, null, false, '2026-06-16T12:00:00Z'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '40000000-0000-0000-0000-000000000003', 129.90, 149.90, 13.34, null, false, '2026-06-17T12:00:00Z'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '40000000-0000-0000-0000-000000000101', 59.90, 99.90, 40.04, null, true, '2026-06-17T13:00:00Z')
on conflict (offer_id, observed_at) do update
set
  price = excluded.price,
  previous_price = excluded.previous_price,
  discount_percent = excluded.discount_percent,
  coupon_code = excluded.coupon_code,
  free_shipping = excluded.free_shipping;

insert into public.approval_queue (
  id,
  workspace_id,
  offer_id,
  status,
  priority_score,
  last_reviewed_by,
  last_reviewed_at,
  created_at,
  updated_at
)
values
  (
    '50000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '40000000-0000-0000-0000-000000000001',
    'pending',
    82,
    null,
    null,
    '2026-06-18T09:00:00Z',
    '2026-06-18T09:00:00Z'
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '40000000-0000-0000-0000-000000000002',
    'approved',
    11,
    '10000000-0000-0000-0000-000000000001',
    '2026-06-18T10:30:00Z',
    '2026-06-18T09:30:00Z',
    '2026-06-18T10:30:00Z'
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '40000000-0000-0000-0000-000000000003',
    'rejected',
    25,
    '10000000-0000-0000-0000-000000000002',
    '2026-06-18T11:30:00Z',
    '2026-06-18T10:00:00Z',
    '2026-06-18T11:30:00Z'
  ),
  (
    '50000000-0000-0000-0000-000000000101',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '40000000-0000-0000-0000-000000000101',
    'pending',
    72,
    null,
    null,
    '2026-06-18T09:00:00Z',
    '2026-06-18T09:00:00Z'
  )
on conflict (id) do update
set
  status = excluded.status,
  priority_score = excluded.priority_score,
  last_reviewed_by = excluded.last_reviewed_by,
  last_reviewed_at = excluded.last_reviewed_at,
  updated_at = excluded.updated_at;

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
    '60000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    'approved',
    'pending',
    'approved',
    null,
    '10000000-0000-0000-0000-000000000001',
    '2026-06-18T10:30:00Z',
    '2026-06-18T10:30:00Z'
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '50000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000003',
    'rejected',
    'pending',
    'rejected',
    'Preco subiu antes da revisao.',
    '10000000-0000-0000-0000-000000000002',
    '2026-06-18T11:30:00Z',
    '2026-06-18T11:30:00Z'
  )
on conflict (id) do update
set
  decision = excluded.decision,
  previous_status = excluded.previous_status,
  next_status = excluded.next_status,
  reason = excluded.reason,
  decided_by = excluded.decided_by,
  decided_at = excluded.decided_at;

update public.approval_queue
set last_decision_id = '60000000-0000-0000-0000-000000000001'
where id = '50000000-0000-0000-0000-000000000002';

update public.approval_queue
set last_decision_id = '60000000-0000-0000-0000-000000000002'
where id = '50000000-0000-0000-0000-000000000003';

insert into public.review_notes (
  id,
  workspace_id,
  queue_id,
  offer_id,
  body,
  created_by,
  created_at
)
values
  (
    '70000000-0000-0000-0000-000000000001',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '50000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    'Cupom validado manualmente. Oferta pronta para revisao final.',
    '10000000-0000-0000-0000-000000000001',
    '2026-06-18T09:15:00Z'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '50000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000002',
    'Aprovada como teste de historico local.',
    '10000000-0000-0000-0000-000000000001',
    '2026-06-18T10:20:00Z'
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '50000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000003',
    'Rejeitada porque a vantagem caiu durante a revisao.',
    '10000000-0000-0000-0000-000000000002',
    '2026-06-18T11:20:00Z'
  ),
  (
    '70000000-0000-0000-0000-000000000101',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '50000000-0000-0000-0000-000000000101',
    '40000000-0000-0000-0000-000000000101',
    'Fixture de isolamento do Workspace B.',
    '10000000-0000-0000-0000-000000000004',
    '2026-06-18T09:15:00Z'
  )
on conflict (id) do update
set
  body = excluded.body,
  created_by = excluded.created_by,
  created_at = excluded.created_at;
