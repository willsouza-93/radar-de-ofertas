# Supabase Provisioning

## Projeto validado

- Nome: `radar-de-ofertas`
- Project Ref: `rzakjytqfyjwdmnxhbxz`
- Project URL: `https://rzakjytqfyjwdmnxhbxz.supabase.co`
- Regiao observada: `sa-east-1`
- Status observado: `ACTIVE_HEALTHY`

## Validacao de autenticacao

O conector Supabase estava autenticado e permitiu listar projetos, listar migrations e executar SQL de validacao.

O Supabase CLI local esta instalado via dependencia do projeto:

```bash
npx supabase --version
```

Resultado observado:

```text
2.106.0
```

O Supabase CLI nao esta autenticado no ambiente local. A tentativa de login automatico falhou por ambiente nao interativo.

Comando manual recomendado:

```bash
npx supabase login --token <SUPABASE_ACCESS_TOKEN>
npx supabase link --project-ref rzakjytqfyjwdmnxhbxz
```

Nunca registrar o token em arquivo versionado.

## Migrations remotas

Migrations aplicadas no projeto remoto:

| Version | Migration |
| --- | --- |
| `20260615170000` | `create_identity_types_and_private_schema` |
| `20260615170100` | `create_identity_tables` |
| `20260615170200` | `create_profile_provisioning` |
| `20260615170300` | `create_identity_auth_helpers` |
| `20260615170400` | `enable_identity_rls_and_policies` |
| `20260615170500` | `configure_identity_grants` |

As migrations foram aplicadas via conector Supabase. Depois da aplicacao, o historico remoto de migrations foi alinhado aos timestamps locais para evitar que o Supabase CLI tente reaplicar migrations ja executadas.

## Seeds

Seeds remotos nao foram aplicados.

Motivo: o projeto remoto ainda nao foi confirmado formalmente como staging/dev ou production. Para evitar criacao de usuarios ou dados de fixture em ambiente real, seeds ficam restritos ao ambiente local ate decisao operacional explicita.

## Schema remoto validado

Tabelas publicas internas presentes:

- `profiles`
- `workspaces`
- `workspace_members`

Nenhuma tabela de ofertas, score, posts, publicacoes, canais ou Telegram foi criada na Fase 1C.

## RLS remoto validado

RLS habilitado:

- `profiles`
- `workspaces`
- `workspace_members`

Policies observadas:

- `profiles_select_visible`
- `profiles_update_own`
- `workspace_members_select_admin_workspace`
- `workspace_members_select_own`
- `workspaces_select_active_member`

Validacoes de permissao:

- `anon` nao possui grants diretos de leitura ou escrita nas tabelas internas.
- `authenticated` possui grants minimos de leitura, com acesso efetivo controlado por RLS.
- `authenticated` pode atualizar apenas colunas permitidas de seu proprio profile via policy.
- Funcoes privadas estao no schema `app_private`.
- `authenticated` nao executa `app_private.assert_role`.

## Comandos usados

```bash
npx supabase start -x edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector
npx supabase db reset
npx supabase test db
```

## Comandos manuais recomendados

Depois de autenticar o CLI:

```bash
npx supabase link --project-ref rzakjytqfyjwdmnxhbxz
npx supabase migration list
npx supabase db diff --linked
```

Nao executar `supabase db push` sem revisar o diff.

## Pendencias

- Confirmar classificacao do ambiente remoto: staging/dev ou production.
- Autenticar e linkar Supabase CLI local.
- Definir se seeds serao aplicados em um ambiente remoto de staging.
