# CHANGELOG FASE 4

Status: implementacao local da Fase 4B.

## Entregue

- Introduzida a primeira UI navegavel do backoffice com Next.js App Router.
- Criadas rotas oficiais:
  - `/login`
  - `/dashboard`
  - `/offers`
  - `/offers/[offerId]`
  - `/curation`
  - `/curation/[queueId]`
- Implementado AppShell autenticado com sidebar, topbar, bottom nav mobile,
  skip link e estados de acesso limitado.
- Implementados componentes MVP:
  - Button
  - Form fields
  - StatusBadge
  - ScoreBadge
  - HighlightBadge
  - OfferCard
  - OfferTable
  - OfferFilters
  - ApprovalQueueList
  - ReviewHistory
  - EmptyState
  - ErrorState
  - LoadingState
- Preparada arquitetura de tema com CSS variables para Light/Dark/System futuro.
- Criada camada server-only para Supabase SSR usando apenas anon key publica.
- Criado parsing server-side de filtros vindos da URL antes de consultas.
- Implementadas Server Actions para:
  - login;
  - logout;
  - adicionar observacao append-only;
  - aprovar oferta via `apply_approval_decision`;
  - rejeitar oferta via `apply_approval_decision`.

## Decisoes aplicadas

- `/dashboard` permanece como rota oficial pos-login.
- `workspaceId` nao e aceito em filtros, forms ou actions da UI.
- Workspace e membership sao resolvidos server-side.
- Multi-workspace e mapeado para estado bloqueado amigavel.
- `under_review`, `assigned_to`, edicao/exclusao de nota, publicacao e
  agendamento permanecem fora de escopo.
- Aprovacao/rejeicao nao altera `approval_queue.status` diretamente pela UI.

## Testes adicionados

- Parsing/coercao de filtros de ofertas e curadoria.
- Rejeicao de status `under_review`.
- Garantia de que `workspaceId` extra nao chega aos filtros parseados.
- Renderizacao de ScoreBadge, StatusBadge, HighlightBadge, EmptyState e
  ReviewHistory append-only.

## Riscos e limitacoes

- Playwright/E2E ainda nao foi configurado; a Fase 4B cobre testes unitarios e
  valida fluxo via Server Components/Server Actions.
- O ambiente precisa de `NEXT_PUBLIC_SUPABASE_URL` e
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` para navegacao autenticada real.
- O npm reportou vulnerabilidades moderadas apos instalacao de dependencias;
  nao foi executado `npm audit fix --force` para evitar mudancas amplas sem
  revisao.
- Figma nao foi alterado nesta fase; a implementacao segue os artefatos ja
  materializados no arquivo autorizado.

## Fora de escopo mantido

- Telegram, WhatsApp e publicacao.
- Agendamento e scheduler.
- IA, geracao automatica de texto, scraping e marketplace APIs.
- Site publico, redirect publico e Public Visitor UI.
- Upload, Storage e imagens otimizadas externas.
