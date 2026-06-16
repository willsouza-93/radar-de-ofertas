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
