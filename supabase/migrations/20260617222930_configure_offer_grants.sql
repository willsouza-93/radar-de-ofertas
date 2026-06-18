revoke all on table public.categories from anon;
revoke all on table public.tags from anon;
revoke all on table public.offers from anon;
revoke all on table public.offer_tags from anon;
revoke all on table public.price_snapshots from anon;

revoke all on table public.categories from authenticated;
revoke all on table public.tags from authenticated;
revoke all on table public.offers from authenticated;
revoke all on table public.offer_tags from authenticated;
revoke all on table public.price_snapshots from authenticated;

grant select, insert, update on table public.categories to authenticated;
grant select, insert, update on table public.tags to authenticated;
grant select, insert, update on table public.offers to authenticated;
grant select, insert, delete on table public.offer_tags to authenticated;
grant select, insert on table public.price_snapshots to authenticated;

grant usage on sequence public.price_snapshots_id_seq to authenticated;
