# Changelog da Fase 1

## Status

Fundacao de Auth, Workspace e RLS implementada conforme os documentos
aprovados.

## Implementado

- setup local Supabase com signup publico e anonimo desabilitados;
- enums `app_role` e `member_status`;
- tabelas `profiles`, `workspaces` e `workspace_members`;
- constraints, indices e triggers de `updated_at`;
- protecao do ultimo Admin ativo;
- provisionamento automatico de profile ao criar usuario Auth;
- helpers privados de membership, role e visualizacao de profile;
- RLS e policies para Admin, Editor, suspenso e usuario sem membership;
- grants minimos sem acesso para `anon`;
- seed deterministico local/teste;
- testes pgTAP de grants, RLS, isolamento e provisionamento;
- estrategia de rollback e documentacao de execucao local.

## Migrations versionadas

1. `20260615170000_create_identity_types_and_private_schema.sql`
2. `20260615170100_create_identity_tables.sql`
3. `20260615170200_create_profile_provisioning.sql`
4. `20260615170300_create_identity_auth_helpers.sql`
5. `20260615170400_enable_identity_rls_and_policies.sql`
6. `20260615170500_configure_identity_grants.sql`

## Arquivos criados

- `.gitignore`
- `supabase/config.toml`
- `supabase/seed.sql`
- `supabase/README.md`
- `supabase/ROLLBACK.md`
- `supabase/migrations/20260615170000_create_identity_types_and_private_schema.sql`
- `supabase/migrations/20260615170100_create_identity_tables.sql`
- `supabase/migrations/20260615170200_create_profile_provisioning.sql`
- `supabase/migrations/20260615170300_create_identity_auth_helpers.sql`
- `supabase/migrations/20260615170400_enable_identity_rls_and_policies.sql`
- `supabase/migrations/20260615170500_configure_identity_grants.sql`
- `supabase/tests/database/phase_1_identity_rls.test.sql`
- `docs/architecture/LOCAL_SETUP_FASE_1.md`
- `docs/architecture/CHANGELOG_FASE_1.md`

## Arquivos modificados

Nenhum documento aprovado preexistente foi alterado.

## Comandos locais

```powershell
supabase start
supabase db reset
supabase test db
supabase status
supabase stop
```

## Validacoes cobertas pelos testes

- Public Visitor/`anon` nao possui grants em tabelas internas.
- Admin A acessa somente Workspace A e seus membros/perfis.
- Editor A acessa somente Workspace A, seu profile e sua membership.
- Suspenso A perde acesso ao workspace e ve somente sua membership suspensa.
- Admin B nao acessa dados do Workspace A.
- Usuario sem membership nao acessa workspace ou memberships.
- Metadata forjada nao concede role.
- Ultimo Admin ativo nao pode ser suspenso.
- Trigger Auth cria profile.

## Resultado da validacao nesta entrega

- Validacao estatica de escopo: aprovada.
- Busca por segredos reais e `service_role`: aprovada, nenhum achado.
- Cadeia de seis migrations e delimitadores SQL: aprovada estaticamente.
- Docker Desktop: disponivel.
- Supabase CLI local: `2.106.0`.
- `supabase start` somente com Postgres: aprovado.
- `supabase db reset`: aprovado.
- `supabase test db`: aprovado, 31 testes.
- `git diff --check`: aprovado.
- `supabase start` completo: nao usado para o gate da Fase 1; o container de
  Storage ficou `unhealthy` nesta maquina e Storage esta fora do escopo da Fase
  1.

## Itens deliberadamente nao implementados

- ofertas, scores, posts, publicacoes e canais;
- Telegram e qualquer integracao externa;
- redirects publicos e analytics;
- frontend, signup publico e gestao de usuarios no backoffice;
- qualquer item posterior a Fase 1.

## Riscos e pendencias

- `supabase start` completo ainda precisa ser revisado antes de fases que usem
  Storage/API/Studio; para a Fase 1, o start somente com Postgres e suficiente.
- Configuracoes remotas de Auth, callbacks, MFA e signup devem ser validadas
  manualmente em staging antes de producao.
- A segunda identidade independente de recuperacao continua obrigatoria antes
  de usuarios reais ou ampliacao da equipe.
