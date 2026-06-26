# Phase 5 Roadmap

Status: proposta de evolucao tecnica apos a Fase 5A.

## Objetivo

Transformar a arquitetura de captura em implementacoes pequenas, seguras e
validaveis, sem antecipar publicacao, IA ou automacoes complexas.

## 5A - Capture Pipeline Architecture

Status esperado: documentacao aprovada.

Entregas:

- arquitetura geral;
- modelo de conectores;
- contratos de dados;
- deduplicacao;
- idempotencia;
- score engine;
- observabilidade;
- tratamento de falhas;
- publicacao futura;
- IA futura;
- roadmap.

Sem codigo, migrations ou ambientes.

## 5B - Capture Domain

Objetivo: preparar dominio interno de captura sem marketplace real.

Possiveis entregas:

- contratos TypeScript internos para pipeline;
- servico de orquestracao local;
- adapters para entrada manual/import;
- validacao Zod dos contratos;
- testes unitarios de normalizacao/dedupe/idempotencia;
- decisao sobre necessidade de `capture_runs`.

Gate:

- nenhuma integracao externa;
- nenhuma captura automatica;
- Admin/Editor nao perdem fluxo atual.

## 5C - First Connector

Objetivo: implementar primeiro conector real ou importador estruturado aprovado.

Pre-condicoes:

- spike oficial aprovado;
- termos de uso revisados;
- campos disponiveis mapeados;
- rate limits conhecidos;
- credenciais geridas com seguranca.

Possiveis entregas:

- adapter server-only;
- teste de contrato;
- captura manual controlada;
- logs estruturados;
- fallback manual documentado.

Gate:

- sem scheduler;
- sem publicacao;
- sem scraping.

## 5D - Scheduler

Objetivo: automatizar execucao de captura somente apos conector idempotente.

Possiveis entregas:

- escolha operacional entre Vercel Cron, GitHub Actions ou Supabase Scheduled
  Functions;
- endpoint interno autenticado;
- segredo de cron;
- limite de lote;
- retry/backoff;
- observabilidade minima.

Gate:

- execucao manual repetida ja validada;
- idempotencia provada;
- rollback operacional documentado.

## 6A - Publication Domain

Objetivo: modelar publicacao apos aprovacao.

Possiveis entregas:

- posts/publications/channels;
- idempotency key de publicacao;
- contratos de payload;
- status de publicacao;
- logs.

Gate:

- somente ofertas aprovadas;
- sem canal real obrigatorio ainda.

## 6B - Telegram Publisher

Objetivo: publicar no Telegram como primeiro canal.

Possiveis entregas:

- Telegram adapter;
- teste de conexao;
- envio controlado;
- retry de falhas recuperaveis;
- registro de external message ID.

Gate:

- token server-only;
- nenhuma publicacao sem aprovacao.

## 7A - AI Enrichment

Objetivo: sugerir texto editorial, nao decidir.

Possiveis entregas:

- contrato de sugestao;
- prompt versionado;
- guardrails;
- revisao humana;
- custo e retencao definidos.

Gate:

- sem aprovacao automatica;
- sem score por IA inicialmente.

## Itens que podem mudar de ordem

- Se nenhum marketplace oficial estiver disponivel, 5C pode ser importacao CSV
  estruturada antes de API real.
- Se validacao de usuario exigir publicacao antes de scheduler, 6A/6B podem
  vir antes de 5D.
- IA deve continuar depois de fluxo editorial/publicacao estar estavel.

## Riscos de roadmap

- APIs oficiais podem exigir aprovacao demorada.
- Scheduler antes de idempotencia aumenta risco de duplicidade.
- Publicacao antes de auditoria aumenta risco operacional.
- IA cedo demais pode mascarar problemas do fluxo editorial.

## Recomendacao

Seguir ordem:

```text
5B Capture Domain
  -> 5C First Connector or Structured Import
  -> 5D Scheduler
  -> 6A Publication Domain
  -> 6B Telegram Publisher
  -> 7A AI Enrichment
```
