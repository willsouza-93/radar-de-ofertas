# Contratos Frontend da Fase 4

Status: contratos de consumo da UI para Fase 4B.

## Convencoes

- Todas as chamadas acontecem server-side via Server Actions, Server Components
  ou adapters server-only.
- Cliente nunca envia `workspaceId`.
- `actorUserId` vem da sessao Supabase validada no servidor.
- Inputs sao validados com Zod ja existente.
- Erros devem ser mapeados para mensagens humanas sem expor SQL, tokens ou
  payloads sensiveis.

## Auth/session

### `getCurrentUserSession`

Uso: shell autenticado.

Responsabilidade:

- obter usuario Supabase;
- resolver membership ativa;
- expor para UI somente:
  - `userId`
  - `email`
  - `displayName`
  - `role: admin | editor`
  - `workspaceName`

Erros:

- sem sessao -> redirect `/login`
- sem membership ativa -> `AccessLimitedState`
- multiplos workspaces -> erro controlado, pois selecao multi-workspace esta
  fora do MVP

## Offers

### `listOffers`

Origem: `src/server/offers/service.ts`.

UI:

- Dashboard: melhores ofertas.
- Offers list: tabela/lista filtrada.

Request UI:

```ts
{
  q?: string;
  marketplace?: "manual" | "mercado_livre" | "shopee";
  categoryId?: string;
  tagId?: string;
  minScore?: number;
  minDiscount?: number;
  from?: string;
  to?: string;
  cursor?: string;
  limit?: number;
  sort?: "score_desc" | "captured_desc" | "discount_desc";
}
```

Nao permitido:

- `workspaceId`
- campos extras

Resposta usada:

- id
- title
- marketplace
- category
- currentPrice
- previousPrice
- discountPercent
- score
- highlights
- capturedAt
- nextCursor

### `getOfferDetail`

UI:

- Offer Detail.
- Painel lateral de contexto no Curation Detail.

Request:

```ts
{ offerId: string }
```

Resposta usada:

- offer completo;
- categoria;
- tags;
- priceSnapshots.

## Curation

### `listApprovalQueue`

UI:

- Dashboard: pendentes prioritarios.
- Curation Queue.

Request:

```ts
{
  status?: "pending" | "approved" | "rejected";
  q?: string;
  minScore?: number;
  marketplace?: "manual" | "mercado_livre" | "shopee";
  categoryId?: string;
  cursor?: string;
  limit?: number;
  sort?: "priority_desc" | "updated_desc" | "captured_desc";
}
```

Resposta usada:

- queueId
- offerId
- status
- title
- score
- highlights
- currentPrice
- marketplace
- updatedAt
- nextCursor

### `getApprovalDetail`

UI:

- Curation Detail.

Request:

```ts
{ queueId: string }
```

ou, no detalhe da oferta:

```ts
{ offerId: string }
```

Resposta usada:

- queue
- offer
- priceSnapshots
- notes
- decisions
- allowedActions

### `addReviewNote`

UI:

- formulario "Adicionar observacao" no detalhe de curadoria.

Request:

```ts
{
  queueId: string;
  body: string;
}
```

Regras UI:

- habilitar apenas com `queue.status === "pending"`.
- body 1..2000 caracteres.
- apos sucesso, limpar textarea e atualizar timeline.
- notas sao permanentes; nao mostrar editar/excluir.

Erros:

- `INVALID_TRANSITION`: fila ja terminalizada.
- `VALIDATION_ERROR`: body invalido.
- `FORBIDDEN`: membership suspensa ou sem permissao.

### `approveOffer`

UI:

- ApproveModal.

Request:

```ts
{
  queueId: string;
  expectedStatus: "pending";
  note?: string | null;
}
```

Regras UI:

- botao visivel apenas em fila `pending`.
- bloquear duplo envio.
- sucesso redireciona ou atualiza detalhe para `approved`.
- tratar `VERSION_CONFLICT` com mensagem para recarregar.

### `rejectOffer`

UI:

- RejectModal.

Request:

```ts
{
  queueId: string;
  expectedStatus: "pending";
  reason: string;
}
```

Regras UI:

- motivo obrigatorio 3..2000 caracteres.
- sucesso atualiza detalhe para `rejected`.
- nao apagar oferta.

### `listReviewHistory`

UI:

- timeline do detalhe.
- paginacao futura se houver muito historico.

Request:

```ts
{
  queueId: string;
  cursor?: string;
  limit?: number;
}
```

Resposta:

- itens `decision` e `note`.
- ordem cronologica.
- ator com id e displayName.

## Mapeamento de erros

| Codigo | Mensagem UI |
| --- | --- |
| `UNAUTHENTICATED` | "Entre novamente para continuar." |
| `FORBIDDEN` | "Seu perfil nao tem acesso a esta acao." |
| `NOT_FOUND` | "Este item nao foi encontrado ou nao pertence ao seu workspace." |
| `VALIDATION_ERROR` | "Revise os campos destacados." |
| `VERSION_CONFLICT` | "Esta oferta foi atualizada por outra acao. Recarregue antes de continuar." |
| `INVALID_TRANSITION` | "Esta oferta ja foi decidida e nao aceita novas alteracoes." |

## Logs estruturados

Na Fase 4B, logs server-side podem registrar:

- evento;
- userId;
- route;
- action;
- queueId/offerId;
- status de sucesso/erro.

Nao registrar:

- token;
- cookies;
- senha;
- chaves Supabase;
- payload completo de links afiliados quando nao necessario.
