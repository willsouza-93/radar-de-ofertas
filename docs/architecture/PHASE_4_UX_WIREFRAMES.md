# Wireframes Textuais da Fase 4

Status: handoff equivalente ao Figma para futura criacao manual.

## Desktop 1440px

### Login

```text
Canvas bg-canvas
  AuthCard 400px central
    Logo/Nome
    H1 "Entre no Radar de Ofertas"
    Text "Acesse a curadoria e aprove as melhores oportunidades."
    Email input
    Senha input
    Row: lembrar de mim / esqueci minha senha
    Button "Entrar"
    Error inline
```

### Dashboard

```text
Sidebar | Topbar
Content
  PageHeader "Dashboard"
  Section "Requer sua atencao"
    PendingCurationList 5 itens
  Grid 2 colunas
    TopOffersList
    CurationSummary
  Inline metrics discretas
```

Prioridade visual: lista de pendencias antes de metricas.

### Offers list

```text
PageHeader "Ofertas"
  descricao
  acao secundaria "Atualizar lista" se existir refresh local
FilterBar sticky
OfferTable
Pagination
```

### Offer detail

```text
PageHeader com breadcrumb
Grid 8/4
  Main
    OfferDetailHero
    ScoreBreakdown
    PriceHistoryPanel
  Aside sticky
    Highlights
    Links
    Curation status card
```

### Curation queue

```text
PageHeader "Curadoria"
Tabs: Pendentes | Aprovadas | Rejeitadas
Toolbar filtros
List 7/12
Preview/context 5/12 opcional
```

### Curation detail

```text
PageHeader
  title da oferta
  StatusBadge
Grid 8/4
  Main
    Offer context
    Score/highlights
    ReviewNoteComposer se pending
    ReviewHistory
  Aside sticky
    ApprovalTimeline
    Approve/Reject actions se pending
```

ApproveModal:

```text
Dialog 520px
  H2 "Aprovar oferta?"
  resumo
  nota opcional
  Cancelar | Aprovar oferta
```

RejectModal:

```text
Dialog 520px
  H2 "Rejeitar oferta?"
  resumo
  motivo obrigatorio
  Cancelar | Rejeitar oferta
```

## Tablet 768px

- Sidebar vira drawer.
- Conteudo em uma ou duas colunas.
- Offer detail empilha hero e painel de contexto.
- Curation detail mostra acoes logo apos hero e historico abaixo.
- Filtros ficam em drawer lateral.

## Mobile 390px

### Shell

```text
Topbar 56px
Content 16px
BottomNav Inicio | Ofertas | Curadoria
```

### Offers

- Filter button abre drawer full screen.
- Cada oferta vira card compacto.
- Score e preco sempre visiveis.

### Curation detail

```text
Header compacto
StatusBadge
Offer summary card
Score card
ReviewNoteComposer
History timeline
Bottom action bar:
  Rejeitar | Aprovar
```

Em status terminal:

- bottom action bar desaparece.
- timeline sobe como conteudo principal.

## Estados vazios

### Dashboard sem pendencias

Titulo:

```text
Tudo em dia por aqui.
```

Texto:

```text
Nenhuma oferta aguarda curadoria agora. Voce pode revisar as melhores ofertas capturadas.
```

Acao:

```text
Ver ofertas
```

### Offers sem resultado

Titulo:

```text
Nenhuma oferta encontrada.
```

Texto:

```text
Limpe ou ajuste os filtros para ampliar a busca.
```

Acao:

```text
Limpar filtros
```

### Curadoria vazia

Titulo:

```text
Fila em dia.
```

Texto:

```text
Nenhuma oferta pendente de decisao.
```

Acao:

```text
Ver ofertas
```

## Estados de erro

- Erro de pagina: preservar shell e mostrar retry.
- Erro de widget: alert local.
- Erro de action: toast + mensagem inline no modal/form.
- `VERSION_CONFLICT`: "Esta oferta foi atualizada. Recarregue antes de continuar."

## Loading

- Shell skeleton na primeira carga.
- Table skeleton em listas.
- Cards skeleton em mobile.
- Botao com label "Aprovando..." ou "Rejeitando..." durante action.
