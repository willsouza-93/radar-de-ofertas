# Phase 5C Local Validation Report

Status: implementado localmente para revisao.

## Escopo validado

- Primeiro connector real: `manual-import`.
- Entrada administrativa via JSON em `/capture/manual`.
- Conversao de entrada manual para `RawOffer`.
- Execucao do Capture Pipeline da Fase 5B.
- Persistencia server-side em `offers` e `price_snapshots` usando cliente
  autenticado e RLS.
- Tentativa controlada de materializacao de `approval_queue`.
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
9. Adapter tenta criar/reabrir curadoria conforme o schema atual permitir.

## Limites conhecidos

### `approval_queue`

A curadoria foi endurecida na Fase 3B para impedir bypass de auditoria. No
schema atual:

- `approval_queue` nao permite `INSERT`/`UPDATE` por clientes autenticados;
- `approval_decisions` nao permite inserts diretos;
- aprovar/rejeitar deve passar por `apply_approval_decision`.

Como a Fase 5C proibiu migrations, nao foi criada funcao nova para materializar
fila de captura. Assim, a importacao pode persistir `offers` e
`price_snapshots`, mas a criacao/reentrada de `approval_queue` pode retornar
aviso operacional.

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

## Riscos residuais

- Materializacao automatica de curadoria exige uma decisao futura:
  criar RPC segura para `approval_queue.pending` sem reabrir bypass de status.
- O score estrutural pode deixar ofertas importadas com score baixo ate a
  estrategia definitiva ser conectada ao pipeline.
- Dados reais sem `affiliateUrl` precisam de enriquecimento antes de aparecer
  em `offers`.

## Recomendacao

Antes de aplicar em staging, revisar se a proxima fase deve criar uma funcao
controlada para:

- criar `approval_queue.pending` a partir de captura;
- reabrir oportunidade editorial terminal quando cooldown ou mudanca material
  permitirem;
- preservar trilha de auditoria sem permitir update direto de status.
