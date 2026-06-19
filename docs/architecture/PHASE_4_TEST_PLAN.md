# Plano de Testes da Fase 4

Status: matriz de testes para Fase 4B.

## Objetivo

Validar a primeira UI navegavel sem alterar garantias de Auth, Workspace, RLS,
ofertas e curadoria.

## Unitarios

Ferramentas:

- Vitest
- React Testing Library

Cobrir:

- renderizacao de badges de score/highlights/status;
- filtros de URL para `listOffers` e `listApprovalQueue`;
- modais de aprovacao/rejeicao;
- validacao de motivo obrigatorio;
- ReviewNote sem acoes editar/excluir;
- estados empty/error/loading;
- mapeamento de erros de dominio para mensagens UI.

## Server actions/adapters

Cobrir:

- `workspaceId` nao aceito no payload.
- usuario sem sessao retorna `UNAUTHENTICATED`/redirect.
- usuario suspenso retorna acesso limitado/forbidden.
- usuario com multiplos workspaces recebe estado controlado sem dados internos.
- Admin e Editor conseguem listar fila e detalhe.
- `approveOffer` envia `expectedStatus: pending`.
- `rejectOffer` envia `expectedStatus: pending`.
- `addReviewNote` bloqueia UI quando status terminal.
- URL filters convertem `minScore`, `minDiscount`, `limit` e datas antes dos
  services.
- `listOfferFilterOptions` popula categorias/tags do workspace ativo.

## E2E

Ferramenta:

- Playwright.

Cenarios:

1. Login Admin -> Dashboard -> abrir Curadoria.
2. Login Editor -> Curadoria -> detalhe pendente -> adicionar nota.
3. Editor aprova oferta pendente.
4. Editor rejeita oferta pendente com motivo.
5. Rejeitar sem motivo mostra erro inline.
6. Oferta aprovada nao mostra textarea de nota nem botoes de decisao.
7. Oferta rejeitada mostra motivo e historico.
8. Public Visitor/anon tenta `/curation` e vai para login.
9. Usuario suspenso ve acesso limitado.
10. Filtros de ofertas persistem na URL.

## Acessibilidade

Cobrir manualmente e, quando possivel, automatizar:

- navegacao por teclado no shell;
- foco preso nos modais;
- retorno de foco ao botao gatilho;
- `aria-current` na navegacao;
- nomes acessiveis para botoes de icone;
- contraste dos badges;
- tabelas com headers;
- mensagens de erro associadas aos campos;
- `prefers-reduced-motion`.

## Responsividade

Breakpoints:

- 360
- 390
- 768
- 1024
- 1280
- 1440
- 1600

Validar:

- sidebar desktop;
- drawer tablet;
- bottom nav mobile;
- tabelas virando cards;
- barra fixa de acoes no detalhe de curadoria mobile;
- filtros em drawer mobile.

## Seguranca

Cenarios:

- payload com `workspaceId` extra.
- route direct para ID inexistente.
- route direct para ID de outro workspace.
- usuario sem membership.
- usuario suspenso.
- duplo clique em aprovar/rejeitar.
- `VERSION_CONFLICT` apos status terminal.
- tentativa de renderizar HTML em nota deve aparecer como texto seguro.

## Regressao visual

Snapshots visuais recomendados:

- Login.
- Dashboard vazio e com dados.
- Offers list desktop/mobile.
- Offer detail.
- Curation queue com tabs.
- Curation detail pending.
- Curation detail approved.
- Curation detail rejected.
- Modais de aprovar/rejeitar.

## Validacoes obrigatorias antes do PR da Fase 4B

```bash
npm run typecheck
npm test
git diff --check
```

Observacao: o repositorio atual define apenas `typecheck` e `test` no
`package.json`. `lint` so deve virar gate obrigatorio depois que a Fase 4B
adicionar um script executavel.

Em Windows PowerShell local, quando `npm.ps1` estiver bloqueado pela execution
policy, usar a variante equivalente:

```powershell
npm.cmd run typecheck
npm.cmd test
git diff --check
```

Se Playwright estiver configurado:

```bash
npm run test:e2e
```

`test:e2e` so deve ser exigido apos a Fase 4B criar o script correspondente.

## Criterio de aceite

`READY_FOR_PHASE_4_STAGING_PREVIEW`: `SIM` somente quando:

- testes unitarios passam;
- typecheck passa;
- E2E dos fluxos principais passa ou a lacuna esta documentada;
- nenhum teste exige Supabase staging para PR;
- nenhuma migration ou alteracao de RLS foi criada.
