# PHASE_3B_STAGING_APPLICATION_REPORT

Status: aplicacao em Supabase Staging concluida.

Data: 2026-06-18

Projeto Supabase Staging:

- Project Ref: `rzakjytqfyjwdmnxhbxz`
- Ambiente: `staging`

## Escopo autorizado

Aplicar exclusivamente as 7 migrations da Fase 3B:

1. `20260618195210_create_curation_domain_types.sql`
2. `20260618195220_create_curation_tables.sql`
3. `20260618195230_create_curation_constraints_and_indexes.sql`
4. `20260618195240_enable_curation_rls_and_policies.sql`
5. `20260618195250_configure_curation_grants.sql`
6. `20260618212909_harden_curation_workflow_integrity.sql`
7. `20260618220504_harden_curation_relationship_integrity.sql`

Nao autorizado e nao executado:

- `supabase/seed.sql`;
- rollback;
- alteracoes fora da Fase 3B;
- Fase 4;
- alteracoes em Supabase Auth, Vercel ou GitHub.

## Pre-checks

### Branch e origem

Resultado:

- Branch local: `main`
- Tracking: `origin/main`
- `HEAD`: `0cf330ad62f393ca9b5d9505e0bc2dc7ecf1603e`
- `origin/main`: `0cf330ad62f393ca9b5d9505e0bc2dc7ecf1603e`
- Diff entre `HEAD` e `origin/main`: vazio

Conclusao: branch local sincronizada com `origin/main`.

### Projeto alvo

Arquivo local de link do Supabase:

```text
supabase/.temp/project-ref = rzakjytqfyjwdmnxhbxz
```

Conclusao: projeto alvo confirmado.

### Migrations pendentes antes da aplicacao

`npx.cmd supabase migration list` indicou exatamente 7 migrations locais
pendentes no remoto, todas da Fase 3B:

```text
20260618195210 | remote vazio
20260618195220 | remote vazio
20260618195230 | remote vazio
20260618195240 | remote vazio
20260618195250 | remote vazio
20260618212909 | remote vazio
20260618220504 | remote vazio
```

Conclusao: escopo pendente correspondia ao plano autorizado.

## Aplicacao

Comando executado:

```bash
npx.cmd supabase db push
```

Resultado:

```text
Finished supabase db push.
Applying migration 20260618195210_create_curation_domain_types.sql...
Applying migration 20260618195220_create_curation_tables.sql...
Applying migration 20260618195230_create_curation_constraints_and_indexes.sql...
Applying migration 20260618195240_enable_curation_rls_and_policies.sql...
Applying migration 20260618195250_configure_curation_grants.sql...
Applying migration 20260618212909_harden_curation_workflow_integrity.sql...
Applying migration 20260618220504_harden_curation_relationship_integrity.sql...
```

`supabase/seed.sql` nao foi executado.

## Pos-check de migrations

Comando executado:

```bash
npx.cmd supabase migration list
```

Resultado: as 7 migrations da Fase 3B passaram a constar em `Remote`:

```text
20260618195210 | 20260618195210
20260618195220 | 20260618195220
20260618195230 | 20260618195230
20260618195240 | 20260618195240
20260618195250 | 20260618195250
20260618212909 | 20260618212909
20260618220504 | 20260618220504
```

## Smoke tests estruturais

Os smoke tests foram executados via SQL remoto transacional usando:

```bash
npx.cmd supabase db query --linked --file %TEMP%\\phase3b_staging_smoke_assertions.sql
```

O script abriu `BEGIN`, criou fixtures temporarias de usuarios/workspaces/ofertas
e executou `ROLLBACK` ao final. Nenhum dado de fixture foi persistido em staging.

Observacao: a primeira versao do smoke test tentou inserir `profiles` apos o
trigger de provisionamento automatico criado por `auth.users`, gerando conflito
de chave primaria. O script foi corrigido com `ON CONFLICT` e reexecutado com
sucesso. Esse erro nao persistiu dados.

Resultado final:

```text
total_assertions: 21
passed_assertions: 21
failed_assertions: 0
```

### Assertions validadas

Estrutura:

- `approval_status enum`: PASS
- `approval_decision_type enum`: PASS
- `curation tables rls enabled`: PASS
- `apply_approval_decision exists`: PASS
- `insert pending trigger exists`: PASS

Grants/RLS:

- `anon cannot select queue`: PASS
- `authenticated can select queue`: PASS
- `authenticated cannot update queue`: PASS
- `authenticated cannot insert decisions directly`: PASS
- `authenticated can insert notes`: PASS
- `authenticated can execute apply function`: PASS

Workflow:

- `pending to approved`: PASS
- `pending to rejected`: PASS
- `decisions created`: PASS
- `notes append inserted`: PASS
- `failed rejection rolls back`: PASS

Bypass/auditoria:

- `direct queue update blocked`: PASS
- `direct decision insert blocked`: PASS

Permissoes:

- `editor sees own workspace queues`: PASS
- `suspended sees zero queues`: PASS
- `other workspace isolated`: PASS

## Resultado final

`PHASE_3B_STAGING_APPLICATION_STATUS`: `PASS`

`MIGRATIONS_APPLIED`: `SIM`

`SEED_APPLIED`: `NAO`

`ROLLBACK_EXECUTED`: `NAO`

`STAGING_SMOKE_TESTS`: `PASS`

`READY_FOR_STAGING_VALIDATION_REVIEW`: `SIM`

## Riscos residuais

- A aplicacao criou objetos novos de curadoria em staging; rollback destrutivo,
  caso um dia seja necessario, deve exigir nova autorizacao explicita.
- A funcao `public.apply_approval_decision` e `SECURITY DEFINER`; smoke tests
  validaram role, RLS, expected status e bloqueio de bypass, mas qualquer
  alteracao futura deve preservar essas garantias.
- Supabase CLI informou versao mais nova disponivel (`v2.107.0`); a versao
  instalada (`v2.106.0`) executou a aplicacao e validacao com sucesso.
