# Modelo de dados Supabase

## Convencoes

- Schema exposto: `public`, sempre com RLS.
- Funcoes privilegiadas: schema privado `app_private`.
- IDs: `uuid` com default gerado pelo banco.
- Datas: `timestamptz`, armazenadas em UTC.
- Valores monetarios: `numeric(12,2)` e moeda `char(3)`.
- Tabelas mutaveis: `created_at`, `updated_at`.
- Dados de negocio: `workspace_id` obrigatorio.
- JSONB somente para payload variavel, fatores explicaveis e metadados
  mascarados; campos consultados ficam tipados.

## Enums

| Enum | Valores |
|---|---|
| `app_role` | `admin`, `editor` |
| `member_status` | `active`, `suspended`, `invited` |
| `marketplace_type` | `mercado_livre`, `shopee`, `manual` |
| `offer_status` | `captured`, `review`, `approved`, `scheduled`, `published`, `rejected` |
| `channel_type` | `telegram`, `whatsapp`, `social` |
| `channel_status` | `connected`, `warning`, `paused`, `disconnected` |
| `integration_status` | `connected`, `warning`, `paused`, `disconnected` |
| `post_status` | `draft`, `approved`, `rejected` |
| `publication_status` | `scheduled`, `processing`, `published`, `failed`, `cancelled` |
| `job_type` | `capture_offers`, `refresh_prices`, `publish_scheduled`, `publish_single` |
| `job_status` | `queued`, `running`, `succeeded`, `failed`, `dead` |
| `log_severity` | `info`, `warning`, `error` |
| `audit_action` | `offer_captured`, `offer_sent_to_review`, `post_edited`, `offer_approved`, `offer_rejected`, `publication_scheduled`, `publication_rescheduled`, `publication_cancelled`, `publication_reprocessed`, `channel_configured`, `channel_connection_tested`, `channel_paused`, `channel_resumed`, `user_invited`, `member_role_changed`, `member_suspended` |

## Relacionamentos

```text
auth.users 1--1 profiles
workspaces 1--N workspace_members N--1 profiles
workspaces 1--N offers 1--N price_snapshots
offers N--1 categories
offers 1--N post_drafts 1--N publications N--1 publication_channels
publications 1--N click_events
workspaces 1--N job_runs
workspaces 1--N automation_logs
workspaces 1--N audit_logs
```

## Tabelas de identidade

### `workspaces`

Fronteira de isolamento. O MVP cria um unico workspace por seed.

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | not null, 2..120 |
| `slug` | citext | unique, not null |
| `timezone` | text | not null, default `America/Sao_Paulo` |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

### `profiles`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK, FK `auth.users(id)` on delete cascade |
| `display_name` | text | not null |
| `avatar_url` | text | nullable |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

### `workspace_members`

| Coluna | Tipo | Regras |
|---|---|---|
| `workspace_id` | uuid | FK workspaces, not null |
| `user_id` | uuid | FK profiles, not null |
| `role` | app_role | not null |
| `status` | member_status | not null, default active |
| `invited_by` | uuid | FK profiles, nullable |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

PK composta `(workspace_id, user_id)`. Indices em `(user_id, status)` e
`(workspace_id, role, status)`.

## Tabelas de catalogo e curadoria

### `categories`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `name` | text | not null |
| `slug` | text | not null |
| `color` | text | not null |
| `is_active` | boolean | default true |
| `created_at`, `updated_at` | timestamptz | not null |

Unique `(workspace_id, slug)`.

### `tags`

Suporta o seletor e a tela aprovados. No MVP, Admin mantem um conjunto simples;
regras automaticas ficam pÃ³s-MVP.

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `name` | text | not null |
| `slug` | text | not null |
| `color` | text | nullable |
| `is_active` | boolean | default true |
| `created_at`, `updated_at` | timestamptz | not null |

Unique `(workspace_id, slug)`.

### `offers`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `marketplace` | marketplace_type | not null |
| `external_id` | text | not null |
| `source_url` | text | not null |
| `affiliate_url` | text | not null |
| `title` | text | not null, max 500 |
| `image_url` | text | nullable |
| `category_id` | uuid | FK categories, nullable |
| `current_price` | numeric(12,2) | not null, >= 0 |
| `previous_price` | numeric(12,2) | nullable, >= 0 |
| `currency` | char(3) | not null, default `BRL` |
| `discount_percent` | numeric(5,2) | nullable, 0..100 |
| `coupon_code` | text | nullable |
| `free_shipping` | boolean | not null, default false |
| `commission_percent` | numeric(5,2) | nullable, 0..100 |
| `score` | smallint | not null, 0..100 |
| `score_version` | text | not null |
| `score_factors` | jsonb | not null, default `{}` |
| `highlights` | text[] | not null, default `{}` |
| `status` | offer_status | not null, default captured |
| `captured_at` | timestamptz | not null |
| `last_seen_at` | timestamptz | not null |
| `created_at`, `updated_at` | timestamptz | not null |

Constraints:

- Unique `(workspace_id, marketplace, external_id)`.
- `affiliate_url` e `source_url` devem ser HTTP(S), validados tambem no servidor.
- Highlights permitidos: `lowest_price`, `coupon`, `free_shipping`,
  `high_commission`.

Indices:

- `(workspace_id, status, score desc, captured_at desc)`.
- `(workspace_id, marketplace, captured_at desc)`.
- `(workspace_id, category_id, captured_at desc)`.
- `(workspace_id, discount_percent desc)` parcial onde desconto nao e null.
- Busca textual por titulo e opcional apÃ³s medicao; nao ativar extensao sem uso.

### `offer_tags`

| Coluna | Tipo | Regras |
|---|---|---|
| `offer_id` | uuid | FK offers on delete cascade |
| `tag_id` | uuid | FK tags on delete cascade |
| `workspace_id` | uuid | FK, not null |

PK `(offer_id, tag_id)`. Oferta e tag devem pertencer ao mesmo workspace.

### `price_snapshots`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | bigint identity | PK |
| `workspace_id` | uuid | FK, not null |
| `offer_id` | uuid | FK offers on delete cascade |
| `price` | numeric(12,2) | not null, >= 0 |
| `previous_price` | numeric(12,2) | nullable |
| `coupon_code` | text | nullable |
| `observed_at` | timestamptz | not null |
| `source_run_id` | uuid | FK job_runs, nullable |

Unique `(offer_id, observed_at)`. Indice `(offer_id, observed_at desc)`.

### `coupons`

Existe para sustentar a tela aprovada, mas no MVP e somente leitura/importacao.

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `marketplace` | marketplace_type | not null |
| `code` | text | not null |
| `benefit_text` | text | not null |
| `rules_text` | text | nullable |
| `starts_at`, `expires_at` | timestamptz | nullable |
| `is_active` | boolean | default true |
| `created_at`, `updated_at` | timestamptz | not null |

Unique `(workspace_id, marketplace, code)`.

### `integration_sources`

Representa status e configuracao nao sensivel dos conectores. Segredos ficam
fora de `public`.

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `provider` | marketplace_type | not null |
| `name` | text | not null |
| `status` | integration_status | not null |
| `public_config` | jsonb | not null, default `{}`, sem segredos |
| `last_tested_at`, `last_synced_at` | timestamptz | nullable |
| `created_at`, `updated_at` | timestamptz | not null |

Unique `(workspace_id, provider, name)`.

## Conteudo, aprovacao e publicacao

### `post_drafts`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `offer_id` | uuid | FK offers, not null |
| `channel_type` | channel_type | not null, MVP: telegram |
| `internal_title` | text | nullable |
| `body` | text | not null |
| `cta_text` | text | nullable |
| `affiliate_url` | text | not null |
| `image_url` | text | nullable |
| `notes` | text | nullable |
| `status` | post_status | not null, default draft |
| `rejection_reason` | text | nullable |
| `last_edited_by` | uuid | FK profiles |
| `approved_by` | uuid | FK profiles, nullable |
| `approved_at` | timestamptz | nullable |
| `version` | integer | not null, default 1 |
| `created_at`, `updated_at` | timestamptz | not null |

Unique `(offer_id, channel_type)` no MVP. Constraint exige motivo quando
`status = rejected`, e aprovador/data quando `status = approved`.

### `publication_channels`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `type` | channel_type | not null |
| `name` | text | not null |
| `external_identifier` | text | not null |
| `status` | channel_status | not null |
| `last_tested_at` | timestamptz | nullable |
| `last_published_at` | timestamptz | nullable |
| `created_at`, `updated_at` | timestamptz | not null |

MVP permite somente `type = telegram` ativo. Token do bot fica em secret
server-side e nao existe em tabela do schema `public`.

### `publications`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `post_draft_id` | uuid | FK post_drafts, not null |
| `channel_id` | uuid | FK publication_channels, not null |
| `status` | publication_status | not null, default scheduled |
| `scheduled_for` | timestamptz | not null |
| `idempotency_key` | text | not null |
| `attempt_count` | smallint | not null, default 0 |
| `next_attempt_at` | timestamptz | nullable |
| `locked_at` | timestamptz | nullable |
| `locked_by` | text | nullable |
| `external_message_id` | text | nullable |
| `published_at` | timestamptz | nullable |
| `last_error_code` | text | nullable |
| `last_error_message` | text | nullable, sanitizado |
| `created_by` | uuid | FK profiles |
| `created_at`, `updated_at` | timestamptz | not null |

Unique `(workspace_id, idempotency_key)`. Indice parcial para job em
`(scheduled_for, next_attempt_at)` onde status em `scheduled, failed`.

### `redirect_links`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK |
| `workspace_id` | uuid | FK, not null |
| `publication_id` | uuid | FK publications, not null |
| `short_code` | text | unique, not null |
| `destination_url` | text | not null |
| `is_active` | boolean | default true |
| `created_at` | timestamptz | not null |

### `click_events`

Tabela append-only, acessada para escrita somente pelo redirect server-side.

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | bigint identity | PK |
| `workspace_id` | uuid | FK, not null |
| `publication_id` | uuid | FK, not null |
| `redirect_link_id` | uuid | FK, not null |
| `occurred_at` | timestamptz | not null |
| `referrer_host` | text | nullable |
| `user_agent_family` | text | nullable |
| `ip_hash` | text | nullable, hash com salt rotacionavel |

Indice `(workspace_id, occurred_at desc)` e `(publication_id, occurred_at desc)`.
Nao guardar IP bruto.

## Jobs, logs e auditoria

### `job_runs`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | uuid | PK/correlation ID |
| `workspace_id` | uuid | FK, nullable para job global |
| `type` | job_type | not null |
| `status` | job_status | not null |
| `idempotency_key` | text | unique, not null |
| `attempt` | smallint | not null, default 1 |
| `started_at`, `finished_at` | timestamptz | nullable |
| `next_attempt_at` | timestamptz | nullable |
| `summary` | jsonb | not null, default `{}` |
| `error_code`, `error_message` | text | nullable, sanitizados |
| `created_at` | timestamptz | not null |

### `automation_logs`

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | bigint identity | PK |
| `workspace_id` | uuid | FK, not null |
| `job_run_id` | uuid | FK job_runs, nullable |
| `publication_id` | uuid | FK publications, nullable |
| `severity` | log_severity | not null |
| `event_type` | text | not null |
| `human_message` | text | not null |
| `technical_details` | jsonb | not null, default `{}`, mascarado |
| `created_at` | timestamptz | not null |

Indices `(workspace_id, created_at desc)`, `(publication_id, created_at desc)`.

### `audit_logs`

Append-only e imutavel para clientes.

| Coluna | Tipo | Regras |
|---|---|---|
| `id` | bigint identity | PK |
| `workspace_id` | uuid | FK, not null |
| `actor_user_id` | uuid | FK profiles, nullable para sistema |
| `action` | audit_action | not null |
| `entity_type` | text | not null |
| `entity_id` | uuid | nullable |
| `before_data` | jsonb | default `{}`, sem segredos |
| `after_data` | jsonb | default `{}`, sem segredos |
| `request_id` | uuid | not null |
| `created_at` | timestamptz | not null |

Indices `(workspace_id, created_at desc)` e `(entity_type, entity_id)`.

## Exemplos de registros

### Oferta

```json
{
  "marketplace": "mercado_livre",
  "external_id": "MLB123",
  "title": "Fone Bluetooth",
  "current_price": 129.90,
  "previous_price": 199.90,
  "discount_percent": 35.02,
  "score": 92,
  "score_version": "mvp-v1",
  "score_factors": {
    "discount": 35,
    "price_history": 30,
    "commission": 15,
    "reliability": 12
  },
  "highlights": ["lowest_price", "free_shipping"],
  "status": "review"
}
```

### Publicacao

```json
{
  "status": "scheduled",
  "scheduled_for": "2026-06-12T21:30:00Z",
  "idempotency_key": "post-draft-id:channel-id:2026-06-12T21:30:00Z",
  "attempt_count": 0
}
```

## Integridade e transicoes

- Atualizar `updated_at` por trigger comum.
- Transicoes de oferta/post/publicacao passam por funcoes/acoes server-side que
  validam estado anterior e papel.
- Aprovar rascunho e criar agendamento devem ocorrer na mesma transacao.
- Claim de publicacao usa lock/`skip locked` ou funcao atomica equivalente.
- Audit log da acao sensivel e gravado na mesma transacao sempre que possivel.

## Fora do MVP no banco

- Tabelas de campanhas, conversoes/revenue, regras de categoria, filtros salvos,
  notificacoes, experimentos, IA, multi-workspace configuravel e canais
  WhatsApp/social executaveis.
- Particionamento de logs/clicks; revisar somente quando volume justificar.
- Materialized views de analytics; usar consultas/indexes simples no MVP.
