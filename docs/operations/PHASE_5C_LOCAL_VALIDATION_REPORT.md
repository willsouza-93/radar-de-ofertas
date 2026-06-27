# Phase 5C Local Validation Report

Status: implementado localmente para revisao.

## Escopo validado

- Primeiro connector real: `manual-import`.
- Entrada administrativa via JSON em `/capture/manual`.
- Conversao de entrada manual para `RawOffer`.
- Execucao do Capture Pipeline da Fase 5B.
- Persistencia server-side em `offers` e `price_snapshots` usando cliente
  autenticado e RLS.
- Avaliacao de materializacao de `approval_queue`, sem mutacao direta da fila.
- Reentrada editorial com cooldown de 24 horas no adapter.

## Fora de escopo preservado

- Nenhuma migration.
- Nenhuma nova tabela.
- Nenhuma alteracao de RLS.
- Nenhum scheduler.
- Nenhuma Edge Function.
- Nenhuma API externa.
- Nenhum marketplace real.
- Nenhum Telegram.
- Nenhuma IA.
- Nenhum scraping.
- Nenhuma alteracao em staging ou producao.

## Fluxo implementado

1. Admin acessa `/capture/manual`.
2. Admin cola JSON com `records`.
3. Server Action valida o payload.
4. `ManualConnector` produz `RawOffer`.
5. `CapturePipeline` normaliza, valida, deduplica e calcula score estrutural.
6. Adapter persiste ofertas novas ou atualiza ofertas existentes.
7. Adapter cria snapshot quando ha mudanca relevante.
8. Adapter avalia reentrada editorial.
9. Adapter retorna aviso quando a oferta deveria entrar na curadoria, pois a
   fila exige RPC segura futura.

## Limites conhecidos

### `approval_queue`

A curadoria foi endurecida na Fase 3B para impedir bypass de auditoria. No
schema atual:

- `approval_queue` nao permite `INSERT`/`UPDATE` por clientes autenticados;
- `approval_decisions` nao permite inserts diretos;
- aprovar/rejeitar deve passar por `apply_approval_decision`.

Como a Fase 5C proibiu migrations, nao foi criada funcao nova para materializar
fila de captura. Assim, a importacao pode persistir `offers` e
`price_snapshots`, mas nao cria/reabre `approval_queue` no Supabase real.

O repositório Supabase nao tenta `insert` ou `update` direto em
`approval_queue`, preservando a protecao contra bypass de auditoria criada na
Fase 3B.

### `affiliateUrl`

O dominio de captura aceita `affiliateUrl` ausente, conforme Fase 5B. O schema
existente de `offers` ainda exige `affiliate_url not null`. Resultado:

- captura sem `affiliateUrl` permanece valida no pipeline;
- nova oferta sem `affiliateUrl` nao e persistida em `offers`;
- oferta existente pode manter o `affiliateUrl` anterior se uma recaptura vier
  sem esse campo.

## Testes executados

- `npm.cmd run typecheck`
- `npm.cmd test`

Resultado parcial registrado durante a implementacao:

- Typecheck: passou.
- Vitest: 15 arquivos, 100 testes passando.

As validacoes finais da fase devem incluir tambem:

- `npm.cmd run build`
- `git diff --check`

## Evidencias funcionais

- Connector manual nao contem regra de negocio.
- Adapter centraliza a ponte entre entrada manual, pipeline e persistencia.
- Workspace e ator sao resolvidos no servidor.
- Editor nao tem acesso a import manual.
- CorrelationId e CaptureRunId sao gerados por execucao.
- Logs estruturados do pipeline sao preservados no resultado interno.
- A Fase 5C prova `Manual input -> RawOffer -> Pipeline -> offers/snapshots`.
- A Fase 5C ainda nao prova `Manual input -> RawOffer -> Pipeline ->
  Persistence -> Curadoria` no Supabase real.

## Contrato recomendado para RPC futura

Recomendacao para uma Fase 5C.1 ou ajuste explicitamente aprovado:

```sql
public.materialize_capture_approval_queue(
  target_offer_id uuid,
  target_priority_score integer,
  target_capture_run_id text default null,
  target_correlation_id text default null,
  target_reentry_reason text default null
)
returns table (
  queue_id uuid,
  offer_id uuid,
  queue_status public.approval_status,
  materialized boolean,
  action text
)
```

Regras obrigatorias da RPC:

- `security definer` com `search_path = ''`.
- Exigir `auth.uid()`.
- Resolver `workspace_id` a partir de `offers.id`; nao aceitar `workspace_id`
  vindo do cliente.
- Exigir `app_private.has_role(workspace_id, array['admin'::app_role])`.
- Nao permitir `service_role` no frontend.
- Se nao existir fila, inserir `approval_queue.status = pending`.
- Se existir fila `pending`, atualizar somente `priority_score` se necessario.
- Se existir fila terminal, reabrir apenas quando o adapter tiver classificado
  reentrada por `material_change` ou `cooldown_elapsed`.
- Registrar uma `review_note` operacional com `captureRunId`,
  `correlationId` e motivo de reentrada.
- Nao inserir `approval_decisions` diretamente.
- Nao apagar historico existente.
- Testar anon, Editor, Admin de outro workspace, usuario suspenso e tentativa
  de workspace injection.

## Riscos residuais

- Materializacao automatica de curadoria exige uma decisao futura:
  criar RPC segura para `approval_queue.pending` sem reabrir bypass de status.
- O score estrutural pode deixar ofertas importadas com score baixo ate a
  estrategia definitiva ser conectada ao pipeline.
- Dados reais sem `affiliateUrl` precisam de enriquecimento antes de aparecer
  em `offers`.

## Resolucao posterior

A Fase 5C.1 implementa a RPC segura `submit_capture_for_review(...)` para:

- criar `approval_queue.pending` a partir de captura;
- retornar fila pendente existente sem duplicar curadoria;
- reabrir oportunidade editorial terminal quando cooldown ou mudanca material
  permitirem;
- preservar trilha de auditoria sem permitir update direto de status.
