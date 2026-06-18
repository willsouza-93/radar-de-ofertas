# Guia de execucao da Fase 2B

Status: instrucoes para implementacao futura. Nao executar na Fase 2A.

## Precondicoes

- `main` local sincronizada com `origin/main`.
- Fase 1C encerrada com `READY_FOR_PHASE_2A`.
- Docker ativo.
- Supabase CLI funcional.
- GitHub Actions verde na `main`.
- Supabase remoto tratado oficialmente como staging.

## Ordem exata de implementacao

1. Criar branch:
   `feature/phase-2-offers-score`
2. Ler:
   - `PHASE_2_IMPLEMENTATION_PLAN.md`
   - `OFFER_DOMAIN_MODEL.md`
   - `SCORE_V1_STRATEGY.md`
   - `PHASE_2_RLS_STRATEGY.md`
   - `PHASE_2_API_CONTRACTS.md`
3. Criar migrations com `npx supabase migration new`.
4. Implementar tipos e tabelas.
5. Implementar constraints, indices e triggers.
6. Implementar RLS e grants.
7. Atualizar seed local/teste.
8. Criar testes SQL/RLS.
9. Criar modulo de score e normalizacao.
10. Criar testes unitarios de score/normalizacao.
11. Criar Server Actions/queries minimas.
12. Criar testes de captura/deduplicacao/snapshot.
13. Rodar validacoes locais.
14. Abrir PR.
15. Aguardar CI.
16. Apos merge, aplicar em staging somente com confirmacao.

## O que o Codex pode executar automaticamente

Localmente:

- Criar branch.
- Criar migrations via Supabase CLI.
- Editar arquivos versionados.
- Rodar `npx supabase db reset`.
- Rodar `npx supabase test db`.
- Rodar testes TypeScript quando existirem.
- Criar commit, push e PR quando solicitado.

## O que pode ser aplicado no Supabase staging

Somente apos merge na `main` e confirmacao operacional:

- Migrations da Fase 2.
- Validacoes de schema/RLS.

Nao aplicar automaticamente:

- Seeds de fixture.
- Dados com usuarios/senhas genericas.
- Operacoes destrutivas.

## O que exige acao manual

- Autorizar aplicacao das migrations em staging.
- Confirmar qualquer rollback destrutivo.
- Criar dados reais de validacao em staging, se necessario.
- Configurar secrets sensiveis se uma necessidade server-side real for aprovada.

## Estrategia de rollback

Local:

- Recriar banco com `npx supabase db reset`.
- Corrigir migration antes de merge.

Staging:

- Preferir migration corretiva para frente.
- Nao editar migration ja aplicada.
- Operacao destrutiva exige confirmacao explicita do proprietario.
- Registrar motivo, responsavel e resultado.

## Estrategia de validacao

Local:

```bash
npx supabase db reset
npx supabase test db
```

Quando houver app Next.js:

```bash
npm test
npm run lint
npm run typecheck
```

Se scripts ainda nao existirem, a Fase 2B deve cria-los ou documentar a
ausencia sem mascarar o gate.

Staging:

- Confirmar migrations aplicadas.
- Confirmar RLS habilitado.
- Confirmar `anon` sem grants.
- Criar uma oferta manual por usuario Admin nominal.
- Confirmar listagem/detalhe em Preview/Staging.
- Confirmar Editor le e nao captura.
- Confirmar suspenso/outro workspace bloqueados se houver dados de teste seguros.

## Estrategia de deploy

- PR CI usa Supabase local.
- Preview Vercel usa Supabase staging.
- Production da Vercel ainda nao representa producao real do produto.
- Migrations remotas nao devem rodar automaticamente em PR.
- Migrations remotas futuras devem ter workflow separado ou operacao manual.

## Criterios para READY_FOR_PHASE_2B

Antes de iniciar implementacao:

- Estes documentos revisados e aprovados.
- Nenhuma duvida bloqueadora aberta.
- Decisao mantida: sem Telegram, sem APIs externas e sem IA na Fase 2.
- Confirmação de que Fase 2B pode criar migrations locais e testes.

Ao fim da Fase 2B:

- Migrations versionadas criadas.
- Seed local/teste atualizado.
- Testes de score, captura, banco e RLS passando.
- PR aberto e CI verde.
- Supabase staging atualizado somente se autorizado.
- Changelog da Fase 2 criado.
