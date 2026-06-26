# Changelog da Fase 5

## Fase 5B - Capture Domain

Status: implementado localmente para revisao.

### Objetivo

Transformar a arquitetura documental da Fase 5A em dominio interno reutilizavel
para captura futura, sem implementar conectores reais, banco, scheduler,
marketplace APIs, Telegram, publicacao ou IA.

### Entregas

- Criado dominio puro em `src/server/capture`.
- Implementados contratos TypeScript para:
  - `RawOffer`;
  - `NormalizedOffer`;
  - `ScoredOffer`;
  - `ApprovedOffer`;
  - `PublishedOffer`;
  - `CaptureContext`;
  - `ConnectorContext`;
  - `ConnectorResult`;
  - `CaptureResult`;
  - `PipelineResult`.
- Criado contrato generico `Connector`.
- Implementado pipeline interno:
  - raw offer;
  - normalizacao;
  - validacao;
  - deduplicacao;
  - score estrutural;
  - resultado do pipeline.
- Implementada normalizacao generica:
  - canonicalizacao de URL;
  - remocao de parametros de tracking;
  - normalizacao de moeda;
  - parsing de preco;
  - parsing de percentual;
  - parsing de frete gratis;
  - derivacao de desconto.
- Implementada validacao comum:
  - campos obrigatorios;
  - titulo minimo;
  - moeda suportada;
  - preco valido;
  - dedupe key obrigatoria.
- Implementada deduplicacao sem banco:
  - `externalId` prioritario;
  - fallback por hash SHA-256 da URL canonica;
  - `EditorialCooldownPolicy` com cooldown inicial de 24 horas.
- Implementada estrutura de score:
  - `ScoreFactor`;
  - `ScoreBreakdown`;
  - `ScoreResult`;
  - `ScoreCalculator`;
  - `StructuralScoreCalculator` sem algoritmo definitivo.
- Implementada observabilidade de dominio:
  - `CorrelationId`;
  - `CaptureRunId`;
  - `EventCode`;
  - `StructuredLog`.
- Implementada hierarquia de erros:
  - `CaptureError`;
  - `ConnectorError`;
  - `ValidationError`;
  - `NormalizationError`;
  - `DeduplicationError`;
  - `ScoreError`;
  - `PipelineError`.

### Testes

- Criados testes unitarios para:
  - contracts;
  - normalization;
  - validation;
  - deduplication;
  - editorial cooldown;
  - score structure;
  - pipeline.
- Validacao local:
  - `npm.cmd run typecheck`;
  - `npm.cmd test`;
  - `npm.cmd run build`;
  - `git diff --check`.

### Restricoes preservadas

- Nenhuma migration criada.
- Nenhuma tabela criada.
- Nenhuma policy ou RLS alterada.
- Nenhum conector real implementado.
- Nenhum HTTP client criado.
- Nenhum scheduler, cron ou Edge Function criado.
- Nenhuma integracao externa criada.
- Nenhuma alteracao em staging ou producao.

### Decisoes

- O dominio de captura nao depende de Next.js.
- O dominio de captura nao depende de Supabase.
- O score da Fase 5B e estrutural, nao definitivo.
- O pipeline classifica falhas por item para preservar processamento parcial.
- O cooldown editorial inicial e 24 horas, preparado para futura configuracao
  por workspace.

### Riscos e limitacoes

- A Fase 5B ainda nao persiste resultados em `offers`.
- O score real continua sendo responsabilidade de fase futura.
- O contrato de connector ainda nao possui registry nem configuracao persistida.
- A cobertura percentual automatica nao foi medida porque o projeto nao possui
  script de coverage configurado; a suite unitaria cobre todos os modulos do
  dominio criado.
