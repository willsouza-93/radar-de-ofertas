# Rotas da Fase 4

Status: mapa de rotas para Fase 4B.

## Convencoes

- App Router.
- Server Components para leitura inicial.
- Client Components apenas para interacao local, filtros, modais e acoes.
- Workspace nunca vem da URL nem do body.
- Query params representam filtros, ordenacao, pagina e tabs.

## Rotas publicas

### `/login`

Objetivo: autenticar Admin e Editor.

Permissao: anon e usuarios sem sessao.

Redirecionamentos:

- usuario autenticado com membership ativa -> `/`
- usuario autenticado sem membership ativa -> estado de acesso limitado apos
  validacao no shell

Conteudo:

- email
- senha
- lembrar de mim
- link "Esqueci minha senha" pode ficar como futuro se recuperacao ainda nao
  estiver implementada na UI

## Rotas autenticadas

### `/`

Nome: Dashboard.

Objetivo: mostrar proximas melhores acoes.

Dados:

- `listApprovalQueue({ status: "pending", limit: 5 })`
- `listOffers({ sort: "score_desc", limit: 5 })`

Estados:

- loading: skeleton de filas/cards.
- empty: "Nenhuma acao pendente agora."
- error parcial: dashboard preserva widgets carregados.

### `/offers`

Nome: Lista de ofertas.

Objetivo: listar ofertas capturadas e filtrar oportunidades.

Query params:

- `q`
- `marketplace`
- `categoryId`
- `tagId`
- `minScore`
- `minDiscount`
- `from`
- `to`
- `sort`
- `cursor`

Dados:

- `listOffers(paramsSemWorkspaceId)`

Permissoes:

- Admin: leitura; futura captura/edicao manual pode aparecer se a Fase 4B
  decidir expor o contrato existente.
- Editor: leitura.

MVP-first:

- Captura manual por UI pode ficar fora da primeira navegacao se atrasar o fluxo
  Login -> Curadoria. O backend ja existe; o objetivo desta fase e navegar e
  curar.

### `/offers/[offerId]`

Nome: Detalhe da oferta.

Objetivo: explicar score, preco, highlights e contexto antes da decisao.

Dados:

- `getOfferDetail({ offerId })`
- opcionalmente `getApprovalDetail({ offerId })` para mostrar status de
  curadoria quando existir fila materializada.

Estados:

- not found: "Oferta nao encontrada."
- error parcial em snapshots: manter dados da oferta.

### `/curation`

Nome: Fila de curadoria.

Objetivo: operar ofertas pendentes e consultar aprovadas/rejeitadas.

Query params:

- `status` = `pending | approved | rejected`
- `q`
- `minScore`
- `marketplace`
- `categoryId`
- `sort`
- `cursor`

Dados:

- `listApprovalQueue(paramsSemWorkspaceId)`

Tabs:

- Pendentes
- Aprovadas
- Rejeitadas

Nao criar:

- Em revisao
- Minhas ofertas
- Atribuir responsavel

### `/curation/[queueId]`

Nome: Detalhe de curadoria.

Objetivo: revisar oferta, adicionar nota e aprovar/rejeitar.

Dados:

- `getApprovalDetail({ queueId })`
- `listReviewHistory({ queueId })` pode ser usado se o detalhe nao trouxer
  historico suficiente para paginacao.

Acoes:

- `addReviewNote({ queueId, body })`, apenas se `queue.status = pending`.
- `approveOffer({ queueId, expectedStatus: "pending", note? })`.
- `rejectOffer({ queueId, expectedStatus: "pending", reason })`.

Estados terminais:

- Approved: mostrar decisao, ator e data; ocultar acoes de mutacao.
- Rejected: mostrar motivo; ocultar acoes de mutacao.

## Rotas de erro

### `/not-found`

Mensagem:

```text
Esta pagina saiu do radar.
```

Acoes:

- "Voltar ao dashboard"
- "Ver curadoria"

### Error boundary autenticado

Mensagem:

```text
Nao foi possivel carregar esta area.
```

Acoes:

- "Tentar novamente"
- "Voltar ao dashboard"

## Rotas fora da Fase 4B

- `/register`
- `/public`
- `/r/[shortCode]`
- `/schedule`
- `/channels`
- `/integrations`
- `/users`
- `/logs`
- `/post-editor`
- `/reports`
