# Phase 5C.1 Local Validation Report

Status: implementado localmente para revisao.

## Objetivo

Resolver o bloqueio entre captura e curadoria identificado na Fase 5C.

Antes:

`Manual Input -> RawOffer -> Capture Pipeline -> offers -> price_snapshots`

Depois:

`Manual Input -> RawOffer -> Capture Pipeline -> offers -> price_snapshots -> submit_capture_for_review -> approval_queue.pending`

## Decisao arquitetural

Foi criada uma RPC oficial:

```sql
public.submit_capture_for_review(
  target_offer_id uuid,
  target_priority_score integer,
  target_reentry_reason text default null,
  target_capture_run_id text default null,
  target_correlation_id text default null
)
```

A RPC e a unica superficie permitida para materializar fila de curadoria a
partir de captura.

## Invariantes

- A RPC nao aceita `workspaceId`.
- O workspace e derivado exclusivamente de `offers.id`.
- Apenas Admin ativo do workspace pode executar.
- Editor nao executa.
- Usuario suspenso nao executa.
- Usuario sem membership nao executa.
- Admin de outro workspace nao executa.
- Anon/Public Visitor nao executa.
- Uma oferta possui no maximo uma revisao pendente por workspace.
- Captura repetida de oferta pendente nao cria nova `approval_queue`.
- Captura nao cria `approval_decisions`.
- Reentrada de fila terminal exige `material_change` ou `cooldown_elapsed`.
- Fila terminal sem motivo explicito de reentrada retorna `not_reentered`.
- `material_change` exige evidencia persistida em `price_snapshots` observada
  depois da ultima revisao editorial.
- Mudanca isolada de comissao nao reabre antes do cooldown enquanto o schema
  atual nao guardar historico persistido de comissao.
- Toda materializacao/reentrada registra nota operacional com `captureRunId` e
  `correlationId`.

## Fluxo

1. Admin executa import manual.
2. Connector manual produz `RawOffer`.
3. Capture Pipeline normaliza, valida, deduplica e calcula score estrutural.
4. Adapter persiste/atualiza `offers`.
5. Adapter cria `price_snapshots` quando aplicavel.
6. Adapter chama `submit_capture_for_review`.
7. RPC deriva workspace via `offer_id`.
8. RPC cria, retorna ou reabre fila conforme estado editorial.

## Comportamentos

| Cenario | Resultado |
| --- | --- |
| Oferta sem fila | Cria `approval_queue.pending` |
| Oferta ja pendente | Retorna fila existente, nao duplica |
| Oferta aprovada sem cooldown | Retorna terminal existente, sem reentrada |
| Oferta aprovada com cooldown | Reabre fila como `pending` |
| Oferta rejeitada com mudanca material | Reabre fila como `pending` |
| Oferta terminal sem motivo | Retorna terminal existente, sem reentrada |
| Mudanca material antiga | Retorna terminal existente, sem reentrada |
| Mudanca apenas de comissao antes do cooldown | Retorna terminal existente, sem reentrada |
| Editor | `42501` |
| Suspenso | `42501` |
| Outro workspace | `42501` |
| Anon | `42501` |

## Testes

### pgTAP

Arquivo:

- `supabase/tests/database/phase_5c1_capture_review_rpc.test.sql`

Cobertura:

- grants da RPC;
- assinatura sem `workspaceId`;
- Admin cria fila;
- repeticao nao duplica;
- cooldown editorial;
- mudanca material;
- motivo de reentrada ausente;
- evidencia material anterior a ultima revisao;
- bloqueios de permissao;
- ausencia de `approval_decisions` automaticas.

### TypeScript

Cobertura:

- `SupabaseCapturePersistenceRepository` chama RPC;
- reentrada usa a mesma RPC;
- captura repetida com mudanca material cria snapshot e mantem uma fila;
- comissao isolada nao reabre fila terminal antes do cooldown sem evidencia
  persistida especifica.

## Seguranca

- Sem service role.
- Sem grants diretos de `insert/update/delete` em `approval_queue`.
- Sem workspace vindo do cliente.
- Sem bypass de `approval_decisions`.
- `security definer` usado apenas na RPC controlada, com `auth.uid()` e
  verificacao de role interna.

## Limitacoes

- A reentrada terminal usa a mesma linha de `approval_queue`, pois o schema
  atual possui unique `(workspace_id, offer_id)`.
- O historico de decisoes permanece em `approval_decisions`; a fila reaberta
  limpa ponteiros terminais atuais para voltar ao estado operacional `pending`.
- O score usado pelo pipeline continua estrutural (`capture-structure-v1`).

## Validacoes locais executadas

Executado em 2026-06-27:

| Comando | Resultado |
| --- | --- |
| `npx.cmd supabase db reset` | PASS |
| `npx.cmd supabase test db` | PASS - 4 arquivos, 130 testes pgTAP |
| `npm.cmd run typecheck` | PASS |
| `npm.cmd test` | PASS - 16 arquivos, 105 testes |
| `npm.cmd run build` | PASS |
| `git diff --check` | PASS |
| `npx.cmd supabase db advisors --local --type security --fail-on none` | PASS - nenhum achado |

Observacao operacional: no Windows, o stack local exigiu
`supabase start --ignore-health-check` por healthchecks auxiliares instaveis,
sem impacto nas migrations ou testes de banco.
