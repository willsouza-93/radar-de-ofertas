# Secret Management

## Principios

- Nenhum secret real deve ser registrado no repositorio.
- Nenhuma service role key deve ser exposta no frontend.
- Variaveis publicas podem existir no cliente, mas seus valores nao devem ser duplicados em documentacao operacional.
- O proprietario atual dos secrets do MVP e Willian Cesar.
- Antes de entrada em producao com usuarios reais ou ampliacao da equipe, definir segunda identidade independente para recuperacao de acesso.

## Inventario de variaveis

| Variavel | Ambiente | Onde configurar | Publica | Uso previsto | Acesso |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Local, Preview, Production | `.env.local`, Vercel | Sim | Cliente Supabase no app | Willian Cesar |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local, Preview, Production | `.env.local`, Vercel | Sim | Cliente Supabase com RLS | Willian Cesar |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview, Production | Vercel | Nao | Acoes server-only autorizadas | Willian Cesar |
| `SUPABASE_ACCESS_TOKEN` | Local, GitHub Actions futuro | Terminal local, GitHub Secrets | Nao | Operacoes CLI/CI autorizadas | Willian Cesar |
| `VERCEL_TOKEN` | GitHub Actions futuro | GitHub Secrets | Nao | Deploy via CI, se adotado | Willian Cesar |
| `VERCEL_ORG_ID` | GitHub Actions futuro | GitHub Secrets | Nao sensivel, mas privado | Deploy via CI, se adotado | Willian Cesar |
| `VERCEL_PROJECT_ID` | GitHub Actions futuro | GitHub Secrets | Nao sensivel, mas privado | Deploy via CI, se adotado | Willian Cesar |
| `CRON_SECRET` | Pos-MVP ou jobs futuros | Vercel, GitHub Secrets se necessario | Nao | Protecao de rotas de cron | Willian Cesar |
| `TELEGRAM_BOT_TOKEN` | Fase futura | Vercel | Nao | Publicacao Telegram | Willian Cesar |

## Local

Usar `.env.local`, nunca versionado.

Exemplo sem valores reais:

```bash
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
```

## Vercel

Configurar por ambiente:

- Preview.
- Production.
- Development, se o time decidir usar `vercel env pull`.

`SUPABASE_SERVICE_ROLE_KEY` deve ficar disponivel somente para runtime server-side.

## GitHub Actions

O workflow da Fase 1C nao exige secrets porque roda Supabase local.

Secrets GitHub devem ser criados apenas quando houver necessidade de:

- Deploy automatizado via GitHub Actions.
- Validacao remota via Supabase CLI.
- Rotinas que realmente precisem acessar recursos externos.

## Rotacao

Recomendacao MVP:

- Rotacao imediata em caso de exposicao.
- Rotacao antes de incluir novos colaboradores com acesso a ambientes.
- Revisao mensal manual enquanto o projeto estiver em fase inicial.

## Pendencias

- Configurar variaveis reais na Vercel.
- Criar `.env.local` local fora do controle de versao quando a aplicacao Next.js existir.
- Decidir se GitHub Actions tera deploy remoto ou permanecera apenas com validacao local.
