alter table public.offers
  add constraint offers_source_url_http check (source_url ~* '^https?://'),
  add constraint offers_affiliate_url_http check (affiliate_url ~* '^https?://'),
  add constraint offers_image_url_http check (
    image_url is null or image_url ~* '^https?://'
  );

create index categories_workspace_active_name_idx
  on public.categories (workspace_id, is_active, name);

create index tags_workspace_active_name_idx
  on public.tags (workspace_id, is_active, name);

create index offers_workspace_status_score_captured_idx
  on public.offers (workspace_id, status, score desc, captured_at desc);

create index offers_workspace_marketplace_captured_idx
  on public.offers (workspace_id, marketplace, captured_at desc);

create index offers_workspace_category_captured_idx
  on public.offers (workspace_id, category_id, captured_at desc);

create index offers_workspace_discount_idx
  on public.offers (workspace_id, discount_percent desc)
  where discount_percent is not null;

create index offers_workspace_last_seen_idx
  on public.offers (workspace_id, last_seen_at desc);

create index offers_workspace_created_by_idx
  on public.offers (workspace_id, created_by);

create index offers_workspace_updated_by_idx
  on public.offers (workspace_id, updated_by);

create index offer_tags_workspace_tag_idx
  on public.offer_tags (workspace_id, tag_id);

create index offer_tags_workspace_offer_idx
  on public.offer_tags (workspace_id, offer_id);

create index price_snapshots_workspace_offer_observed_idx
  on public.price_snapshots (workspace_id, offer_id, observed_at desc);

create index price_snapshots_offer_observed_idx
  on public.price_snapshots (offer_id, observed_at desc);

create index price_snapshots_workspace_observed_idx
  on public.price_snapshots (workspace_id, observed_at desc);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function app_private.set_updated_at();

create trigger tags_set_updated_at
before update on public.tags
for each row execute function app_private.set_updated_at();

create trigger offers_set_updated_at
before update on public.offers
for each row execute function app_private.set_updated_at();
