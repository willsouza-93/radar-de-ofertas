# Vercel Provisioning

## Projeto validado

- Projeto: `radar-de-ofertas`
- URL administrativa: `https://vercel.com/willsouza-93s-projects/radar-de-ofertas`
- Team/Scope: `willsouza-93s-projects`
- Team ID observado: `team_2PDqYxKnFCDLanunPCZRfk7R`
- Project ID observado: `prj_PntR6g6mec9uEbT8UIiZqutNj240`
- Node version observada no projeto: `24.x`

## CLI

O Vercel CLI nao foi encontrado no ambiente local.

Comandos manuais recomendados:

```bash
npm install -g vercel
vercel login
vercel link --yes --project radar-de-ofertas --scope willsouza-93s-projects
vercel env ls
```

## Deployments

Foi observado um deployment de producao com status `ERROR`.

Interpretacao: a Fase 1 ainda nao contem aplicacao Next.js/UI. Portanto, o erro historico de deployment nao indica regressao de funcionalidade do produto, mas deve ser tratado quando houver aplicacao real.

Decisao do proprietario: Vercel Production ainda nao representa producao real do produto.

## GitHub

O projeto Vercel possui deployment associado ao repositorio GitHub do projeto. A validacao foi feita por metadata de deployment.

## Variaveis esperadas

| Variavel | Ambiente | Publica | Uso |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Local, Preview/Staging | Sim | URL publica do Supabase staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local, Preview/Staging | Sim | Cliente publico Supabase com RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Futuro | Nao | Acoes server-only estritamente controladas, quando existirem |

Valores reais nao devem ser versionados.

As variaveis runtime da aplicacao nao usam sufixo. O valor muda por ambiente dentro da Vercel.

Variaveis de CI/CD, automacao, deploy ou acesso remoto podem usar sufixo do ambiente quando forem necessarias, por exemplo `SUPABASE_ACCESS_TOKEN_STAGING` e `SUPABASE_PROJECT_REF_STAGING`.

## Configuracao atual

Configurado pelo proprietario para Preview/Staging:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Nao configurado por decisao:

- `SUPABASE_SERVICE_ROLE_KEY`

Motivo: ainda nao existe necessidade server-side real.

## Pendencias

- Instalar e autenticar Vercel CLI, se o fluxo por CLI for desejado.
- Resolver deployment aplicacional quando houver aplicacao Next.js no repositorio.
- Configurar `SUPABASE_SERVICE_ROLE_KEY` somente quando houver necessidade server-side real.
