# Modelo de dominio de ofertas

Status: especificacao para migrations futuras da Fase 2B.

## Principios

- Todo dado de negocio pertence a um `workspace_id`.
- Public Visitor nao cria Auth, profile, membership ou registros internos.
- `anon` nao recebe acesso direto a tabelas internas.
- Valores monetarios usam `numeric(12,2)`.
- Moeda padrao: `BRL`.
- Dados externos sao nao confiaveis e sempre normalizados no servidor.
- `source_url` e `affiliate_url` aceitam somente HTTP/HTTPS.
- Nenhuma tabela desta fase representa aprovacao, agendamento ou publicacao.

## Enums

### `offer_marketplace`

Valores permitidos na Fase 2:

- `manual`
- `mercado_livre`
- `shopee`

Observacao: `mercado_livre` e `shopee` sao apenas classificadores de origem
manual e filtros. Eles nao implicam integracao oficial, API ou scraping.

### `offer_status`

Valores permitidos na Fase 2:

- `captured`

Estados de aprovacao/publicacao ficam para fases futuras. A Fase 2 nao deve
criar workflow editorial.

### `offer_highlight`

Valores permitidos:

- `lowest_price`
- `coupon`
- `free_shipping`
- `high_commission`

## `categories`

Finalidade: organizar a curadoria e habilitar filtros basicos.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | uuid | PK, default gerado pelo banco |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `name` | text | not null, 2..80 |
| `slug` | text | not null, normalizado lowercase kebab-case |
| `color` | text | not null, hex `#RRGGBB` |
| `is_active` | boolean | not null, default true |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Constraints:

- unique `(workspace_id, slug)`.
- `name` sem string vazia apos trim.
- `color` em formato hex simples.

Indices:

- `(workspace_id, is_active, name)`.

## `tags`

Finalidade: classificar ofertas de forma simples, sem regras automaticas.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `name` | text | not null, 2..60 |
| `slug` | text | not null |
| `color` | text | nullable, hex quando informado |
| `is_active` | boolean | not null, default true |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Constraints:

- unique `(workspace_id, slug)`.
- `name` sem string vazia apos trim.

Indices:

- `(workspace_id, is_active, name)`.

## `offers`

Finalidade: representar uma oferta capturada manualmente, deduplicada e
pontuada.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `marketplace` | offer_marketplace | not null |
| `external_id` | text | not null |
| `dedupe_key` | text | not null, gerado pelo servidor |
| `source_url` | text | not null, HTTP/HTTPS |
| `affiliate_url` | text | not null, HTTP/HTTPS |
| `title` | text | not null, 3..500 |
| `image_url` | text | nullable, HTTP/HTTPS quando informado |
| `category_id` | uuid | FK `categories(id)`, nullable |
| `current_price` | numeric(12,2) | not null, >= 0 |
| `previous_price` | numeric(12,2) | nullable, >= 0 |
| `currency` | char(3) | not null, default `BRL` |
| `discount_percent` | numeric(5,2) | nullable, 0..100 |
| `coupon_code` | text | nullable, max 80 |
| `free_shipping` | boolean | not null, default false |
| `commission_percent` | numeric(5,2) | nullable, 0..100 |
| `score` | smallint | not null, 0..100 |
| `score_version` | text | not null |
| `score_factors` | jsonb | not null, default `{}` |
| `highlights` | offer_highlight[] | not null, default `{}` |
| `status` | offer_status | not null, default `captured` |
| `captured_at` | timestamptz | not null |
| `last_seen_at` | timestamptz | not null |
| `created_by` | uuid | FK `profiles(id)`, nullable |
| `updated_by` | uuid | FK `profiles(id)`, nullable |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Constraints:

- unique `(workspace_id, marketplace, external_id)`.
- unique `(workspace_id, dedupe_key)`.
- `category_id`, quando informado, deve pertencer ao mesmo workspace.
- `source_url`, `affiliate_url` e `image_url` validam HTTP/HTTPS no banco e no servidor.
- `currency = 'BRL'` na Fase 2.
- `previous_price` nao pode ser menor que zero.
- `discount_percent` deve ser derivado de `previous_price` quando possivel.

Indices:

- `(workspace_id, status, score desc, captured_at desc)`.
- `(workspace_id, marketplace, captured_at desc)`.
- `(workspace_id, category_id, captured_at desc)`.
- `(workspace_id, discount_percent desc)` parcial onde `discount_percent is not null`.
- `(workspace_id, last_seen_at desc)`.

## `offer_tags`

Finalidade: relacao N:N entre ofertas e tags.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `offer_id` | uuid | FK `offers(id)` on delete cascade |
| `tag_id` | uuid | FK `tags(id)` on delete cascade |
| `created_at` | timestamptz | not null |

PK:

- `(offer_id, tag_id)`.

Constraints:

- oferta e tag devem pertencer ao mesmo `workspace_id`.
- unique implicito pela PK.

Indices:

- `(workspace_id, tag_id)`.
- `(workspace_id, offer_id)`.

## `price_snapshots`

Finalidade: registrar historico de preco observado pela captura manual.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | bigint identity | PK |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `offer_id` | uuid | FK `offers(id)` on delete cascade |
| `price` | numeric(12,2) | not null, >= 0 |
| `previous_price` | numeric(12,2) | nullable, >= 0 |
| `discount_percent` | numeric(5,2) | nullable, 0..100 |
| `coupon_code` | text | nullable |
| `free_shipping` | boolean | not null, default false |
| `observed_at` | timestamptz | not null |
| `created_at` | timestamptz | not null |

Constraints:

- snapshot pertence ao mesmo workspace da oferta.
- unique `(offer_id, observed_at)`.
- Fase 2B deve evitar criar novo snapshot quando preco e sinais relevantes nao mudarem.

Indices:

- `(workspace_id, offer_id, observed_at desc)`.
- `(offer_id, observed_at desc)`.
- `(workspace_id, observed_at desc)`.

## Relacionamentos

```text
workspaces 1--N categories
workspaces 1--N tags
workspaces 1--N offers
categories 1--N offers
offers N--N tags via offer_tags
offers 1--N price_snapshots
profiles 1--N offers.created_by
profiles 1--N offers.updated_by
```

## Estados permitidos na Fase 2

- Categoria: ativa ou inativa.
- Tag: ativa ou inativa.
- Oferta: apenas `captured`.
- Snapshot: append-only, sem update/delete pelo cliente.

## Itens removidos por nao serem MVP da Fase 2

- `post_drafts`
- `publications`
- `publication_channels`
- `redirect_links`
- `click_events`
- `coupons` como tabela gerenciavel
- `integration_sources`
- `job_runs`
- `automation_logs`
- `audit_logs` amplo
