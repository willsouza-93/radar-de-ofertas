# Secret Management

## Principios

- Nenhum secret real deve ser registrado no repositorio.
- Nenhuma service role key deve ser exposta no frontend.
- Variaveis publicas podem existir no cliente, mas seus valores nao devem ser duplicados em documentacao operacional.
- Variaveis runtime usadas pela aplicacao devem manter nomes sem sufixo; o valor muda por ambiente dentro da Vercel.
- Variaveis de CI/CD, automacao, deploy ou acesso remoto podem usar sufixo do ambiente quando forem necessarias.
- O proprietario atual dos secrets do MVP e Willian Cesar.
- Antes de entrada em producao com usuarios reais ou ampliacao da equipe, definir segunda identidade independente para recuperacao de acesso.

## Inventario de variaveis

| Variavel | Ambiente | Onde configurar | Publica | Uso previsto | Acesso |
| --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Local, Preview/Staging | `.env.local`, Vercel | Sim | Cliente Supabase no app | Willian Cesar |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local, Preview/Staging | `.env.local`, Vercel | Sim | Cliente Supabase com RLS | Willian Cesar |
| `SUPABASE_SERVICE_ROLE_KEY` | Futuro | Vercel | Nao | Acoes server-only autorizadas, quando existirem | Willian Cesar |
| `SUPABASE_ACCESS_TOKEN_STAGING` | Futuro | GitHub Secrets | Nao | Operacoes CLI/CI controladas no Supabase staging | Willian Cesar |
| `SUPABASE_PROJECT_REF_STAGING` | Futuro | GitHub Secrets ou variavel CI | Nao sensivel, mas operacional | Identificar projeto Supabase staging em automacoes | Willian Cesar |
| `VERCEL_TOKEN` | Futuro | GitHub Secrets | Nao | Deploy via CI, se adotado | Willian Cesar |
| `VERCEL_ORG_ID` | Futuro | GitHub Secrets | Nao sensivel, mas privado | Deploy via CI, se adotado | Willian Cesar |
| `VERCEL_PROJECT_ID` | Futuro | GitHub Secrets | Nao sensivel, mas privado | Deploy via CI, se adotado | Willian Cesar |
| `CRON_SECRET` | Pos-MVP ou jobs futuros | Vercel, GitHub Secrets se necessario | Nao | Protecao de rotas de cron | Willian Cesar |
| `TELEGRAM_BOT_TOKEN` | Fase 6C | Vercel/local server-side | Nao | Token do bot Telegram para `sendMessage` | Willian Cesar |
| `TELEGRAM_DEFAULT_CHAT_ID` | Fase 6C | Vercel/local server-side | Nao | Destino Telegram fixo do MVP | Willian Cesar |
| `TELEGRAM_PUBLISHING_ENABLED` | Fase 6C | Vercel/local server-side | Nao | Kill switch simples do publisher Telegram | Willian Cesar |
| `APP_URL` | Fase 6C | Vercel/local server-side | Nao sensivel | Origem publica usada no redirect `/r/{shortCode}` | Willian Cesar |

## Local

Usar `.env.local`, nunca versionado.

Exemplo sem valores reais:

```bash
NEXT_PUBLIC_SUPABASE_URL=<SUPABASE_PROJECT_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<SUPABASE_ANON_KEY>
```

## Vercel

Configurado para o escopo atual:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

As variaveis acima foram configuradas sem sufixo, seguindo o padrao runtime da aplicacao. O Preview/Staging da Vercel aponta para o Supabase staging.

`SUPABASE_SERVICE_ROLE_KEY` nao deve ser configurada enquanto nao houver necessidade server-side real.

## GitHub Actions

O workflow da Fase 1C nao exige secrets porque roda Supabase local.

GitHub Secrets nao sao necessarios neste momento.

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

- Criar `.env.local` local fora do controle de versao quando a aplicacao Next.js existir.
- Criar `SUPABASE_SERVICE_ROLE_KEY` somente quando houver necessidade server-side real.
- Criar GitHub Secrets apenas quando houver workflow separado para deploy ou migrations remotas.
