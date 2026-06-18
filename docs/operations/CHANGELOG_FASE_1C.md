# CHANGELOG Fase 1C

Status: encerrada e pronta para Fase 2A.

Data: 2026-06-17

## Escopo

Fase 1C executada exclusivamente para provisionamento, integracoes e CI/CD da fundacao criada na Fase 1.

Nao foram criadas funcionalidades de negocio, tabelas de ofertas, score, posts, publicacoes, canais, Telegram, UI ou integracoes externas.

## Implementado localmente

- Criado branch `feature/phase-1c-provisioning`.
- Criado workflow `.github/workflows/phase-1-validation.yml`.
- Validado Supabase local com `supabase db reset`.
- Validado suite de RLS local com `supabase test db`.
- Normalizado encoding UTF-8 sem BOM em arquivos versionados para permitir leitura correta do `supabase/config.toml` pelo Supabase CLI.
- Criada documentacao operacional em `docs/operations`.

## Aplicado no Supabase remoto

Projeto validado:

- Project Ref: `rzakjytqfyjwdmnxhbxz`
- Project URL: `https://rzakjytqfyjwdmnxhbxz.supabase.co`
- Ambiente oficial: `staging`
- Status observado: `ACTIVE_HEALTHY`

Migrations da Fase 1 aplicadas remotamente:

- `20260615170000_create_identity_types_and_private_schema`
- `20260615170100_create_identity_tables`
- `20260615170200_create_profile_provisioning`
- `20260615170300_create_identity_auth_helpers`
- `20260615170400_enable_identity_rls_and_policies`
- `20260615170500_configure_identity_grants`

Observacao operacional: as migrations foram aplicadas via conector Supabase. O historico remoto foi alinhado aos timestamps dos arquivos locais em `supabase_migrations.schema_migrations` para evitar drift em futuros comandos do Supabase CLI.

## Nao aplicado

- Seeds remotos nao foram aplicados, porque seeds de fixture com usuarios/senhas genericas nao devem ser aplicados em staging/producao.
- `SUPABASE_SERVICE_ROLE_KEY` nao foi configurada na Vercel porque ainda nao ha necessidade server-side real.
- GitHub Secrets nao foram configurados porque o workflow atual usa Supabase local.
- Vercel CLI nao foi instalado nem autenticado.
- Supabase CLI local nao foi autenticado/linkado por token.

## Validacoes executadas

- Schema remoto: tabelas internas esperadas existentes.
- RLS remoto: habilitado em `profiles`, `workspaces` e `workspace_members`.
- Enums remotos: `app_role` contem somente `admin` e `editor`; `member_status` contem `active`, `suspended` e `invited`.
- Grants remotos: `anon` sem acesso direto a tabelas internas; `authenticated` com grants minimos.
- Testes locais: 31 testes de banco/RLS aprovados.
- GitHub Actions: workflow `Phase 1 Validation` passou na `main` apos merge do PR #2.
- Vercel Preview/Staging: env vars publicas de runtime configuradas para usar Supabase staging.

## Pendencias

- Autenticar Supabase CLI e executar link local oficial.
- Instalar/autenticar Vercel CLI somente se o fluxo por CLI for desejado.
- Configurar `SUPABASE_SERVICE_ROLE_KEY` somente quando houver necessidade server-side real.
- Configurar GitHub Secrets somente se forem necessarios para deploy, migrations remotas ou automacoes futuras.
- Criar workflow separado para migrations remotas futuras ou manter operacao manual controlada apos merge na `main`.

## Gate

`READY_FOR_PHASE_2A`: Sim.
