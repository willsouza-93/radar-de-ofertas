# Biblioteca de Componentes da Fase 4

Status: especificacao textual para implementacao e futura criacao no Figma.

## Tokens

Fonte:

- `docs/product/02-design-system.md`
- `docs/assets/design-tokens.json`

Base:

- Fonte: Geist Sans, fallback Inter/system-ui.
- Radius: 6, 10, 14, 20, pill.
- Motion: 120ms, 180ms, 240ms.
- Tema claro principal.

## Componentes base

### Button

Variantes:

- primary
- secondary
- ghost
- destructive

Estados:

- default
- hover
- focus-visible
- active
- disabled
- loading

Labels de dominio:

- Entrar
- Ver detalhes
- Revisar
- Adicionar observacao
- Aprovar oferta
- Rejeitar oferta
- Limpar filtros

### Input/Textarea

Inclui:

- label
- helper
- erro
- contador opcional

Textarea de nota:

- max 2000 caracteres
- helper: "Observacoes sao permanentes no historico."

### Dialog

Usos:

- ApproveModal
- RejectModal

Regras:

- foco preso;
- ESC fecha quando nao ha envio em andamento;
- botao destrutivo apenas para rejeicao;
- retorno de foco ao gatilho.

### Tabs

Uso:

- status de curadoria.

Tabs:

- Pendentes
- Aprovadas
- Rejeitadas

### Badge

Tipos:

- score
- highlight
- status
- marketplace
- category

## Componentes de dominio

### ScoreBadge

Props:

```ts
{
  value: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}
```

Regras:

- value entre 0 e 100.
- label sempre disponivel para leitores de tela.

### HighlightBadge

Props:

```ts
{ type: "lowest_price" | "coupon" | "free_shipping" | "high_commission" }
```

Textos:

- Menor preco
- Cupom
- Frete gratis
- Alta comissao

### ApprovalStatusBadge

Props:

```ts
{ status: "pending" | "approved" | "rejected" }
```

Textos:

- Pendente
- Aprovada
- Rejeitada

### OfferFilters

Campos:

- busca
- marketplace
- categoria
- tag
- score minimo
- desconto minimo
- periodo
- ordenar por

Responsividade:

- desktop: barra sticky.
- mobile: drawer.

### OfferTable

Desktop:

- table semantica.

Mobile:

- cards expansivos.

### ReviewNoteComposer

Visivel somente:

- queue `pending`;
- Admin/Editor ativo.

Estados:

- default
- focus
- invalid
- submitting
- disabled terminal

### ReviewHistory

Itens:

- nota
- decisao approved
- decisao rejected

Cada item mostra:

- tipo
- autor
- data
- texto/motivo

### ApprovalTimeline

Etapas:

- Capturada
- Pendente
- Aprovada/Rejeitada

Nao incluir:

- Agendada
- Publicada

## Conteudo padrao

### Aprovacao

Titulo:

```text
Aprovar oferta?
```

Texto:

```text
A oferta ficara aprovada para uma fase futura de agendamento. Nada sera publicado agora.
```

### Rejeicao

Titulo:

```text
Rejeitar oferta?
```

Texto:

```text
Informe o motivo para manter o historico de curadoria claro.
```

### Nota

Placeholder:

```text
Ex.: cupom validado no app, mas desconto menor no desktop.
```

## Handoff Figma futuro

Criar paginas:

- Design System
- Components
- Wireframes
- User Flows
- Responsive States

Criar frames:

- Desktop 1440
- Tablet 768
- Mobile 390

Componentes minimos:

- Sidebar
- Topbar
- PageHeader
- OfferCard
- OfferTable
- OfferFilters
- ScoreBadge
- HighlightBadge
- StatusBadge
- ReviewNote
- ReviewHistory
- ApprovalTimeline
- ApproveModal
- RejectModal
- EmptyState
- ErrorState
- LoadingState
