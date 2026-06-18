# Plano de migrations da Fase 2

Status: ordem planejada para Fase 2B. Nao implementar SQL nesta fase.

## Convencoes

- Criar migrations com `npx supabase migration new <nome_logico>`.
- Nao inventar timestamps manualmente.
- Aplicar primeiro em banco local descartavel.
- Validar com `npx supabase db reset` e `npx supabase test db`.
- Aplicar em Supabase staging somente apos merge na `main` e confirmacao
  operacional.

## Ordem planejada

| Ordem | Nome logico | Responsabilidade | Dependencias |
| --- | --- | --- | --- |
| 1 | `create_offer_domain_types` | Criar enums minimos de marketplace, status e highlight | Fase 1 |
| 2 | `create_catalog_tables` | Criar `categories` e `tags` | Migration 1 |
| 3 | `create_offer_tables` | Criar `offers`, `offer_tags` e `price_snapshots` | Migrations 1 e 2 |
| 4 | `create_offer_constraints_and_indexes` | Constraints cross-workspace, indices e triggers | Migration 3 |
| 5 | `enable_offer_rls_and_policies` | Habilitar RLS e criar policies | Migrations 2 a 4 |
| 6 | `configure_offer_grants` | Grants minimos para `authenticated` e bloqueio de `anon` | Migration 5 |

## Conteudo esperado

### 1. `create_offer_domain_types`

- `offer_marketplace`: `manual`, `mercado_livre`, `shopee`.
- `offer_status`: somente `captured`.
- `offer_highlight`: `lowest_price`, `coupon`, `free_shipping`,
  `high_commission`.

Nao incluir estados de aprovacao, publicacao ou canais.

### 2. `create_catalog_tables`

- `categories`.
- `tags`.
- FK para `workspaces`.
- Unique por `(workspace_id, slug)`.
- Campos `created_at` e `updated_at`.

### 3. `create_offer_tables`

- `offers`.
- `offer_tags`.
- `price_snapshots`.
- FKs para workspace, categoria, tags, profiles quando aplicavel.
- Sem tabelas de posts, publicacoes, canais ou logs.

### 4. `create_offer_constraints_and_indexes`

- Checks de URL HTTP/HTTPS.
- Checks monetarios e percentuais.
- Checks de currency `BRL`.
- Unique de deduplicacao.
- Indices de listagem/filtros.
- Trigger comum de `updated_at`.
- Validacao de pertencimento ao mesmo workspace onde tecnicamente possivel.

### 5. `enable_offer_rls_and_policies`

- RLS em todas as tabelas novas.
- Policies por Admin/Editor conforme [PHASE_2_RLS_STRATEGY.md](PHASE_2_RLS_STRATEGY.md).
- Bloqueio de suspenso, outro workspace e `anon`.

### 6. `configure_offer_grants`

- Revogar grants desnecessarios.
- `anon` sem acesso direto.
- `authenticated` com grants minimos, sempre controlados por RLS.
- Sem delete amplo.

## Rollback

### Local

- Descartar banco local.
- Corrigir migration ainda nao promovida.
- Reaplicar cadeia com `npx supabase db reset`.

### Staging

- Preferir migration corretiva para frente.
- Antes de rollback destrutivo, confirmar explicitamente com o proprietario.
- Nao apagar dados de staging sem backup/confirmacao.
- Seeds de fixture com usuarios/senhas genericas continuam proibidos em staging.

## Validacoes por migration

- `supabase migration list --local`.
- `npx supabase db reset`.
- Consultar tabelas, constraints, indices e RLS.
- Rodar testes SQL de RLS.
- Rodar testes de captura/snapshot quando app existir.
- Verificar que `anon` nao recebeu grants.

## Criterios para aplicar em staging

- PR mergeado na `main`.
- CI verde usando Supabase local.
- Revisao humana do diff de migrations.
- Confirmacao de que o Supabase remoto e staging.
- Operacao manual controlada ou workflow separado aprovado.
- Plano de recuperacao registrado.
