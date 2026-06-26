# Phase 5 Capture Architecture

Status: especificacao arquitetural da Fase 5A. Este documento nao implementa
codigo, migrations, scheduler, conectores reais ou integracoes externas.

## Objetivo

Definir a arquitetura futura para capturar ofertas reais e encaminha-las ao
fluxo ja validado:

```text
Source
  -> Capture
  -> Normalization
  -> Validation
  -> Deduplication
  -> Score
  -> Offers
  -> Approval Queue
  -> Curation
  -> Publication Pipeline (future)
```

A Fase 5A preserva o escopo atual:

- Auth, workspace e RLS continuam como fundacao.
- `offers`, `price_snapshots` e `approval_queue` continuam sendo os dominios de
  destino.
- Score continua explicavel e deterministico.
- Aprovacao humana continua obrigatoria.
- Captura nao publica, nao aprova e nao agenda.

## Principios

- O core do Radar deve operar com contratos genericos, nao com detalhes de um
  marketplace especifico.
- Dados externos sao sempre nao confiaveis.
- Cada etapa deve ser reexecutavel, idempotente e observavel.
- Falha de um item nao deve derrubar todo o lote quando for seguro continuar.
- Nenhum conector deve acessar secrets no frontend.
- Nenhuma oferta capturada deve contornar curadoria humana.
- Integracoes oficiais sao preferidas. Scraping continua fora do escopo.

## Diagrama textual

```text
Connector Source
  - official API, feed, CSV, JSON, manual input
  - produces RawOffer[]

Capture Orchestrator
  - opens a capture run
  - invokes one connector
  - assigns correlationId
  - enforces limits

Normalizer
  - maps RawOffer to NormalizedOffer
  - canonicalizes URLs
  - parses money, percent and booleans
  - keeps source metadata separated

Validator
  - rejects unsafe or incomplete data
  - classifies recoverable vs item-level errors
  - never trusts connector output blindly

Deduplicator
  - resolves existing offer by external identity first
  - falls back to canonical source URL
  - decides create/update/unchanged/conflict

Score Engine
  - calculates deterministic score
  - persists factors and highlights
  - never makes editorial decisions

Persistence Boundary
  - upserts offers
  - creates price snapshots when relevant
  - materializes approval_queue when configured

Curation
  - Admin/Editor review
  - approve/reject with history

Publication Pipeline (future)
  - only consumes approved offers
  - no direct dependency from capture
```

## Etapas e responsabilidades

### 1. Source

Representa a origem da informacao. Pode ser:

- entrada manual existente;
- importacao CSV/JSON futura;
- API/feed oficial autorizado;
- conector de marketplace aprovado por spike.

Responsabilidade:

- fornecer registros brutos com o melhor identificador externo disponivel;
- respeitar termos, rate limits e permissoes;
- retornar erros classificados sem expor secrets.

Fora de responsabilidade:

- calcular score;
- criar status editorial;
- publicar;
- decidir aprovacao.

### 2. Capture

Camada de orquestracao que inicia uma execucao de captura.

Responsabilidade:

- receber `workspace_id` resolvido no servidor;
- selecionar conector configurado;
- criar contexto de execucao com `captureRunId` e `correlationId`;
- aplicar limites de lote e timeout;
- registrar resumo da execucao;
- entregar registros brutos para normalizacao.

Observacao: em fase futura esta etapa pode ser chamada por acao manual ou por
scheduler. Na Fase 5A nenhum scheduler e implementado.

### 3. Normalization

Transforma `RawOffer` em `NormalizedOffer`.

Responsabilidade:

- normalizar titulo, URLs, moeda, preco, desconto, frete, cupom e imagem;
- converter valores para tipos internos;
- canonicalizar `source_url`;
- preservar dados de origem em metadados tecnicos quando necessario;
- remover tracking irrelevante da identidade da URL.

### 4. Validation

Aplica regras comuns independentes do conector.

Responsabilidade:

- exigir HTTP/HTTPS para `source_url`, `affiliate_url` e `image_url`;
- garantir `numeric(12,2)` para dinheiro;
- garantir `BRL` enquanto o produto nao suportar multi-moeda;
- validar tamanho minimo de titulo;
- classificar item invalido sem interromper lote inteiro;
- impedir dados perigosos em logs e mensagens.

### 5. Deduplication

Resolve se o item capturado representa uma oferta existente.

Ordem recomendada:

1. identidade externa confiavel do conector;
2. `dedupe_key` baseada em URL canonica;
3. heuristicas futuras de produto/seller apenas como apoio, nunca como merge
   automatico sem seguranca.

Resultado possivel:

- `create`: nova oferta;
- `update`: mesma oferta com dados alterados;
- `unchanged`: mesma oferta sem mudanca relevante;
- `conflict`: duas identidades apontam para registros diferentes.

### 6. Score

Calcula score deterministico.

Responsabilidade:

- usar regra versionada;
- registrar fatores explicaveis;
- gerar highlights;
- tratar dados ausentes como zero no fator correspondente;
- nunca aprovar, rejeitar, publicar ou agendar.

### 7. Offers

Persiste estado atual da oferta em `offers`.

Responsabilidade:

- criar nova oferta quando necessario;
- atualizar dados relevantes de uma oferta existente;
- manter `last_seen_at`;
- preservar `captured_at` original quando a oferta ja existe;
- criar snapshot quando preco/sinais relevantes mudarem.

### 8. Approval Queue

Materializa a oferta para curadoria humana.

Responsabilidade:

- criar `approval_queue` como `pending` quando a politica da fase futura assim
  definir;
- nunca criar `approved` ou `rejected` via captura;
- nunca inserir `approval_decisions` automaticamente;
- manter a decisao humana como fronteira obrigatoria.

### 9. Curation

Fluxo existente de Admin/Editor:

- revisar score e highlights;
- adicionar notas append-only;
- aprovar ou rejeitar;
- manter historico de decisoes.

### 10. Publication Pipeline (future)

Consumira apenas ofertas aprovadas em fase futura.

Responsabilidade futura:

- criar post/publication;
- publicar em Telegram primeiro;
- registrar resultados e retry.

Captura nao deve chamar publicacao diretamente.

## Fronteiras entre componentes

```text
Connector
  outputs RawOffer[]

Pipeline Core
  RawOffer -> NormalizedOffer -> ScoredOffer

Offer Persistence
  ScoredOffer -> offers + price_snapshots

Curation Boundary
  offer -> approval_queue.pending

Human Workflow
  approval_queue.pending -> approved/rejected
```

## Workspace e seguranca

- `workspace_id` nunca deve vir do cliente em acoes autenticadas.
- O servidor resolve workspace pela membership ativa.
- Conectores rodam server-side.
- Secrets de conectores ficam em variaveis seguras ou storage apropriado futuro.
- Logs nunca registram tokens, cookies, headers completos ou URLs com segredo.
- `anon` continua sem acesso a tabelas internas.

## Decisao de MVP para proximas fases

A implementacao inicial da captura real deve comecar por um caminho simples:

1. consolidar dominio de captura interno;
2. manter entrada manual/importacao estruturada como fallback;
3. adicionar primeiro conector oficial somente apos spike aprovado;
4. acionar capturas manualmente antes de qualquer scheduler.

## Fora da Fase 5A

- SQL.
- Migrations.
- Tabelas novas.
- RLS novas.
- Edge Functions.
- Cron Jobs.
- APIs reais.
- Scraping.
- Publicacao.
- IA.
- Telegram.
