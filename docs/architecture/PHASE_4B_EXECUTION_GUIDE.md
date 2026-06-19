# Guia de Execucao da Fase 4B

Status: guia para implementacao futura da UI. Nao executar na Fase 4A.

## Precondicoes

- PR da Fase 4A aprovado e mergeado.
- `main` sincronizada.
- Fase 3B aplicada e validada em Supabase Staging.
- Vercel Preview/Staging com Supabase public env vars configuradas.
- Nenhuma migration pendente.

## Ordem exata

1. Criar branch `feature/phase-4b-first-navigable-ui`.
2. Confirmar `git status` limpo, exceto alteracoes conhecidas do usuario.
3. Revisar `src/server/offers` e `src/server/curation`.
4. Criar estrutura de app/layout se ainda nao existir.
5. Configurar Supabase SSR usando somente chaves publicas no cliente.
6. Criar tokens Tailwind/CSS a partir de `docs/assets/design-tokens.json`.
7. Implementar componentes `ui` base.
8. Implementar App Shell.
9. Implementar login.
10. Implementar route guards.
11. Implementar Dashboard.
12. Implementar Offers list.
13. Implementar Offer detail.
14. Implementar Curation queue.
15. Implementar Curation detail.
16. Implementar modais de approve/reject.
17. Implementar ReviewNote composer e history.
18. Implementar loading/empty/error/access limited.
19. Implementar testes unitarios.
20. Implementar E2E principal.
21. Rodar validacoes.
22. Abrir PR.

## O que Codex pode executar automaticamente

- Criar arquivos de UI.
- Criar componentes.
- Criar testes.
- Rodar typecheck/test/lint.
- Abrir PR.

## O que nao deve executar automaticamente

- Alterar Supabase staging.
- Criar migrations.
- Alterar RLS.
- Alterar Vercel env vars.
- Aplicar deploy manual.
- Criar release.

## Estrategia de dados local

Preferir adapters server-side reais contra Supabase local quando o app existir.

Para testes de componente, usar fixtures estaticas derivadas dos tipos:

- `OfferListItem`
- `OfferDetail`
- `ApprovalQueueItem`
- `ApprovalDetail`
- `ReviewHistoryItem`

Fixtures nao podem conter secrets ou dados reais de clientes.

## Rollback

Como a Fase 4B nao deve alterar banco:

- rollback local = revert/commit corretivo de UI.
- rollback preview = reverter PR ou rollback de deploy Vercel.
- rollback Supabase = nao aplicavel.

## Deploy/Preview

- PR deve gerar Vercel Preview automaticamente se o projeto estiver conectado.
- Preview usa Supabase staging conforme decisao operacional existente.
- Nao configurar service role.

## Checklist antes do PR

- [ ] Nenhum arquivo em `supabase/migrations` alterado.
- [ ] Nenhum SQL novo.
- [ ] Nenhuma env var real.
- [ ] Nenhum `workspaceId` em forms/actions client-side.
- [ ] Estados de curadoria limitados a `pending`, `approved`, `rejected`.
- [ ] Public Visitor sem backoffice.
- [ ] Admin/Editor cobertos.
- [ ] Loading/empty/error cobertos.
- [ ] Mobile 390 validado.
- [ ] `git diff --check` limpo.

## Gate

`READY_FOR_PHASE_4B_IMPLEMENTATION`: `SIM`

A Fase 4B pode iniciar apos review/merge da Fase 4A.
