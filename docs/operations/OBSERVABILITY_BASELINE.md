# Observability Baseline

## Objetivo

Definir evidencias minimas para validar provisionamento, migrations, RLS e CI sem adicionar ferramentas externas na Fase 1C.

## Supabase

Evidencias minimas:

- Lista de migrations remotas.
- RLS habilitado nas tabelas internas.
- Policies esperadas presentes.
- Grants minimos confirmados.
- Contagem de dados de seed em ambiente remoto quando aplicavel.

Comandos locais:

```bash
npx supabase db reset
npx supabase test db
```

Validacoes remotas recomendadas:

- `supabase_migrations.schema_migrations` contem os mesmos versions dos arquivos locais.
- `pg_tables.rowsecurity = true` para tabelas internas.
- `information_schema.role_table_grants` sem acesso indevido para `anon`.

## Vercel

Evidencias minimas:

- Projeto existe e esta associado ao scope correto.
- Variaveis configuradas por ambiente.
- Deployments recentes revisados.
- Logs de deployment revisados quando houver aplicacao.

Erro esperado nesta fase:

- Deployment `ERROR` pode existir enquanto nao houver aplicacao Next.js real no repositorio. Isso deve ser resolvido antes de deploy aplicacional.

## GitHub Actions

Evidencias minimas:

- Workflow `phase-1-validation.yml` presente.
- Run executado em PR ou push.
- Etapas `supabase db reset` e `supabase test db` aprovadas.

## Logs minimos

Registrar em PRs e relatorios operacionais:

- Hash do commit validado.
- Branch validada.
- Resultado de testes locais.
- Resultado de workflow remoto.
- Decisoes de nao aplicar seeds ou secrets.

## Erros esperados

- CLI Supabase sem login em ambiente local.
- Vercel CLI ausente em maquina sem instalacao previa.
- Falha de deploy Vercel antes do scaffolding Next.js.
- Falha de workflow se Docker nao estiver disponivel ou se imagens do Supabase ficarem indisponiveis.

## Sem ferramentas externas

Nao foram adicionados Sentry, Datadog, Axiom, Logtail, OpenTelemetry ou outras ferramentas externas nesta fase.
