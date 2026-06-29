# Phase 6B Local Validation Report

Status: em validacao local antes de review.

## Objetivo

Implementar o dominio interno de publicacao como TypeScript puro, reutilizavel,
testavel e desacoplado de infraestrutura.

Fluxo implementado:

```text
Approved Offer
  -> Publication Candidate
  -> Publication Policy
  -> Template Renderer
  -> Publication Job
  -> Publisher Contract
  -> Publication Result
```

## Escopo entregue

- `src/server/publication/types.ts`
- `src/server/publication/candidate.ts`
- `src/server/publication/policy.ts`
- `src/server/publication/template.ts`
- `src/server/publication/job.ts`
- `src/server/publication/publisher.ts`
- `src/server/publication/retry.ts`
- `src/server/publication/observability.ts`
- `src/server/publication/errors.ts`
- `src/server/publication/pipeline.ts`
- `src/server/publication/index.ts`
- `src/server/publication/publication.test.ts`

## Decisoes

- O dominio nao importa Next.js, Supabase, banco, SDKs externos ou canais
  especificos.
- O contrato `Publisher` e a unica fronteira para publishers futuros.
- Fake publisher existe apenas na suite de testes.
- `PublicationCandidate` inclui `created` como estado inicial interno para
  permitir registrar nascimento antes de `eligible` ou `blocked`.
- `PublicationJob` nasce como shell em memoria antes da renderizacao, refletindo
  a arquitetura futura em que redirect links precisam estar associados ao job
  antes do envio externo.
- Resultado ambiguo nao gera retry automatico; exige reconciliacao ou revisao
  manual.
- Domain Events separados nao foram implementados. Os eventos estruturados de
  observabilidade sao a representacao conceitual suficiente nesta fase.

## Limitacoes

- Sem migrations.
- Sem tabelas.
- Sem RLS.
- Sem RPC.
- Sem Supabase.
- Sem service role.
- Sem publisher real.
- Sem Telegram/WhatsApp/Threads/Discord.
- Sem scheduler.
- Sem Event Bus.
- Sem staging/producao.

## Testes implementados

Suite: `src/server/publication/publication.test.ts`

Cenarios cobertos:

- candidate criado a partir da decisao aprovada atual;
- bloqueio de oferta nao aprovada;
- bloqueio de decisao de aprovacao stale;
- transicoes `eligible`, `blocked`, `queued`, `cancelled`, `expired`;
- policy allow;
- target desabilitado;
- publicacao manual desabilitada;
- cooldown;
- limite por target;
- duplicidade por idempotency key;
- renderer com snapshot aprovado;
- escaping de markdown;
- redirect link obrigatorio em `/r/{shortCode}`;
- template invalido;
- job shell antes de mensagem renderizada;
- contrato publisher com fake publisher;
- retry transitorio;
- falha permanente;
- resultado ambiguo sem retry automatico;
- sanitizacao de metadata e detalhes de erro;
- pipeline feliz;
- pipeline bloqueado por policy;
- pipeline com falha permanente de template;
- pipeline com falha transitoria;
- pipeline com resultado ambiguo.
- review Fase 6B:
  - template vazio;
  - placeholder desconhecido;
  - placeholder malformado;
  - target sem suporte a publicacao manual;
  - falha retryable nao transitoria;
  - limite maximo de retry;
  - publisher lancando excecao transitoria;
  - metadata sensivel aninhada.
  - redirect ausente no texto renderizado;
  - origem de redirect nao permitida;
  - limite do target menor que limite do template;
  - publicacao automatica sem habilitacao explicita;
  - formato de mensagem nao suportado pelo publisher;
  - resultado ambiguo sem payload de falha;
  - erro ambiguo lancado pelo publisher;
  - `retryAfter` top-level do publisher;
  - oferta stale retornando falha estruturada.
  - resultado ambiguo com failure retryable;
  - resultado transitorio sem payload `failure`;
  - detalhes/metadata com referencia circular.
  - resultado de sucesso com payload `failure` obsoleto;
  - reavaliacao de candidate bloqueado mantendo `blocked`.
  - resultado permanente com payload `failure` retryable inconsistente;
  - excecao transitoria do publisher preservando `retryAfter`;
  - reavaliacao de candidate bloqueado limpando `blockedUntil` obsoleto;
  - variavel `sourceUrl` rejeitada no template;
  - placeholder herdado de prototype rejeitado.

## Validacoes locais

| Comando | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Passou |
| `npm.cmd test` | Passou: 17 arquivos de teste, 141 testes |
| `npm.cmd run build` | Passou |
| `git diff --check` | Passou |

## Riscos

- A Fase 6B ainda nao prova publicacao real; isso e intencional.
- A futura camada de aplicacao precisara validar permissao e workspace antes de
  chamar o dominio.
- A futura persistencia precisara materializar `candidate`, `job`,
  `redirectLink` e historico append-only sem relaxar auditoria da curadoria.

## Duvidas bloqueadoras

Nenhuma.
