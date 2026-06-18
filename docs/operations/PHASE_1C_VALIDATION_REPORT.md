# Phase 1C Validation Report

Data: 2026-06-17

## Resultado executivo

| Area | Status | Observacao |
| --- | --- | --- |
| Local | Aprovado | Local e o ambiente dev |
| Supabase remoto | Aprovado | Projeto `rzakjytqfyjwdmnxhbxz` oficialmente classificado como staging |
| Vercel | Aprovado para Preview/Staging | Env vars publicas de runtime configuradas para apontar ao Supabase staging |
| GitHub | Aprovado | Workflow da Fase 1C rodou e passou apos merge na `main` |
| Secrets | Aprovado para o escopo atual | Nao ha GitHub Secrets nem service role necessarios neste momento |

## Validacao local

Comandos executados:

```bash
npx supabase start -x edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector
npx supabase db reset
npx supabase test db
```

Resultado:

```text
Files=1, Tests=31
Result: PASS
```

## Validacao Supabase remoto

Projeto:

- `rzakjytqfyjwdmnxhbxz`
- `https://rzakjytqfyjwdmnxhbxz.supabase.co`
- Ambiente oficial: `staging`

Validado:

- Projeto ativo e saudavel.
- Migrations da Fase 1 aplicadas.
- Historico remoto alinhado aos arquivos locais.
- RLS habilitado nas tabelas internas.
- `anon` sem grants diretos em tabelas internas.
- RBAC contem somente `admin` e `editor`.
- Nenhum seed remoto aplicado.

Decisoes registradas:

- Local = dev.
- Supabase remoto atual = staging.
- Production = futuro.
- Nao havera dois ambientes Supabase remotos neste momento.
- O Supabase staging deve ser usado apenas para validacao integrada/staging.
- Migrations remotas futuras devem ocorrer em workflow separado ou operacao manual controlada apos merge na `main`.
- Seeds de fixture com usuarios/senhas genericas nao devem ser aplicados em staging/producao.

## Validacao Vercel

Validado:

- Projeto `radar-de-ofertas` existe.
- Scope `willsouza-93s-projects` existe.
- Project ID observado: `prj_PntR6g6mec9uEbT8UIiZqutNj240`.
- Preview/Staging usa o Supabase staging.
- Env vars publicas de runtime configuradas na Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Variaveis runtime da aplicacao permanecem sem sufixo; o valor muda por ambiente dentro da Vercel.
- Vercel Production ainda nao representa producao real do produto.

Nao configurado por decisao:

- Vercel CLI local.
- `SUPABASE_SERVICE_ROLE_KEY`, pois ainda nao ha necessidade server-side real.

Motivo: CLI nao e requisito para iniciar a Fase 2A, e valores reais de secrets nao devem ser inferidos nem registrados.

## Validacao GitHub

Validado:

- Repositorio remoto existe.
- Default branch `main`.
- PR #1 observado como merged.
- PR #2 observado como merged na `main`.
- Workflow `Phase 1 Validation` rodou na `main` apos merge com status `success`.
- Run observado: `27655463039`.
- GitHub CLI autenticado no ambiente.

Criado:

- `.github/workflows/phase-1-validation.yml`

Bloqueio resolvido:

- Token OAuth do GitHub CLI foi atualizado com escopo `workflow`.
- Branch `feature/phase-1c-provisioning` foi publicado.
- PR #2 foi aberto e mergeado.

Decisoes registradas:

- PR CI continua usando Supabase local.
- CI de pull request nao deve usar Supabase remoto.
- GitHub Secrets nao sao necessarios para o workflow atual.

## Validacao de acesso obrigatoria

| Cenario | Resultado |
| --- | --- |
| anon/Public Visitor nao acessa tabelas internas | Validado por grants remotos: sem acesso direto |
| Admin acessa apenas seu workspace | Coberto por testes locais de RLS |
| Editor acessa apenas o permitido | Coberto por testes locais de RLS |
| Usuario suspenso perde acesso ao workspace | Coberto por testes locais de RLS |
| Admin de outro workspace nao acessa dados alheios | Coberto por testes locais de RLS |
| Usuario sem membership nao acessa dados internos | Coberto por testes locais de RLS |

## Pendencias operacionais

Pendencias encerradas:

- Natureza do Supabase remoto confirmada como staging.
- Env vars publicas de runtime configuradas na Vercel para Preview/Staging.
- Workflow da Fase 1C validado na `main`.
- GitHub CLI reautenticado com escopo `workflow`.
- PR #2 publicado e mergeado.

Pendencias adiadas, nao bloqueadoras:

- Production real do produto.
- Segundo ambiente Supabase remoto.
- `SUPABASE_SERVICE_ROLE_KEY`.
- GitHub Secrets para deploy/migracoes remotas.
- Workflow separado para migrations remotas futuras.
- Vercel CLI local.

## Gate

`READY_FOR_PHASE_2A`: Sim.

Motivo: a fundacao local, o Supabase staging, a Vercel Preview/Staging e o workflow de validacao estao suficientes para iniciar a Fase 2A sem depender de producao real ou secrets server-side.
