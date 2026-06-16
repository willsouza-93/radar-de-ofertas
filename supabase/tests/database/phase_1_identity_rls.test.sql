begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

select is(
  (
    select string_agg(enumlabel::text collate "C", ',' order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.app_role'::regtype
  ),
  'admin,editor'::text collate "C",
  'RBAC contains only admin and editor'
);

select is(
  (
    select string_agg(enumlabel::text collate "C", ',' order by enumsortorder)
    from pg_enum
    where enumtypid = 'public.member_status'::regtype
  ),
  'active,suspended,invited'::text collate "C",
  'membership statuses match the approved model'
);

select is(
  (
    select string_agg(relname::text collate "C", ',' order by relname)
    from pg_class
    where relnamespace = 'public'::regnamespace
      and relname in ('profiles', 'workspaces', 'workspace_members')
      and relrowsecurity
  ),
  'profiles,workspace_members,workspaces'::text collate "C",
  'RLS is enabled on every Phase 1 public table'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'select')
  and not has_table_privilege('anon', 'public.workspaces', 'select')
  and not has_table_privilege('anon', 'public.workspace_members', 'select'),
  'anon/Public Visitor has no select grants on internal tables'
);

select ok(
  not has_table_privilege('anon', 'public.profiles', 'insert')
  and not has_table_privilege('anon', 'public.workspaces', 'insert')
  and not has_table_privilege('anon', 'public.workspace_members', 'insert'),
  'anon/Public Visitor has no insert grants on internal tables'
);

select ok(
  not has_schema_privilege('anon', 'app_private', 'usage'),
  'anon/Public Visitor cannot use the private helper schema'
);

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'select')
  and has_table_privilege('authenticated', 'public.workspaces', 'select')
  and has_table_privilege('authenticated', 'public.workspace_members', 'select'),
  'authenticated receives only the select surface protected by RLS'
);

select ok(
  not has_table_privilege('authenticated', 'public.workspaces', 'insert')
  and not has_table_privilege('authenticated', 'public.workspaces', 'update')
  and not has_table_privilege('authenticated', 'public.workspace_members', 'insert')
  and not has_table_privilege('authenticated', 'public.workspace_members', 'update')
  and not has_table_privilege('authenticated', 'public.workspace_members', 'delete'),
  'workspace and membership mutations are not exposed to authenticated clients'
);

select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'update')
  and has_column_privilege('authenticated', 'public.profiles', 'avatar_url', 'update')
  and not has_column_privilege('authenticated', 'public.profiles', 'id', 'update'),
  'profile updates are limited to presentation fields'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'app_private.assert_role(uuid, public.app_role[])',
    'execute'
  ),
  'privileged assertion helper is not directly executable by authenticated clients'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);

select results_eq(
  $$select count(*)::bigint from public.workspaces$$,
  array[1::bigint],
  'Admin A reads only Workspace A'
);

select results_eq(
  $$select count(*)::bigint from public.workspace_members$$,
  array[3::bigint],
  'Admin A lists memberships only from Workspace A'
);

select results_eq(
  $$select count(*)::bigint from public.profiles$$,
  array[3::bigint],
  'Admin A reads profiles only from Workspace A'
);

select results_eq(
  $$select count(*)::bigint from public.workspaces
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  array[0::bigint],
  'Admin A cannot read Workspace B'
);

select results_eq(
  $$with changed as (
      update public.profiles
      set display_name = 'Willian Cesar Local'
      where id = '10000000-0000-0000-0000-000000000001'
      returning 1
    )
    select count(*)::bigint from changed$$,
  array[1::bigint],
  'Admin A updates own presentation profile'
);

select results_eq(
  $$with changed as (
      update public.profiles
      set display_name = 'Unauthorized change'
      where id = '10000000-0000-0000-0000-000000000002'
      returning 1
    )
    select count(*)::bigint from changed$$,
  array[0::bigint],
  'Admin A cannot update another profile through the client policy'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);

select results_eq(
  $$select count(*)::bigint from public.workspaces$$,
  array[1::bigint],
  'Editor A reads Workspace A'
);

select results_eq(
  $$select count(*)::bigint from public.workspace_members$$,
  array[1::bigint],
  'Editor A reads only own membership'
);

select results_eq(
  $$select count(*)::bigint from public.profiles$$,
  array[1::bigint],
  'Editor A reads only own profile'
);

select results_eq(
  $$with changed as (
      update public.profiles
      set display_name = 'Editor Local Updated'
      where id = '10000000-0000-0000-0000-000000000002'
      returning 1
    )
    select count(*)::bigint from changed$$,
  array[1::bigint],
  'Editor A updates own presentation profile'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);

select results_eq(
  $$select count(*)::bigint from public.workspaces$$,
  array[0::bigint],
  'Suspended user loses workspace access'
);

select results_eq(
  $$select count(*)::bigint from public.workspace_members$$,
  array[1::bigint],
  'Suspended user reads only own suspended membership'
);

select results_eq(
  $$select count(*)::bigint from public.profiles$$,
  array[1::bigint],
  'Suspended user reads only own profile'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000004', true);

select results_eq(
  $$select count(*)::bigint from public.workspaces
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'$$,
  array[1::bigint],
  'Admin B reads only Workspace B'
);

select results_eq(
  $$select count(*)::bigint from public.workspace_members$$,
  array[1::bigint],
  'Admin B cannot read Workspace A memberships'
);

select results_eq(
  $$select count(*)::bigint from public.profiles$$,
  array[1::bigint],
  'Admin B cannot read Workspace A profiles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000005', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-000000000005","user_metadata":{"role":"admin"}}', true);

select results_eq(
  $$select count(*)::bigint from public.workspaces$$,
  array[0::bigint],
  'User without membership cannot read workspaces even with forged metadata'
);

select results_eq(
  $$select count(*)::bigint from public.workspace_members$$,
  array[0::bigint],
  'User without membership cannot read memberships'
);

select results_eq(
  $$select count(*)::bigint from public.profiles$$,
  array[1::bigint],
  'User without membership reads only own non-authoritative profile'
);

reset role;

select throws_ok(
  $$update public.workspace_members
    set status = 'suspended'
    where workspace_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
      and user_id = '10000000-0000-0000-0000-000000000004'$$,
  '23514',
  'workspace must retain at least one active admin',
  'last active Admin cannot be suspended'
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '00000000-0000-0000-0000-000000000000',
  '10000000-0000-0000-0000-000000000099',
  'authenticated',
  'authenticated',
  'profile-trigger@example.test',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Profile Trigger"}'::jsonb,
  now(),
  now()
);

select is(
  (
    select display_name collate "C"
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000099'
  ),
  'Profile Trigger'::text collate "C",
  'Auth user provisioning trigger creates the profile'
);

select * from finish();
rollback;
