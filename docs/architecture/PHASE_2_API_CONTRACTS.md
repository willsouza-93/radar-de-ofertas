# Contratos da Fase 2

Status: contratos para Server Actions e queries server-side da Fase 2B.

## Convencoes

- Mutacoes internas: Server Actions.
- Leituras: queries server-side em Server Components ou Route Handlers internos
  apenas se necessario.
- Validacao: Zod no servidor.
- Datas: ISO 8601 UTC.
- Dinheiro: string decimal ou number validado, persistido como `numeric(12,2)`.
- Erros seguem envelope estavel:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os campos informados.",
    "requestId": "uuid",
    "fieldErrors": {}
  }
}
```

## `captureOfferManual`

Tipo: Server Action.

Permissao: Admin ativo do workspace.

Objetivo: criar ou atualizar oferta manual, calcular score e gerar snapshot
quando houver mudanca de preco/sinais relevantes.

Request:

```json
{
  "workspaceId": "uuid",
  "marketplace": "manual|mercado_livre|shopee",
  "externalId": "string opcional",
  "sourceUrl": "https://...",
  "affiliateUrl": "https://...",
  "title": "string",
  "imageUrl": "https://... opcional",
  "categoryId": "uuid opcional",
  "tagIds": ["uuid"],
  "currentPrice": "129.90",
  "previousPrice": "199.90 opcional",
  "couponCode": "string opcional",
  "freeShipping": true,
  "commissionPercent": "8.50 opcional",
  "capturedAt": "ISO opcional"
}
```

Normalizacao:

- Trim em strings.
- URLs parseadas e aceitas somente em HTTP/HTTPS.
- `currency` sempre `BRL` na Fase 2.
- `discount_percent` derivado quando `previousPrice > currentPrice`.
- `externalId` ausente gera chave deterministica a partir da URL normalizada.
- `workspaceId` efetivo deve ser validado contra membership ativa; nao confiar
  apenas no body.
- `highlights` e `score` sao calculados no servidor.

Response `201` para nova oferta:

```json
{
  "offer": {
    "id": "uuid",
    "status": "captured",
    "title": "Fone Bluetooth",
    "score": 82,
    "scoreVersion": "mvp-v1",
    "highlights": ["lowest_price", "high_commission"],
    "currentPrice": "129.90",
    "discountPercent": "35.02"
  },
  "created": true,
  "updated": false,
  "snapshotCreated": true
}
```

Response `200` para oferta existente:

```json
{
  "offer": {
    "id": "uuid",
    "status": "captured",
    "score": 78,
    "scoreVersion": "mvp-v1"
  },
  "created": false,
  "updated": true,
  "snapshotCreated": true
}
```

Erros:

- `UNAUTHENTICATED` `401`
- `FORBIDDEN` `403`
- `VALIDATION_ERROR` `422`
- `CATEGORY_NOT_FOUND` `404`
- `TAG_NOT_FOUND` `404`
- `DUPLICATE_CONFLICT` `409` quando chave natural conflita de forma ambigua.

## `listOffers`

Tipo: query server-side.

Permissao: Admin ou Editor ativo do workspace.

Query:

```json
{
  "workspaceId": "uuid",
  "q": "fone opcional",
  "marketplace": "manual|mercado_livre|shopee opcional",
  "categoryId": "uuid opcional",
  "tagId": "uuid opcional",
  "minScore": 70,
  "minDiscount": 20,
  "from": "ISO opcional",
  "to": "ISO opcional",
  "cursor": "opaque opcional",
  "limit": 30,
  "sort": "score_desc|captured_desc|discount_desc"
}
```

Regras:

- `limit` padrao 30, maximo 100.
- `sort` padrao `score_desc`.
- Filtro de texto usa busca simples por titulo na Fase 2; extensoes de busca
  ficam fora ate necessidade real.
- Resultado sempre isolado por workspace.

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "Fone Bluetooth",
      "marketplace": "mercado_livre",
      "category": { "id": "uuid", "name": "Tecnologia", "color": "#2563EB" },
      "currentPrice": "129.90",
      "previousPrice": "199.90",
      "discountPercent": "35.02",
      "score": 82,
      "highlights": ["free_shipping"],
      "capturedAt": "2026-06-17T12:00:00Z"
    }
  ],
  "nextCursor": null
}
```

Erros:

- `UNAUTHENTICATED` `401`
- `FORBIDDEN` `403`
- `VALIDATION_ERROR` `422`

## `getOfferDetail`

Tipo: query server-side.

Permissao: Admin ou Editor ativo do workspace.

Request:

```json
{
  "workspaceId": "uuid",
  "offerId": "uuid"
}
```

Response:

```json
{
  "offer": {
    "id": "uuid",
    "title": "Fone Bluetooth",
    "sourceUrl": "https://...",
    "affiliateUrl": "https://...",
    "imageUrl": "https://...",
    "marketplace": "mercado_livre",
    "status": "captured",
    "category": { "id": "uuid", "name": "Tecnologia" },
    "tags": [{ "id": "uuid", "name": "Bluetooth" }],
    "currentPrice": "129.90",
    "previousPrice": "199.90",
    "discountPercent": "35.02",
    "couponCode": "APP10",
    "freeShipping": true,
    "commissionPercent": "8.50",
    "score": 82,
    "scoreVersion": "mvp-v1",
    "scoreFactors": {},
    "highlights": ["coupon", "free_shipping"]
  },
  "priceSnapshots": [
    {
      "id": 1,
      "price": "129.90",
      "previousPrice": "199.90",
      "discountPercent": "35.02",
      "observedAt": "2026-06-17T12:00:00Z"
    }
  ]
}
```

Erros:

- `UNAUTHENTICATED` `401`
- `FORBIDDEN` `403`
- `NOT_FOUND` `404`

## `updateOfferManual`

Tipo: Server Action.

Permissao: Admin ativo do workspace.

Necessidade: permitir correcao manual de dados capturados na Fase 2 sem criar
fluxo de aprovacao.

Request:

```json
{
  "workspaceId": "uuid",
  "offerId": "uuid",
  "sourceUrl": "https://...",
  "affiliateUrl": "https://...",
  "title": "string",
  "imageUrl": "https://... opcional",
  "categoryId": "uuid opcional",
  "tagIds": ["uuid"],
  "currentPrice": "129.90",
  "previousPrice": "199.90 opcional",
  "couponCode": "string opcional",
  "freeShipping": true,
  "commissionPercent": "8.50 opcional"
}
```

Response:

```json
{
  "offer": {
    "id": "uuid",
    "score": 82,
    "scoreVersion": "mvp-v1",
    "highlights": ["lowest_price"]
  },
  "updated": true,
  "snapshotCreated": false
}
```

Regras:

- Alteracao de `currentPrice`, `couponCode`, `freeShipping` ou
  `previousPrice` pode gerar snapshot.
- Alteracao somente de titulo/categoria/tags nao gera snapshot.
- Score sempre recalculado quando dado relevante mudar.
- `workspace_id` nunca pode ser alterado.

Erros:

- `UNAUTHENTICATED` `401`
- `FORBIDDEN` `403`
- `NOT_FOUND` `404`
- `VALIDATION_ERROR` `422`
- `CONFLICT` `409`

## Fora destes contratos

- `sendOfferToReview`
- `savePostDraft`
- `approveAndSchedule`
- `rejectOffer`
- `publishNow`
- jobs de Telegram ou captura externa
- redirect publico
