# Phase 2B Staging Application Report

Data: 2026-06-18

Ambiente: Supabase Staging

Project Ref: `rzakjytqfyjwdmnxhbxz`

Project URL: `https://rzakjytqfyjwdmnxhbxz.supabase.co`

## Escopo autorizado

- Aplicar exclusivamente as 6 migrations da Fase 2B.
- Nao aplicar `supabase/seed.sql`.
- Nao executar operacoes destrutivas.
- Executar smoke tests estruturais apos aplicacao.
- Registrar evidencias e resultado final.

## Migrations aplicadas

Aplicadas via Supabase MCP, em ordem:

| Ordem | Migration local | Nome aplicado no remoto | Status |
| --- | --- | --- | --- |
| 1 | `20260617222718_create_offer_domain_types.sql` | `create_offer_domain_types` | Aplicada |
| 2 | `20260617222738_create_catalog_tables.sql` | `create_catalog_tables` | Aplicada |
| 3 | `20260617222758_create_offer_tables.sql` | `create_offer_tables` | Aplicada |
| 4 | `20260617222831_create_offer_constraints_and_indexes.sql` | `create_offer_constraints_and_indexes` | Aplicada |
| 5 | `20260617222901_enable_offer_rls_and_policies.sql` | `enable_offer_rls_and_policies` | Aplicada |
| 6 | `20260617222930_configure_offer_grants.sql` | `configure_offer_grants` | Aplicada |

## Historico remoto observado

Apos a aplicacao, o historico remoto retornou:

| Version remota | Name |
| --- | --- |
| `20260618005147` | `create_offer_domain_types` |
| `20260618005212` | `create_catalog_tables` |
| `20260618005241` | `create_offer_tables` |
| `20260618005302` | `create_offer_constraints_and_indexes` |
| `20260618005327` | `enable_offer_rls_and_policies` |
| `20260618005342` | `configure_offer_grants` |

Observacao operacional:

- O Supabase MCP gerou versions remotas no momento da aplicacao.
- Os nomes das migrations correspondem aos arquivos locais.
- As versions remotas nao correspondem aos timestamps dos arquivos locais.
- Nao foi feito ajuste manual no historico de migrations.
- Antes de usar `supabase db push` futuramente com o CLI local, revisar o alinhamento de historico para evitar tentativa de reaplicacao das migrations locais.

## Objetos validados

Enums:

- `public.offer_marketplace`: `manual`, `mercado_livre`, `shopee`
- `public.offer_status`: `captured`
- `public.offer_highlight`: `lowest_price`, `coupon`, `free_shipping`, `high_commission`

Tabelas:

- `public.categories`
- `public.tags`
- `public.offers`
- `public.offer_tags`
- `public.price_snapshots`

RLS:

- RLS habilitado nas 5 tabelas da Fase 2B.

Policies observadas:

- `categories`: 3 policies
- `tags`: 3 policies
- `offers`: 3 policies
- `offer_tags`: 3 policies
- `price_snapshots`: 2 policies

Seeds:

- `supabase/seed.sql` nao foi aplicado.
- Contagem de linhas observada apos aplicacao:
  - `categories`: 0
  - `tags`: 0
  - `offers`: 0
  - `offer_tags`: 0
  - `price_snapshots`: 0

## Grants validados

`anon`:

- Sem `select` em `categories`, `tags`, `offers`, `offer_tags` e `price_snapshots`.

`authenticated`:

- `categories`: `select`, `insert`, `update`; sem `delete`.
- `tags`: `select`, `insert`, `update`; sem `delete`.
- `offers`: `select`, `insert`, `update`; sem `delete`.
- `offer_tags`: `select`, `insert`, `delete`; sem `update`.
- `price_snapshots`: `select`, `insert`; sem `update` e sem `delete`.

O acesso efetivo continua protegido por RLS.

## Constraints, indices e triggers

Smoke test estrutural retornou:

- `missing_constraints`: `[]`
- `missing_indexes`: `[]`
- `missing_triggers`: `[]`

## Comandos/ferramentas usados

Tentativa via CLI:

```bash
npx.cmd supabase --version
npx.cmd supabase migration list
npx.cmd supabase link --project-ref rzakjytqfyjwdmnxhbxz
```

Resultado:

- CLI instalado: `2.106.0`.
- CLI nao estava linkado.
- Link via CLI falhou por ausencia de `SUPABASE_ACCESS_TOKEN`.

Aplicacao efetiva:

- Supabase MCP `_apply_migration`, uma migration por vez.
- Supabase MCP `_list_migrations`.
- Supabase MCP `_execute_sql` para smoke tests estruturais.

## Resultado

Aplicacao em staging: concluida.

Seeds em staging: nao aplicados.

Operacoes destrutivas: nao executadas.

Smoke tests estruturais: passaram.

## Riscos residuais

- Historico remoto das migrations da Fase 2B esta com versions geradas pelo MCP, nao com os timestamps locais dos arquivos.
- Futuras operacoes com Supabase CLI devem revisar esse alinhamento antes de executar `db push`.
- Nao foram executados testes pgTAP diretamente no staging, apenas smoke tests estruturais sem seed/dados fixture.

## Recomendacao

Antes da proxima migration remota, definir uma estrategia unica de aplicacao:

1. Preferencial: autenticar Supabase CLI com `SUPABASE_ACCESS_TOKEN` e usar `supabase db push`.
2. Alternativa: continuar usando Supabase MCP e documentar explicitamente que as versions remotas serao geradas pelo MCP.
3. Se for necessario alinhar versions locais/remotas, planejar isso como operacao separada e controlada, sem editar historico manualmente sem confirmacao.

## Reconciliacao de historico

Data: 2026-06-18

Operacao autorizada pelo proprietario apos plano de reconciliacao.

Comandos executados:

```bash
npx.cmd supabase migration list
npx.cmd supabase migration repair --linked --status applied 20260617222718 20260617222738 20260617222758 20260617222831 20260617222901 20260617222930
npx.cmd supabase migration repair --linked --status reverted 20260618005147 20260618005212 20260618005241 20260618005302 20260618005327 20260618005342
npx.cmd supabase migration list
```

Resultado:

- As 6 migrations locais da Fase 2B foram marcadas como `applied` no historico remoto.
- As 6 versions geradas pelo MCP foram marcadas como `reverted` no historico remoto.
- `supabase migration list` passou a mostrar alinhamento local/remoto da Fase 1 e Fase 2B.
- Nenhuma alteracao de schema ou dados foi executada durante o reparo.

Validacao estrutural remota apos reconciliacao:

- Historico ativo da Fase 2B contem apenas:
  - `20260617222718_create_offer_domain_types`
  - `20260617222738_create_catalog_tables`
  - `20260617222758_create_offer_tables`
  - `20260617222831_create_offer_constraints_and_indexes`
  - `20260617222901_enable_offer_rls_and_policies`
  - `20260617222930_configure_offer_grants`
- RLS continua habilitado nas 5 tabelas da Fase 2B.
- Contagem de policies permanece esperada:
  - `categories`: 3
  - `tags`: 3
  - `offers`: 3
  - `offer_tags`: 3
  - `price_snapshots`: 2
- `anon` continua sem `select` nas tabelas internas.
- Seeds continuam nao aplicados em staging:
  - `categories`: 0
  - `tags`: 0
  - `offers`: 0
  - `offer_tags`: 0
  - `price_snapshots`: 0

Validacao `db diff --linked`:

- Comando tentado:

```bash
npx.cmd supabase db diff --linked
```

- Resultado: inconclusivo por conflito local de porta Docker no shadow database (`54320`).
- O erro ocorreu antes da comparacao final de schema.
- Nao indica falha no staging nem falha no reparo de historico.
- Recomendacao: liberar a porta local/encerrar processo conflitante e repetir `db diff --linked` antes da proxima operacao remota de migration.
