# Rotas da Fase 4

Status: mapa de rotas para Fase 4B.

## Convencoes

- App Router.
- Server Components para leitura inicial.
- Client Components apenas para interacao local, filtros, modais e acoes.
- Workspace nunca vem da URL nem do body.
- Query params representam filtros, ordenacao, pagina e tabs.
- Query params chegam como strings e devem ser parseados/coercidos server-side
  antes de chamar os services.

## Rota oficial do Dashboard

`/dashboard` e a rota oficial do Dashboard da Fase 4B.

Motivo:

- a decisao operacional aprovada em
  `docs/decisions/PHASE_1_READINESS_CHECKLIST.md` define o redirect
  pos-autenticacao como `<base-url>/dashboard`;
- fluxos de convite, confirmacao ou callback Auth podem direcionar usuarios
  para essa rota;
- manter a rota acessivel evita que login bem-sucedido termine em 404.

`/` deve existir apenas como alias/redirect server-side para `/dashboard`.

## Rotas publicas

### `/login`

Objetivo: autenticar Admin e Editor.

Permissao: anon e usuarios sem sessao.

Redirecionamentos:

- usuario autenticado com membership ativa -> `/dashboard`
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

Nome: Redirect raiz.

Objetivo: manter a raiz do app segura e previsivel.

Comportamento:

- usuario autenticado com membership ativa -> redirect `/dashboard`;
- usuario anonimo -> redirect `/login`;
- usuario sem membership ativa -> `AccessLimitedState` apos validacao do shell.

### `/dashboard`

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
- `limit`

Parsing obrigatorio antes do service:

- `minScore`: string -> inteiro `0..100`.
- `minDiscount`: string -> numero `0..100`.
- `limit`: string -> inteiro `1..100`, usando default do service quando
  ausente.
- `from`/`to`: string -> ISO datetime valido ou erro de validacao.
- `categoryId`/`tagId`: UUID valido.
- strings vazias viram `undefined`.
- valores invalidos geram erro controlado de filtro e nao devem ser repassados
  diretamente ao service.

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
- `limit`

Parsing obrigatorio antes do service:

- `minScore`: string -> inteiro `0..100`.
- `limit`: string -> inteiro `1..100`, usando default do service quando
  ausente.
- `categoryId`: UUID valido.
- `status`, `marketplace` e `sort` devem ser validados contra os enums
  permitidos.
- strings vazias viram `undefined`.
- valores invalidos geram erro controlado de filtro e nao devem ser repassados
  diretamente ao service.

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
