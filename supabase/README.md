# Supabase local - Fase 1

Este diretorio contem somente a fundacao aprovada de Auth, Workspace e RLS.

## Requisitos

- Docker Desktop em execucao.
- Supabase CLI instalada.

## Comandos

```powershell
supabase start -x edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector
supabase db reset
supabase test db
supabase status
supabase stop
```

O comando `start` acima sobe somente o Postgres local, que e o unico servico
necessario para validar a Fase 1. O `db reset` aplica as migrations em ordem e
executa `seed.sql`.

## Usuarios locais

Todos usam exclusivamente a senha de fixture `LocalPassword123!`.

| Papel/cenario | Email |
|---|---|
| Admin A | `willian.souza2007@hotmail.com` |
| Editor A | `souza.willian.93@outlook.com` |
| Suspenso A | `suspended@example.test` |
| Admin B | `admin-b@example.test` |
| Sem membership | `no-membership@example.test` |

Essa senha nao e segredo real e nao pode ser reutilizada em staging ou
producao.
