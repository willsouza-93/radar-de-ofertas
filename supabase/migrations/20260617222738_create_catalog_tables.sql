create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null,
  slug text not null,
  color text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_workspace_id_id_unique unique (workspace_id, id),
  constraint categories_workspace_slug_unique unique (workspace_id, slug),
  constraint categories_name_length check (char_length(trim(name)) between 2 and 80),
  constraint categories_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint categories_color_hex check (color ~ '^#[0-9A-Fa-f]{6}$')
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id),
  name text not null,
  slug text not null,
  color text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_workspace_id_id_unique unique (workspace_id, id),
  constraint tags_workspace_slug_unique unique (workspace_id, slug),
  constraint tags_name_length check (char_length(trim(name)) between 2 and 60),
  constraint tags_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint tags_color_hex check (color is null or color ~ '^#[0-9A-Fa-f]{6}$')
);
