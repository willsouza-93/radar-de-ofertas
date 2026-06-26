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
- Revisado alinhamento arquitetural de `affiliateUrl`:
  - `RawOffer` pode chegar sem `affiliateUrl`;
  - `NormalizedOffer.affiliateUrl` pode permanecer `null`;
  - ausencia de `affiliateUrl` nao bloqueia captura valida;
  - `affiliateUrl` nao participa de deduplicacao.
- Revisados comentarios do PR de conformidade arquitetural:
  - dedupe manual/import normaliza casing de external IDs;
  - validacoes antecipam limites persistidos de titulo, cupom e dinheiro;
  - `capturedAt` exige ISO UTC valido;
  - score rejeita fatores nao finitos e highlights nao suportados;
  - disponibilidade participa da decisao de reentrada editorial;
  - pipeline rejeita mismatch entre item bruto e contexto de conector.
- Revisados comentarios adicionais de importacao:
  - `previousPrice` em branco normaliza para `null`;
  - frete ausente permanece desconhecido;
  - sellerName e usado quando sellerId esta em branco;
  - precos numericos grandes validos nao sao rejeitados por erro de precisao
    binaria.
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
- `affiliateUrl` e tratado como enriquecimento opcional, nao identidade da
  oferta.

### Riscos e limitacoes

- A Fase 5B ainda nao persiste resultados em `offers`.
- O score real continua sendo responsabilidade de fase futura.
- O contrato de connector ainda nao possui registry nem configuracao persistida.
- A cobertura percentual automatica nao foi medida porque o projeto nao possui
  script de coverage configurado; a suite unitaria cobre todos os modulos do
  dominio criado.

## Fase 5C - First Connector Manual

Status: implementado localmente para revisao.

### Objetivo

Validar o primeiro connector real sem acoplar marketplace, scheduler, IA,
Telegram, scraping, Edge Functions ou APIs externas.

Fluxo implementado:

`Entrada manual -> RawOffer -> Capture Pipeline -> Persistencia -> Offers/Snapshots -> tentativa controlada de curadoria`

### Entregas

- Criado connector manual em `src/server/connectors/manual`.
- O connector manual implementa o contrato generico `Connector`.
- O connector produz apenas `RawOffer`.
- Nenhuma regra de negocio foi colocada no connector.
- Criado adapter de import manual em `src/server/capture/manual-import.ts`.
- Criado repositório Supabase server-side em
  `src/server/capture/supabase-persistence.ts`.
- Criada tela administrativa simples em `/capture/manual` com textarea JSON.
- Criada Server Action `importManualOffersAction`.
- Navegacao adiciona "Importar" apenas para Admin.
- O workspace continua derivado server-side pela membership ativa.
- Editor nao executa import manual.
- Public Visitor/anon nao acessa o backoffice.

### Persistencia

- Novas ofertas manuais usam marketplace `manual`.
- `dedupeKey` vem do dominio de captura.
- Oferta existente e atualizada por `dedupeKey`.
- Mudanca relevante gera snapshot de preco.
- Reentrada editorial usa `EditorialCooldownPolicy` de 24 horas.
- `affiliateUrl` continua opcional no dominio de captura.
- Limite atual: o schema existente de `offers.affiliate_url` e `not null`.
  Portanto, nova oferta sem `affiliateUrl` e processada pelo pipeline, mas nao
  pode ser persistida em `offers` nesta fase.

### Curadoria

- O adapter tenta criar `approval_queue.pending` para novas oportunidades.
- A Fase 3B endureceu a curadoria:
  - clientes autenticados nao possuem grant para inserir/atualizar
    `approval_queue`;
  - `approval_decisions` nao podem ser inseridas diretamente;
  - transicoes oficiais permanecem protegidas por `apply_approval_decision`.
- Por isso, sem migration/RPC nova, ambientes atuais podem persistir
  `offers` e `price_snapshots`, mas bloquear materializacao/reentrada da fila.
- Essa limitacao foi documentada em vez de contornar RLS com service role.

### Observabilidade

- Cada import gera:
  - `correlationId`;
  - `captureRunId`;
  - logs estruturados do pipeline;
  - resumo com recebidas, processadas, invalidas, persistidas, snapshots e
    estado da fila.

### Testes

- Criados testes para:
  - connector manual;
  - import manual completo;
  - dedupe de mesma oferta;
  - ausencia de nova oportunidade enquanto pendente;
  - reentrada editorial apos 24 horas;
  - reentrada por mudanca material de preco;
  - captura sem `affiliateUrl` valida no pipeline, mas bloqueada na
    persistencia atual.

### Restricoes preservadas

- Nenhuma migration criada.
- Nenhuma tabela criada.
- Nenhuma policy ou RLS alterada.
- Nenhuma alteracao em Supabase staging ou producao.
- Nenhum scheduler criado.
- Nenhuma Edge Function criada.
- Nenhuma integracao externa criada.
- Nenhum conector de marketplace criado.
- Nenhum uso de service role no frontend.

### Decisoes

- O conector manual e a referencia inicial para futuros conectores.
- O connector nao conhece Supabase, Next.js, banco ou UI.
- O pipeline permanece independente da UI.
- O adapter server-side faz a ponte entre connector, pipeline e persistencia.
- A reentrada editorial terminal precisa de funcao controlada futura no banco;
  update direto de `approval_queue` continua proibido.

### Riscos e limitacoes

- A fila de curadoria pode nao ser criada automaticamente enquanto nao existir
  uma superficie segura aprovada para materializar `approval_queue`.
- Novas capturas sem `affiliateUrl` precisam de enriquecimento antes de
  persistir em `offers`.
- O score da captura ainda e estrutural (`capture-structure-v1`), nao o score
  definitivo de negocio.
