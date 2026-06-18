create type public.offer_marketplace as enum (
  'manual',
  'mercado_livre',
  'shopee'
);

create type public.offer_status as enum (
  'captured'
);

create type public.offer_highlight as enum (
  'lowest_price',
  'coupon',
  'free_shipping',
  'high_commission'
);
