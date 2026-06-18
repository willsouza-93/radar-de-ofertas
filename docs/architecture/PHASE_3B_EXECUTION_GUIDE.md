# Guia de Execucao da Fase 3B

Status: instrucoes para implementacao futura. Nao executar na Fase 3A.

## Precondicoes

- PR da Fase 3A aprovado e mergeado.
- `main` sincronizada.
- Fase 2B aplicada e validada em staging.
- Supabase CLI autenticado e projeto linkado.
- Docker funcional para testes locais.

## Ordem exata

1. Criar branch `feature/phase-3b-curation-approval`.
2. Criar migrations com Supabase CLI.
3. Implementar tipos/enums.
4. Implementar tabelas de curadoria.
5. Implementar constraints/indices/triggers.
6. Implementar RLS/grants.
7. Atualizar seed local/teste.
8. Criar testes pgTAP.
9. Criar modulo TypeScript de curadoria.
10. Criar testes unitarios/servico.
11. Rodar validacoes locais.
12. Abrir PR.
13. Aguardar CI/revisao.
14. Apos merge, pedir autorizacao para staging.

## Validacoes locais

```bash
npx.cmd supabase db reset
npx.cmd supabase test db
npm.cmd run typecheck
npm.cmd test
git diff --check
```

## Staging

Somente com autorizacao:

```bash
npx.cmd supabase migration list
npx.cmd supabase db push
npx.cmd supabase migration list
```

Nao aplicar:

- `supabase/seed.sql`;
- scripts destrutivos;
- dados genericos;
- secrets.

## Rollback

- Local: ajustar migration antes de merge e resetar banco.
- Staging: preferir migration corretiva.
- Rollback destrutivo exige nova confirmacao.

## READY_FOR_PHASE_3B

A Fase 3B pode iniciar quando:

- documentos da Fase 3A aprovados;
- nenhuma duvida bloqueadora aberta;
- escopo sem publicacao/agendamento confirmado;
- branch sera criada a partir de `main`;
- owner autorizar criacao de migrations locais.
