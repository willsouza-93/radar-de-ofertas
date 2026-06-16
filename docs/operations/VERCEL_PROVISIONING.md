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

Interpretacao: a Fase 1 ainda nao contem aplicacao Next.js/UI. Portanto, o erro de deployment nao indica regressao de funcionalidade do produto, mas deve ser tratado antes de qualquer deploy aplicacional real.

## GitHub

O projeto Vercel possui deployment associado ao repositorio GitHub do projeto. A validacao foi feita por metadata de deployment.

## Variaveis esperadas

| Variavel | Ambiente | Publica | Uso |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Local, Preview, Production | Sim | URL publica do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local, Preview, Production | Sim | Cliente publico Supabase com RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Preview, Production | Nao | Acoes server-only estritamente controladas |

Valores reais nao devem ser versionados.

## Configuracao manual recomendada

Usando dashboard Vercel:

1. Abrir o projeto `radar-de-ofertas`.
2. Acessar Settings > Environment Variables.
3. Configurar as variaveis por ambiente.
4. Garantir que `SUPABASE_SERVICE_ROLE_KEY` exista apenas como server-only.
5. Validar acesso limitado aos secrets conforme politica do projeto.

Usando CLI:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
vercel env add SUPABASE_SERVICE_ROLE_KEY preview
```

## Pendencias

- Instalar e autenticar Vercel CLI, se o fluxo por CLI for desejado.
- Configurar variaveis reais no dashboard ou CLI.
- Confirmar ambiente de preview/staging.
- Resolver deployment `ERROR` quando houver aplicacao Next.js no repositorio.
