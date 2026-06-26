# Phase 5B Local Validation Report

Status: validacao local da Fase 5B.

## Escopo validado

Implementacao do dominio interno de captura em `src/server/capture`.

Incluido:

- contratos TypeScript;
- contrato generico de connector;
- pipeline interno;
- normalizacao;
- validacao;
- deduplicacao;
- cooldown editorial;
- score estrutural;
- observabilidade de dominio;
- hierarquia de erros;
- testes unitarios.

Fora de escopo confirmado:

- migrations;
- schema;
- RLS;
- Supabase remoto;
- staging;
- producao;
- marketplace APIs;
- HTTP clients;
- conectores reais;
- scheduler;
- Telegram;
- IA;
- scraping.

## Estrutura criada

```text
src/server/capture/
  deduplication.ts
  errors.ts
  index.ts
  normalization.ts
  observability.ts
  pipeline.ts
  score.ts
  types.ts
  validation.ts
  contracts.test.ts
  deduplication.test.ts
  normalization.test.ts
  pipeline.test.ts
  score.test.ts
  test-helpers.ts
  validation.test.ts
```

## Testes executados

### Typecheck

Comando:

```bash
npm.cmd run typecheck
```

Resultado: passou.

### Unit tests

Comando:

```bash
npm.cmd test
```

Resultado: passou.

Resumo observado:

```text
Test Files  13 passed (13)
Tests       75 passed (75)
```

### Build

Comando:

```bash
npm.cmd run build
```

Resultado: passou.

### Diff check

Comando:

```bash
git diff --check
```

Resultado: passou.

## Cobertura funcional implementada

- Normalizer:
  - URL canonica;
  - tracking params removidos;
  - moeda BRL;
  - money/percent parsing;
  - frete gratis;
  - desconto derivado.
- Validator:
  - campos obrigatorios;
  - contrato;
  - titulo;
  - moeda;
  - preco;
  - dedupe key.
- Deduplication:
  - external ID;
  - URL hash fallback;
  - material changes;
  - editorial cooldown de 24 horas.
- Score:
  - estrutura extensivel;
  - score estrutural;
  - validacao de range;
  - highlights estruturais.
- Pipeline:
  - processamento de lote;
  - isolamento de item invalido;
  - logs estruturados;
  - resultado agregado.

## Decisoes de implementacao

- `capture-v1` e a versao inicial dos contratos.
- O dominio de captura e puro e nao importa Next.js ou Supabase.
- `StructuralScoreCalculator` existe para preparar a arquitetura sem antecipar
  algoritmo definitivo.
- O pipeline retorna resultados em memoria; persistencia ficara para fase
  futura.
- Falhas de item geram `PipelineItemFailure` sem interromper o lote.

## Riscos residuais

- Nao ha coverage reporter configurado para medir percentual automatico.
- O pipeline ainda nao possui adapter de persistencia.
- O contrato de connector ainda nao valida credenciais reais porque nenhum
  conector real foi implementado.
- O score definitivo ainda precisa ser conectado em fase futura.

## Gate local

`READY_FOR_PHASE_5B_REVIEW`: SIM.
