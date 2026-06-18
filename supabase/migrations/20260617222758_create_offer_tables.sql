create table public.offers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  marketplace public.offer_marketplace not null,
  external_id text not null,
  dedupe_key text not null,
  source_url text not null,
  affiliate_url text not null,
  title text not null,
  image_url text,
  category_id uuid,
  current_price numeric(12,2) not null,
  previous_price numeric(12,2),
  currency char(3) not null default 'BRL',
  discount_percent numeric(5,2),
  coupon_code text,
  free_shipping boolean not null default false,
  commission_percent numeric(5,2),
  score smallint not null,
  score_version text not null,
  score_factors jsonb not null default '{}'::jsonb,
  highlights public.offer_highlight[] not null default '{}'::public.offer_highlight[],
  status public.offer_status not null default 'captured',
  captured_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_workspace_id_id_unique unique (workspace_id, id),
  constraint offers_workspace_marketplace_external_id_unique unique (
    workspace_id,
    marketplace,
    external_id
  ),
  constraint offers_workspace_dedupe_key_unique unique (workspace_id, dedupe_key),
  constraint offers_workspace_category_fk foreign key (workspace_id, category_id)
    references public.categories(workspace_id, id),
  constraint offers_title_length check (char_length(trim(title)) between 3 and 500),
  constraint offers_current_price_non_negative check (current_price >= 0),
  constraint offers_previous_price_non_negative check (
    previous_price is null or previous_price >= 0
  ),
  constraint offers_currency_brl check (currency = 'BRL'),
  constraint offers_discount_percent_range check (
    discount_percent is null or discount_percent between 0 and 100
  ),
  constraint offers_commission_percent_range check (
    commission_percent is null or commission_percent between 0 and 100
  ),
  constraint offers_coupon_code_length check (
    coupon_code is null or char_length(trim(coupon_code)) between 1 and 80
  ),
  constraint offers_score_range check (score between 0 and 100)
);

create table public.offer_tags (
  workspace_id uuid not null references public.workspaces(id),
  offer_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (offer_id, tag_id),
  constraint offer_tags_workspace_offer_fk foreign key (workspace_id, offer_id)
    references public.offers(workspace_id, id) on delete cascade,
  constraint offer_tags_workspace_tag_fk foreign key (workspace_id, tag_id)
    references public.tags(workspace_id, id) on delete cascade
);

create table public.price_snapshots (
  id bigint generated always as identity primary key,
  workspace_id uuid not null references public.workspaces(id),
  offer_id uuid not null,
  price numeric(12,2) not null,
  previous_price numeric(12,2),
  discount_percent numeric(5,2),
  coupon_code text,
  free_shipping boolean not null default false,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint price_snapshots_workspace_offer_fk foreign key (workspace_id, offer_id)
    references public.offers(workspace_id, id) on delete cascade,
  constraint price_snapshots_offer_observed_at_unique unique (offer_id, observed_at),
  constraint price_snapshots_price_non_negative check (price >= 0),
  constraint price_snapshots_previous_price_non_negative check (
    previous_price is null or previous_price >= 0
  ),
  constraint price_snapshots_discount_percent_range check (
    discount_percent is null or discount_percent between 0 and 100
  )
);
