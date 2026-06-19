# Mapa de Componentes da Fase 4

Status: mapa entre telas, componentes e responsabilidades.

## Camadas

```text
layout/
  AppShell
  Sidebar
  Topbar
  PageHeader
ui/
  Button, Input, Select, Textarea, Dialog, Drawer, Tabs, Badge
offers/
  OfferCard, OfferTable, OfferFilters, ScoreBadge, HighlightBadge
  PriceHistoryPanel, OfferDetailHero
curation/
  ApprovalQueueList, ApprovalStatusBadge, ReviewNote
  ReviewHistory, ApprovalTimeline, ApproveModal, RejectModal
feedback/
  EmptyState, ErrorState, LoadingState, AccessLimitedState
```

## Componentes por rota

| Rota | Componentes principais |
| --- | --- |
| `/login` | LoginForm, AuthCard, FormError |
| `/` | ActionSummary, PendingCurationList, TopOffersList, DashboardMetricInline |
| `/offers` | OfferFilters, OfferTable, OfferCard, Pagination |
| `/offers/[offerId]` | OfferDetailHero, ScoreBreakdown, HighlightBadge, PriceHistoryPanel |
| `/curation` | ApprovalQueueTabs, ApprovalQueueList, ApprovalStatusBadge |
| `/curation/[queueId]` | CurationDetailHeader, ReviewNoteComposer, ReviewHistory, ApproveModal, RejectModal |

## Componentes minimos

### Sidebar

Props:

```ts
{
  items: Array<{ label: string; href: string; active: boolean; count?: number }>;
  collapsed?: boolean;
}
```

Estados:

- default
- active
- hover
- focus
- collapsed
- mobile drawer

### Topbar

Props:

```ts
{
  user: { displayName: string; email: string; role: "admin" | "editor" };
  workspaceName: string;
  environment?: "local" | "preview" | "staging";
}
```

### PageHeader

Props:

```ts
{
  title: string;
  description?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  primaryAction?: ReactNode;
  secondaryActions?: ReactNode;
}
```

### OfferCard

Uso: dashboard, mobile list.

Conteudo:

- titulo
- marketplace
- preco atual/anterior
- score
- highlights
- categoria
- CTA "Ver detalhes" ou "Revisar"

### OfferTable

Uso: `/offers` desktop/tablet.

Colunas MVP:

- Produto
- Marketplace
- Categoria
- Preco
- Desconto
- Score
- Destaques
- Capturada em

Mobile: renderizar como `OfferCard`.

### OfferFilters

Filtros:

- busca
- marketplace
- categoria
- tag
- score minimo
- desconto minimo
- periodo
- sort

Regras:

- filtros persistem na URL.
- mobile abre drawer.
- "Limpar filtros" visivel quando houver filtro ativo.

### ScoreBadge

Variantes:

- ring grande
- pill compacta
- barra com fatores

Labels:

- 90-100: Excelente
- 75-89: Forte
- 60-74: Moderado
- 0-59: Baixo

Nunca depender apenas de cor.

### HighlightBadge

Valores:

- `lowest_price`: Menor preco
- `coupon`: Cupom
- `free_shipping`: Frete gratis
- `high_commission`: Alta comissao

### StatusBadge

Valores de curadoria:

- `pending`: Pendente
- `approved`: Aprovada
- `rejected`: Rejeitada

Nao criar:

- `under_review`
- `scheduled`
- `published`

### ReviewNote

Conteudo:

- autor
- data
- corpo

Sem acoes:

- editar
- excluir

Mensagem auxiliar:

```text
Observacoes sao permanentes no historico.
```

### ReviewHistory

Une:

- notas
- decisoes

Ordem:

- cronologica crescente no detalhe;
- pode oferecer "mais recentes primeiro" apenas se documentado e consistente.

### ApprovalTimeline

Estados:

- Capturada
- Pendente
- Aprovada ou Rejeitada

Nao incluir:

- Agendada
- Publicada

### ApproveModal

Campos:

- resumo da oferta
- nota opcional

Acoes:

- "Cancelar"
- "Aprovar oferta"

### RejectModal

Campos:

- resumo da oferta
- motivo obrigatorio

Acoes:

- "Cancelar"
- "Rejeitar oferta"

### EmptyState

Tipos:

- primeira carga sem dados
- filtro sem resultado
- fila em dia
- acesso limitado

### ErrorState

Tipos:

- pagina
- bloco/widget
- action

### LoadingState

Tipos:

- shell skeleton
- table skeleton
- card skeleton
- action button loading

## Estados obrigatorios por componente

Todo componente interativo deve cobrir:

- default
- hover
- focus-visible
- active
- disabled
- loading quando aplicavel
- error quando aplicavel

## Itens movidos para futuro

- PostPreviewCard.
- Editor de post.
- Date picker de agendamento.
- Channel status.
- Publication timeline.
- Analytics charts avancados.
