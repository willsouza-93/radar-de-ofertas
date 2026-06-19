# Plano de Implementacao da Fase 4

Status: especificacao executavel para Fase 4B. Nao implementar codigo nesta
fase.

## Verificacao Figma

`FIGMA_INTEGRATION_AVAILABLE`: `NAO`

A integracao Figma esta autenticada para `Willian Souza`, mas o plano retornado
possui assento `View`. Portanto, a integracao nao esta utilizavel para criar ou
editar arquivos. A Fase 4A segue pela documentacao equivalente:

- [PHASE_4_UX_WIREFRAMES.md](PHASE_4_UX_WIREFRAMES.md)
- [PHASE_4_COMPONENT_LIBRARY.md](PHASE_4_COMPONENT_LIBRARY.md)
- [PHASE_4_USER_FLOWS.md](PHASE_4_USER_FLOWS.md)

## Objetivo

Construir a primeira interface navegavel do backoffice do Radar de Ofertas,
validando o fluxo:

```text
Login -> Dashboard -> Offers -> Offer Detail -> Curation Queue ->
Curation Detail -> Add Review Note -> Approve / Reject -> History
```

## Escopo MVP

Incluido na Fase 4B:

- App Shell autenticado.
- Login para Admin e Editor.
- Dashboard orientado a proximas acoes.
- Lista de ofertas capturadas.
- Detalhe da oferta com score, highlights e snapshots.
- Fila de curadoria.
- Detalhe de curadoria.
- Adicao de observacao append-only.
- Aprovar oferta pendente.
- Rejeitar oferta pendente com motivo obrigatorio.
- Historico de notas e decisoes.
- Estados de loading, empty, error e access limited.
- Responsividade desktop, tablet e mobile.
- Acessibilidade WCAG 2.2 AA como meta.

## Fora de escopo

Nao implementar na Fase 4B:

- Telegram, WhatsApp ou qualquer publicacao.
- Agendamento, scheduler ou calendario operacional.
- Editor de post, templates ou geracao de texto.
- IA, OpenAI, Claude, scraping ou marketplace APIs.
- Analytics avancado.
- Area publica, redirect publico ou Public Visitor UI.
- Upload de imagem, Storage ou gerenciamento de arquivos.
- Gestao de usuarios, integracoes, canais e logs tecnicos.

## Decisoes obrigatorias

- Consumir os services existentes em `src/server/offers` e
  `src/server/curation`.
- Nunca enviar `workspaceId` a partir do cliente.
- Resolver workspace server-side pela membership ativa.
- Public Visitor nao acessa dashboard nem rotas internas.
- `anon` nao acessa tabelas internas.
- Admin e Editor podem aprovar/rejeitar curadoria.
- Nenhum secret e nenhuma service role key no frontend.
- Preview/Staging atual continua sendo o ambiente de validacao integrada.
- Estados de curadoria da UI: `pending`, `approved`, `rejected` somente.
- `review_notes` e append-only: criar nova observacao para corrigir contexto.

## Sequencia de implementacao futura

1. Criar branch da Fase 4B a partir de `main`.
2. Confirmar que nao ha migrations pendentes.
3. Instalar/configurar base visual se ainda nao existir: Next.js App Router,
   Tailwind, tokens, Radix/shadcn ou primitives equivalentes.
4. Criar clientes Supabase SSR/browser sem service role.
5. Criar rota de login e protecao do grupo autenticado.
6. Implementar App Shell com Sidebar, Topbar e PageHeader.
7. Criar componentes base e componentes de dominio.
8. Implementar Dashboard com dados reais possiveis e placeholders honestos para
   metricas ainda fora do MVP.
9. Implementar Offers list e Offer detail usando `listOffers` e
   `getOfferDetail`.
10. Implementar Curation queue e Curation detail usando `listApprovalQueue` e
    `getApprovalDetail`.
11. Implementar `addReviewNote`, `approveOffer` e `rejectOffer` com feedback
    transacional e `expectedStatus = pending`.
12. Implementar estados loading/empty/error/access limited por rota.
13. Implementar testes unitarios de componentes e testes E2E dos fluxos
    principais.
14. Rodar validacoes locais.
15. Abrir PR sem aplicar mudancas em Supabase/Vercel.

## Dependencias

- Fase 1 aplicada: Auth, workspace, membership e RLS.
- Fase 2 aplicada: ofertas, categorias, tags, snapshots e score.
- Fase 3 aplicada: curadoria, notas, decisoes e funcao atomica de decisao.
- Vercel Preview/Staging configurado com:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Nenhuma necessidade atual de `SUPABASE_SERVICE_ROLE_KEY`.

## Riscos

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| UI assumir estados antigos como `under_review` | Alto | Usar implementation atual e `PHASE_3A_REVIEW` como autoridade |
| Cliente enviar `workspaceId` | Alto | Contratos UI sem workspaceId e testes de payload |
| Aprovacao duplicada | Medio | Enviar `expectedStatus: pending` e tratar `VERSION_CONFLICT` |
| Shell expor rotas internas a anon | Alto | Route guards server-side e RLS como defesa |
| Dashboard virar painel de vanity metrics | Medio | Primeira dobra orientada a fila e proximas acoes |
| Mobile perder acao principal | Medio | CTA fixo em detalhe de curadoria |

## Criterios de aceite

- Admin e Editor autenticados acessam o shell.
- Usuario anonimo e Public Visitor sao redirecionados ao login em rotas internas.
- Dashboard mostra proximas acoes reais: pendentes de curadoria e ofertas fortes.
- Lista de ofertas suporta filtros MVP server-side.
- Detalhe de oferta mostra score, highlights, links, categoria/tags e snapshots.
- Fila de curadoria lista `pending`, `approved` e `rejected`.
- Detalhe de curadoria permite nota apenas quando `pending`.
- Aprovar pendente gera decisao e atualiza UI sem bypass direto.
- Rejeitar pendente exige motivo.
- Historico mostra notas e decisoes em ordem cronologica.
- Estados loading, empty, error e access limited estao presentes.
- Nenhuma UI de publicacao/agendamento/Telegram aparece.

## Gate

`READY_FOR_PHASE_4B`: `SIM`, se a Fase 4B seguir estes documentos e nao alterar
banco, RLS, migrations ou ambientes sem nova autorizacao.
