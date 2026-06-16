create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(pg_catalog.btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(pg_catalog.split_part(new.email, '@', 1), ''),
      'Usuario interno'
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function app_private.handle_new_auth_user() from public;
revoke all on function app_private.handle_new_auth_user() from anon;
revoke all on function app_private.handle_new_auth_user() from authenticated;

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();
