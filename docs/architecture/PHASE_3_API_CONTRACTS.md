# Contratos da Fase 3

Status: contratos para Server Actions e queries server-side da Fase 3B.

## Convencoes

- Workspace efetivo e sempre derivado da membership ativa.
- Cliente nao envia `workspaceId`.
- Validacao com Zod no servidor.
- Erros seguem envelope estavel existente.
- Datas em ISO 8601 UTC.
- Todos os contratos exigem usuario autenticado Admin ou Editor ativo.

## `listApprovalQueue`

Tipo: query server-side.

Permissao: Admin ou Editor ativo.

Request:

```json
{
  "status": "pending|under_review|approved|rejected opcional",
  "q": "fone opcional",
  "minScore": 70,
  "marketplace": "manual|mercado_livre|shopee opcional",
  "categoryId": "uuid opcional",
  "cursor": "opaque opcional",
  "limit": 30,
  "sort": "priority_desc|updated_desc|captured_desc"
}
```

Response:

```json
{
  "items": [
    {
      "queueId": "uuid",
      "offerId": "uuid",
      "status": "pending",
      "title": "Fone Bluetooth",
      "score": 82,
      "highlights": ["coupon", "free_shipping"],
      "currentPrice": "99.90",
      "marketplace": "mercado_livre",
      "updatedAt": "2026-06-18T12:00:00Z"
    }
  ],
  "nextCursor": null
}
```

Erros: `UNAUTHENTICATED`, `FORBIDDEN`, `VALIDATION_ERROR`.

## `getApprovalDetail`

Tipo: query server-side.

Request:

```json
{
  "queueId": "uuid opcional",
  "offerId": "uuid opcional"
}
```

Regra: informar exatamente um identificador. O servidor resolve dentro do
workspace ativo.

Response:

```json
{
  "queue": {
    "id": "uuid",
    "status": "under_review",
    "priorityScore": 82,
    "updatedAt": "2026-06-18T12:00:00Z"
  },
  "offer": {
    "id": "uuid",
    "title": "Fone Bluetooth",
    "score": 82,
    "scoreVersion": "mvp-v1",
    "scoreFactors": {},
    "highlights": ["lowest_price"],
    "currentPrice": "99.90",
    "affiliateUrl": "https://..."
  },
  "priceSnapshots": [],
  "notes": [],
  "decisions": [],
  "allowedActions": ["approve", "reject", "add_note"]
}
```

Erros: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`.

## `approveOffer`

Tipo: Server Action.

Request:

```json
{
  "queueId": "uuid",
  "expectedStatus": "pending|under_review",
  "note": "string opcional"
}
```

Response:

```json
{
  "queueId": "uuid",
  "offerId": "uuid",
  "status": "approved",
  "decisionId": "uuid",
  "decidedAt": "2026-06-18T12:00:00Z"
}
```

Validacoes:

- status atual deve ser `pending` ou `under_review`;
- `expectedStatus` deve conferir;
- nota opcional maximo 2000 caracteres.

Erros:

- `UNAUTHENTICATED`;
- `FORBIDDEN`;
- `NOT_FOUND`;
- `INVALID_TRANSITION`;
- `VERSION_CONFLICT`;
- `VALIDATION_ERROR`.

## `rejectOffer`

Tipo: Server Action.

Request:

```json
{
  "queueId": "uuid",
  "expectedStatus": "pending|under_review",
  "reason": "Preco subiu antes da revisao"
}
```

Response:

```json
{
  "queueId": "uuid",
  "offerId": "uuid",
  "status": "rejected",
  "decisionId": "uuid",
  "decidedAt": "2026-06-18T12:00:00Z"
}
```

Validacoes:

- `reason` obrigatorio, 3..2000 caracteres;
- status atual deve permitir rejeicao;
- `expectedStatus` deve conferir.

Erros: mesmos de `approveOffer`.

## `addReviewNote`

Tipo: Server Action.

Request:

```json
{
  "queueId": "uuid",
  "body": "Cupom valido apenas no app."
}
```

Response:

```json
{
  "note": {
    "id": "uuid",
    "queueId": "uuid",
    "body": "Cupom valido apenas no app.",
    "createdAt": "2026-06-18T12:00:00Z"
  },
  "queueStatus": "under_review"
}
```

Validacoes:

- body obrigatorio, 1..2000 caracteres;
- fila nao pode estar terminalizada, salvo decisao futura explicita;
- se fila estava `pending`, pode mudar para `under_review`.

Erros: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`,
`INVALID_TRANSITION`, `VALIDATION_ERROR`.

## `listReviewHistory`

Tipo: query server-side.

Request:

```json
{
  "queueId": "uuid",
  "cursor": "opaque opcional",
  "limit": 30
}
```

Response:

```json
{
  "items": [
    {
      "type": "decision",
      "decision": "approved",
      "actor": { "id": "uuid", "displayName": "Willian Cesar" },
      "createdAt": "2026-06-18T12:00:00Z"
    },
    {
      "type": "note",
      "body": "Cupom validado manualmente.",
      "actor": { "id": "uuid", "displayName": "Editor" },
      "createdAt": "2026-06-18T11:50:00Z"
    }
  ],
  "nextCursor": null
}
```

Erros: `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`,
`VALIDATION_ERROR`.

## Fora destes contratos

- `approveAndSchedule`;
- `savePostDraft`;
- `publishNow`;
- Telegram;
- jobs;
- redirect publico;
- geracao de texto.
