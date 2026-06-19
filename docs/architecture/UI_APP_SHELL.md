# UI App Shell

Status: especificacao de layout para a primeira UI navegavel.

## Principios

- Acao antes de metrica.
- Tema claro como experiencia principal; tema escuro complementar.
- Glassmorphism apenas em superficies temporarias: header flutuante, drawer,
  modal e popover.
- Navegacao interna apenas para Admin e Editor.
- Public Visitor nao possui shell, dashboard ou backoffice.

## Estrutura desktop

Viewport alvo: `1440px`.

```text
body bg-canvas
  skip link
  AppShell
    Sidebar 256px
    MainArea
      Topbar 64px
      PageContent max 1600px, padding 32px
```

### Sidebar

Itens da Fase 4B:

- Dashboard
- Ofertas
- Curadoria

Itens visiveis como futuro, se necessario, devem permanecer ocultos na UI final
da Fase 4B:

- Agendamentos
- Canais
- Relatorios
- Integracoes
- Usuarios
- Logs

Comportamento:

- Item ativo com fundo `bg-subtle`, borda esquerda `primary`.
- Contador discreto em Curadoria para pendentes.
- Botao de recolher opcional no desktop.
- Nao exibir itens fora de escopo para evitar expectativa falsa.

### Topbar

Conteudo:

- Busca local/contextual opcional, nao global no MVP.
- Ambiente: `Preview/Staging` quando aplicavel.
- Status de sessao.
- Toggle de tema.
- Menu do usuario com nome, papel e acao "Sair".

Nao incluir:

- notificacoes;
- status de automacao;
- atalhos de publicacao;
- menu de canais.

## Estrutura tablet

Viewport alvo: `768px`.

- Sidebar vira drawer acionado por botao "Menu".
- Conteudo usa padding `24px`.
- Cards principais em 2 colunas quando houver espaco.
- Detalhe de curadoria pode usar drawer para historico ou painel lateral.
- Topbar preserva menu, titulo curto e usuario.

## Estrutura mobile

Viewport alvo: `390px`.

- Header `56px`.
- Navegacao inferior com 3 itens:
  - Inicio
  - Ofertas
  - Curadoria
- Conteudo padding `16px`.
- Tabelas viram listas expansivas.
- Acoes de aprovar/rejeitar ficam em barra fixa inferior no detalhe de
  curadoria.
- Modais de aprovacao/rejeicao usam bottom sheet ou pagina cheia.

## PageHeader

Padrao:

```text
Breadcrumb opcional
Titulo
Descricao curta
Acoes primarias/secundarias
Filtros ou tabs contextuais
```

Regras:

- Uma acao primaria por tela.
- Acoes destrutivas usam variante destructive.
- Em mobile, a acao primaria pode ir para barra fixa quando for decisao.

## Guardas de rota

- `(auth)/login`: publico, mas redireciona Admin/Editor autenticado para
  `/dashboard`.
- `(app)/page.tsx`: redirect server-side para `/dashboard`.
- `(app)/*`: exige usuario autenticado com membership ativa Admin ou Editor.
- Usuario sem membership, suspenso ou de outro workspace recebe estado de
  acesso limitado sem dados internos.
- Usuario com mais de uma membership ativa recebe estado controlado informando
  que selecao multi-workspace ainda nao faz parte do MVP.

## Estados globais do shell

### Loading inicial

- Skeleton da sidebar, topbar e primeira dobra.
- Nunca spinner central isolado.

### Erro de sessao

Mensagem:

```text
Nao foi possivel validar sua sessao. Entre novamente para continuar.
```

Acoes:

- "Entrar novamente"

### Acesso limitado

Mensagem:

```text
Seu acesso ao workspace nao esta ativo.
```

Texto auxiliar:

```text
Se voce acredita que isso e um engano, fale com o administrador do workspace.
```

## Acessibilidade

- Skip link "Pular para o conteudo".
- Sidebar com `nav` e `aria-label="Navegacao principal"`.
- Item ativo com `aria-current="page"`.
- Drawer com foco preso e retorno ao gatilho.
- Bottom navigation com labels visiveis.
- Focus visible nunca removido.
- Alvo de toque minimo `44x44px`.

## Estrutura sugerida para Fase 4B

```text
src/app/
  (auth)/login/page.tsx
  (app)/layout.tsx
  (app)/page.tsx
  (app)/dashboard/page.tsx
  (app)/offers/page.tsx
  (app)/offers/[offerId]/page.tsx
  (app)/curation/page.tsx
  (app)/curation/[queueId]/page.tsx
  error.tsx
  not-found.tsx
  loading.tsx
src/components/
  layout/
  ui/
  offers/
  curation/
  feedback/
```
