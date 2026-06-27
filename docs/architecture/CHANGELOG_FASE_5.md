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

- O adapter avalia quando uma oportunidade deveria entrar ou voltar para
  curadoria.
- A Fase 3B endureceu a curadoria:
  - clientes autenticados nao possuem grant para inserir/atualizar
    `approval_queue`;
  - `approval_decisions` nao podem ser inseridas diretamente;
  - transicoes oficiais permanecem protegidas por `apply_approval_decision`.
- Por isso, sem migration/RPC nova, ambientes atuais podem persistir
  `offers` e `price_snapshots`, mas bloquear materializacao/reentrada da fila.
- O repositório Supabase da Fase 5C nao tenta `insert`/`update` direto em
  `approval_queue`; ele retorna aviso operacional ate existir RPC segura.
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
- Portanto, a Fase 5C prova `Manual input -> RawOffer -> Pipeline ->
  offers/snapshots`, mas ainda nao prova ponta a ponta ate a curadoria no
  Supabase real.
- Novas capturas sem `affiliateUrl` precisam de enriquecimento antes de
  persistir em `offers`.
- O score da captura ainda e estrutural (`capture-structure-v1`), nao o score
  definitivo de negocio.

## Fase 5C.1 - Capture Review RPC

Status: implementado localmente para revisao.

### Objetivo

Resolver o bloqueio arquitetural identificado na Fase 5C: encaminhar ofertas
capturadas para curadoria sem reabrir grants de `approval_queue`, sem usar
service role e sem permitir bypass do historico de decisoes.

Fluxo validado:

`Manual input -> RawOffer -> Capture Pipeline -> offers -> price_snapshots -> submit_capture_for_review -> approval_queue.pending`

### Entregas

- Criada migration `20260627112112_phase_5c1_capture_review_rpc.sql`.
- Criada RPC oficial `public.submit_capture_for_review(...)`.
- Criada helper privada `app_private.add_capture_review_note(...)`.
- Integrado `SupabaseCapturePersistenceRepository` para chamar a RPC.
- Atualizada UI de import manual para comunicar comportamento de reentrada.
- Adicionados testes pgTAP dedicados para a RPC.
- Adicionados testes TypeScript para o adapter Supabase e capturas repetidas.

### Contrato da RPC

```sql
public.submit_capture_for_review(
  target_offer_id uuid,
  target_priority_score integer,
  target_reentry_reason text default null,
  target_capture_run_id text default null,
  target_correlation_id text default null
)
returns table (
  queue_id uuid,
  offer_id uuid,
  queue_status public.approval_status,
  submitted boolean,
  action text
)
```

### Invariantes implementados

- `workspace_id` nunca e aceito do cliente.
- Workspace e derivado exclusivamente de `offers.id`.
- Apenas Admin ativo do workspace pode executar a submissao.
- Editor, usuario suspenso, usuario sem membership, anon/Public Visitor e Admin
  de outro workspace sao bloqueados.
- Uma oferta possui no maximo uma linha de `approval_queue` por workspace.
- Enquanto houver fila `pending`, novas capturas retornam a fila existente.
- Captura nao cria `approval_decisions`.
- Reentrada de fila terminal ocorre apenas por:
  - `material_change`;
  - `cooldown_elapsed`.
- A RPC valida `cooldown_elapsed` no banco usando `last_reviewed_at + 24h`.
- A RPC valida `material_change` por evidencia persistida nos dois ultimos
  `price_snapshots`, exigindo que o snapshot material mais recente tenha sido
  observado depois da ultima revisao editorial.
- O adapter so encaminha `material_change` para mudancas persistidas em
  snapshot: preco, desconto, cupom ou frete.
- Mudanca isolada de comissao permanece material no conceito editorial, mas nao
  reabre fila antes do cooldown enquanto o schema atual nao guardar historico
  persistido de comissao.
- Fila terminal sem `target_reentry_reason` explicito retorna `not_reentered`.
- Reentrada controlada limpa ponteiros terminais da fila, mas preserva
  `approval_decisions` e `review_notes`.
- Toda materializacao/reentrada registra nota operacional com:
  - `captureRunId`;
  - `correlationId`;
  - action;
  - reason;
  - actor (`created_by`).

### Segurança

- `submit_capture_for_review` usa `security definer` para atravessar a barreira
  operacional de grants sem expor mutacao direta nas tabelas.
- A funcao verifica `auth.uid()` explicitamente.
- A funcao usa `app_private.has_role(..., array['admin'])`.
- `execute` foi revogado de `public`, `anon` e `authenticated` antes do grant
  explicito para `authenticated`.
- `approval_queue` permanece sem grants de `insert`, `update` e `delete` para
  `authenticated`.
- `approval_decisions` permanece append-only pelo fluxo de curadoria humana.

### Testes

- pgTAP cobre:
  - oferta nova cria `pending`;
  - oferta ja pendente nao duplica fila;
  - multiplas submisssoes mantem uma unica fila;
  - oferta aprovada respeita cooldown;
  - oferta rejeitada reentra por mudanca material;
  - motivo de reentrada ausente bloqueado;
  - snapshot material anterior a ultima revisao bloqueado;
  - Editor negado;
  - suspenso negado;
  - sem membership negado;
  - Admin de outro workspace negado;
  - anon negado;
  - assinatura da RPC nao aceita `workspaceId`;
  - captura nao cria `approval_decisions`.
- Vitest cobre:
  - repository Supabase chamando RPC;
  - reentrada via RPC;
  - capturas repetidas com uma unica fila pendente e multiplos snapshots;
  - mudanca isolada de comissao nao reabre antes do cooldown sem evidencia
    persistida especifica.

### Restricoes preservadas

- Nenhum marketplace real.
- Nenhum scheduler.
- Nenhum Telegram.
- Nenhuma IA.
- Nenhum uso de service role.
- Nenhuma alteracao em staging ou producao.

## Revisao PR #15 - Ajustes de Integridade do Manual Connector

Status: aplicado na branch `feature/phase-5c-first-connector`.

### Correcoes

- Recaptura manual agora preserva categoria existente ao atualizar `offers`.
- Recaptura que adiciona `externalId` depois de uma captura por URL consulta a
  identidade fallback por URL antes de inserir, evitando duplicidade.
- Recapturas posteriores tambem reconciliam identidade por `externalId` e
  `source_url` para evitar duplicidade quando uma fonte alterna entre enviar e
  omitir `externalId`.
- Recaptura que omite `freeShipping` preserva o valor ja persistido e usa o
  valor efetivo em snapshots/highlights.
- Recaptura que omite `commissionPercent` preserva a comissao ja persistida.
- Capturas stale, com `capturedAt` anterior ao `last_seen_at` persistido, nao
  sobrescrevem o estado atual da oferta.
- Itens duplicados no mesmo payload e mesma janela de observacao usam a ultima
  ocorrencia processada, evitando snapshot obsoleto no mesmo `observed_at`.

### Restricoes mantidas

- Nenhuma migration nova.
- Nenhuma alteracao de schema.
- Nenhum marketplace real.
- Nenhuma alteracao em staging/producao.
