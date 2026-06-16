# Contratos de API e Server Actions

## Convencoes

- Mutacoes internas: Server Actions.
- Leituras: Server Components/queries server-side; contratos abaixo descrevem
  a interface de dados, mesmo sem endpoint HTTP dedicado.
- Route Handlers: cron/jobs, redirect publico e integraÃ§Ãµes externas.
- Validacao: Zod no servidor.
- Datas: ISO 8601 UTC.
- Paginacao: cursor quando lista pode crescer; `limit` maximo 100.
- Toda resposta de erro usa:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Seu perfil pode visualizar esta area, mas nao fazer alteracoes.",
    "requestId": "uuid",
    "fieldErrors": {}
  }
}
```

Status principais: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`,
`422`, `429`, `500`, `502`.

## Leituras autenticadas

### Dashboard

`GET /api/dashboard?period=today` ou query server-side equivalente.

- Permissao: `offer:read`.
- Retorna: itens "Requer sua atencao", curadoria agrupada por status, agenda do
  dia, saude de canais permitida ao papel e metricas minimas.

### Lista de ofertas

`GET /api/offers`

- Permissao: `offer:read`.
- Query: `q`, `marketplace`, `categoryId`, `minScore`, `minDiscount`, `from`,
  `to`, `status`, `cursor`, `limit`, `sort`.
- Sort permitido: `score_desc`, `captured_desc`, `discount_desc`.
- Resposta:

```json
{
  "items": [],
  "nextCursor": "opaque-or-null",
  "totalApprox": 1248
}
```

### Detalhe da oferta

`GET /api/offers/{offerId}`

- Permissao: `offer:read`.
- Retorna oferta, fatores de score, highlights, snapshots, draft permitido,
  atividade editorial e acoes permitidas.
- `404` se inexistente ou invisivel por RLS.

### Fila de aprovacao

`GET /api/approvals`

- Permissao: `post:approve`.
- Query: `sort=score_desc|urgency_desc`, `cursor`, `limit`.
- Retorna ofertas em review e draft relacionado.

### Agendamentos

`GET /api/publications?from=&to=&status=&channelId=`

- Permissao: `offer:read`.
- Retorna agenda conforme papel; detalhes tecnicos nunca inclusos.

### Relatorios MVP

`GET /api/reports/performance?from=&to=&channelId=&marketplace=`

- Permissao: `offer:read`.
- Retorna publicacoes, cliques e taxa de clique.
- Campos de conversao/receita retornam `null` e `availability: "post_mvp"`.

### Logs

`GET /api/logs?severity=&flow=&channelId=&from=&to=&correlationId=`

- Admin: logs completos mascarados.
- Editor: somente logs vinculados a publicacoes, sem detalhes tecnicos completos.

## Server Actions de ofertas e curadoria

### `captureOfferManual`

- Permissao: Admin.
- Body: marketplace, externalId, sourceUrl, affiliateUrl, title, imageUrl,
  categoryId, currentPrice, previousPrice, couponCode, freeShipping,
  commissionPercent.
- Resultado: oferta normalizada com score e snapshot.
- Erros: `VALIDATION_ERROR`, `DUPLICATE_OFFER`, `FORBIDDEN`.
- Idempotencia: upsert pela chave natural; mudancas geram novo snapshot.

### `requestCapture`

- Permissao: Admin.
- Body: `{ "source": "mercado_livre|shopee|manual" }`.
- Resultado: `{ "jobRunId": "uuid", "status": "queued" }`.
- `409` se job equivalente ja estiver ativo; `429` se limite excedido.

### `sendOfferToReview`

- Permissao: Admin ou Editor.
- Body: `{ "offerId": "uuid" }`.
- Precondicao: oferta `captured` ou `rejected`.
- Resultado: oferta `review` e draft Telegram inicial criado/atualizado.
- Audit: `offer_sent_to_review`.

## Server Actions de post/aprovacao

### `savePostDraft`

- Permissao: Admin ou Editor.
- Body: `postDraftId`, `body`, `ctaText`, `affiliateUrl`, `imageUrl`, `notes`,
  `expectedVersion`.
- Resultado: draft atualizado, `version + 1`, `updatedAt`.
- `409 VERSION_CONFLICT` evita sobrescrever edicao concorrente.
- Audit: `post_edited`, sem guardar corpo completo no audit log.

### `approveAndSchedule`

- Permissao: Admin ou Editor.
- Body: `postDraftId`, `channelId`, `scheduledFor`, `expectedVersion`.
- Precondicoes: draft valido, canal Telegram conectado, horario valido.
- Transacao: aprova draft, atualiza oferta, cria publication, redirect link e
  audit log.
- Resultado:

```json
{
  "publicationId": "uuid",
  "status": "scheduled",
  "scheduledFor": "2026-06-12T21:30:00Z"
}
```

- Erros: `CHANNEL_UNAVAILABLE`, `INVALID_SCHEDULE`, `VERSION_CONFLICT`,
  `ALREADY_SCHEDULED`.

### `rejectOffer`

- Permissao: Admin ou Editor.
- Body: `postDraftId`, `reason`.
- Motivo obrigatorio.
- Resultado: draft/offer rejeitados; audit `offer_rejected`.

### `reschedulePublication`

- Permissao: Admin ou Editor.
- Body: `publicationId`, `scheduledFor`.
- Permitido somente para `scheduled` ou falha recuperavel.
- Audit: `publication_rescheduled`.

### `cancelPublication`

- Permissao: Admin ou Editor.
- Body: `publicationId`, `reason?`.
- Permitido antes de `processing/published`.
- Audit: `publication_cancelled`.

### `publishNow`

- Permissao: Admin ou Editor.
- Body: `postDraftId`, `channelId`.
- Usa pipeline normal com `scheduledFor = now`.
- Nao publica diretamente dentro da requisicao da UI.

## Server Actions administrativas

### `inviteUser`

- Permissao: Admin.
- Body: `email`, `role=admin|editor`.
- Resultado: convite/membership.
- Audit: `user_invited`.

### `changeMemberRole`

- Permissao: Admin.
- Body: `userId`, `role`.
- Nao permite remover ultimo Admin.
- Audit: `member_role_changed`.

### `suspendMember`

- Permissao: Admin.
- Body: `userId`, `reason`.
- Audit: `member_suspended`.

### `configureTelegramChannel`

- Permissao: Admin.
- Body: `name`, `externalIdentifier`, configuracao server-side necessaria.
- Segredo nunca retorna na resposta.
- Resultado inicial: canal `disconnected` ate teste.
- Audit: `channel_configured`.

### `testTelegramChannel`

- Permissao: Admin.
- Body: `channelId`.
- Faz chamada de teste controlada.
- Resultado: status, timestamp, mensagem humana.
- Audit: `channel_connection_tested`.

### `pauseChannel`

- Permissao: Admin.
- Body: `channelId`, `paused`.
- Retorna impacto em agendamentos futuros.
- Audit: `channel_paused|channel_resumed`.

### `reprocessPublication`

- Permissao: Admin.
- Body: `publicationId`.
- Somente falha recuperavel e abaixo do maximo de tentativas.
- Resultado: publication volta a fila com nova tentativa.
- Audit: `publication_reprocessed`.

### `upsertCategory` e `upsertTag`

- Permissao: Admin.
- Body: identificador opcional, nome, slug, cor e ativo.
- Uso MVP: manutencao simples para sustentar classificacao e seletor aprovados.
- Regras automaticas ficam pÃ³s-MVP.
- Resultado: categoria/tag atualizada.
- Erros: `VALIDATION_ERROR`, `DUPLICATE_SLUG`, `FORBIDDEN`.

## Route Handlers

### `GET /r/{shortCode}`

- Publico.
- Resolve link ativo, registra clique de forma best-effort e responde redirect
  `302/307` para `destination_url`.
- `404` para codigo inexistente/inativo.
- Rate limit e minimizacao de dados obrigatorios.
- Falha de analytics nao deve impedir redirect valido.

### `POST /api/internal/jobs/capture`

- Chamador: scheduler autenticado.
- Header: segredo interno; nunca browser.
- Body: `{ "workspaceId": "uuid", "source": "...", "idempotencyKey": "..." }`.
- Resultado: resumo do job.
- Erros: `401`, `409`, `429`, `502`.

### `POST /api/internal/jobs/refresh-prices`

- Chamador: scheduler autenticado.
- Faz refresh limitado de ofertas elegiveis.
- Resultado: contagens atualizadas/ignoradas/falhas.

### `POST /api/internal/jobs/publish-due`

- Chamador: scheduler autenticado.
- Body: `{ "batchSize": 20 }`.
- Faz claim atomico e publica Telegram.
- Resultado:

```json
{
  "claimed": 5,
  "published": 4,
  "retryScheduled": 1,
  "dead": 0
}
```

### `POST /api/internal/jobs/publish/{publicationId}`

- Server-only para reprocessamento/manual.
- Respeita a mesma idempotencia do job em lote.

## Codigos de erro estaveis

| Codigo | HTTP | Uso |
|---|---:|---|
| `UNAUTHENTICATED` | 401 | Sessao ausente/invalida |
| `FORBIDDEN` | 403 | Papel sem permissao |
| `NOT_FOUND` | 404 | Recurso inexistente/invisivel |
| `VALIDATION_ERROR` | 422 | Campos invalidos |
| `INVALID_TRANSITION` | 409 | Estado nao permite acao |
| `VERSION_CONFLICT` | 409 | Edicao concorrente |
| `ALREADY_SCHEDULED` | 409 | Duplicidade |
| `CHANNEL_UNAVAILABLE` | 409/502 | Canal pausado/desconectado/falhando |
| `RATE_LIMITED` | 429 | Limite interno/externo |
| `INTEGRATION_ERROR` | 502 | Falha externa sanitizada |
| `INTERNAL_ERROR` | 500 | Falha inesperada com request ID |
