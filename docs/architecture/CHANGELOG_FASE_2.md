# CHANGELOG FASE 2

Status: implementado localmente para validacao.

Escopo entregue: Captura Manual -> Curadoria -> Score.

## Decisoes aplicadas

- Mantido o escopo MVP da Fase 2B sem aprovacao, agendamento, publicacao, Telegram, IA, scraping ou integracoes externas.
- `workspaceId` nao faz parte dos contratos publicos de ofertas; o workspace ativo e resolvido server-side pela membership ativa.
- RBAC interno permanece restrito a `admin` e `editor`.
- `admin` pode criar e atualizar dados de ofertas; `editor` possui leitura operacional.
- `anon`, usuario suspenso, usuario sem membership e usuario de outro workspace nao acessam tabelas internas.
- `dedupe_key` segue a revisao da Fase 2A:
  - `<marketplace>:external:<external_id>` quando `external_id` existe.
  - `<marketplace>:url:<sha256(canonical_source_url)>` quando nao existe `external_id`.
- `affiliate_url` nao e identidade primaria da oferta.
- `offer_tags` usa delete fisico do vinculo, sem soft delete ou historico.
- Score `mvp-v1` e deterministico, explicavel e nao aprova/publica nada.

## Migrations criadas

- `20260617222718_create_offer_domain_types.sql`
  - enums `offer_marketplace`, `offer_status` e `offer_highlight`.
- `20260617222738_create_catalog_tables.sql`
  - tabelas `categories` e `tags`.
- `20260617222758_create_offer_tables.sql`
  - tabelas `offers`, `offer_tags` e `price_snapshots`.
- `20260617222831_create_offer_constraints_and_indexes.sql`
  - constraints de URL HTTP/HTTPS, indices e triggers `updated_at`.
- `20260617222901_enable_offer_rls_and_policies.sql`
  - RLS e policies por role/workspace.
- `20260617222930_configure_offer_grants.sql`
  - grants minimos para `authenticated` e bloqueio para `anon`.

## Seeds

- Seed local/teste atualizado com:
  - categorias MVP;
  - tags MVP;
  - ofertas de exemplo por workspace;
  - vinculos `offer_tags`;
  - snapshots de preco;
  - cenario multi-workspace para isolamento.
- Seed mantido idempotente via `on conflict`.

## Implementacao TypeScript

- Modulo `src/server/offers` criado com:
  - schemas Zod;
  - normalizacao de URL, moeda, percentual e dedupe key;
  - score deterministico `mvp-v1`;
  - helper `resolveActiveWorkspaceForUser`;
  - contratos `captureOfferManual`, `listOffers`, `getOfferDetail` e `updateOfferManual`;
  - erros de aplicacao e logs estruturados.

## Testes

- Banco/RLS:
  - `supabase/tests/database/phase_2_offers_rls.test.sql`.
- TypeScript:
  - `normalization.test.ts`;
  - `score.test.ts`;
  - `service.test.ts`.

Cobertura validada:

- anon/Public Visitor sem acesso a tabelas internas;
- Admin limitado ao proprio workspace;
- Editor com leitura e sem escrita, validado explicitamente por tabela/operacao:
  - `categories`: sem insert, update ou delete;
  - `tags`: sem insert, update ou delete;
  - `offers`: sem insert, update ou delete;
  - `offer_tags`: sem insert, update ou delete;
  - `price_snapshots`: sem insert, update ou delete;
- usuario suspenso sem acesso;
- usuario sem membership sem acesso;
- isolamento multi-workspace;
- constraints de URL HTTP/HTTPS;
- deduplicacao por `external_id` e URL canonizada;
- snapshots em mudanca relevante de preco/sinais;
- substituicao fisica de `offer_tags`;
- rejeicao de injecao de `workspaceId`;
- score deterministico e fatores explicaveis.

## Comandos executados localmente

```bash
npx supabase db reset
npx supabase test db
npm run typecheck
npm test
```

## Validacao local

- `npx supabase db reset`: passou.
- `npx supabase test db`: passou.
- `npm run typecheck`: passou.
- `npm test`: passou.

## Riscos e limitacoes

- Migrations ainda nao foram aplicadas no Supabase staging por decisao operacional: requer autorizacao explicita do proprietario.
- A camada TypeScript foi implementada como modulo de dominio/servico, sem UI final e sem wiring completo em rotas Next.js.
- Captura automatica por marketplaces permanece fora do MVP desta fase.
- Publicacao, aprovacao e agendamento permanecem fora da Fase 2.
- Score `mvp-v1` e intencionalmente simples; ajustes de peso devem ocorrer apenas em versao futura documentada.

## Proximo gate

Antes de aplicar em staging:

1. Confirmar autorizacao explicita do proprietario.
2. Executar migrations no Supabase staging de forma controlada.
3. Validar schema, RLS e smoke tests no ambiente staging.
4. Registrar evidencias operacionais apos a aplicacao.
