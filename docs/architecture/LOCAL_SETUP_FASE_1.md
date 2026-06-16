# Execucao local da Fase 1

## Escopo

O setup local aplica exclusivamente Auth, profiles, workspaces,
workspace_members, helpers privados, RLS, grants e testes da Fase 1.

## Pre-requisitos

- Docker Desktop instalado e em execucao.
- Supabase CLI instalada.
- Portas locais `54320` a `54324` e `54321` disponiveis.

## Iniciar e recriar o ambiente

Na raiz do repositorio:

```powershell
supabase start -x edge-runtime,gotrue,imgproxy,kong,logflare,mailpit,postgres-meta,postgrest,realtime,storage-api,studio,supavisor,vector
supabase db reset
supabase status
```

`supabase db reset`:

1. recria o banco local;
2. aplica as seis migrations versionadas;
3. executa `supabase/seed.sql`;
4. cria somente fixtures locais/teste.

O comando de start acima sobe apenas o banco, porque a Fase 1 nao depende de
Storage, API, Auth HTTP, Studio, Analytics ou Edge Runtime para validar schema,
seed e RLS.

## Executar testes

```powershell
supabase test db
```

Teste especifico:

```powershell
supabase test db supabase/tests/database/phase_1_identity_rls.test.sql
```

## Parar o ambiente

```powershell
supabase stop
```

## Contas locais

As contas e a senha exclusivamente local estao documentadas em
`supabase/README.md`. Nenhuma credencial local pode ser reutilizada fora do
ambiente local.

## Configuracao remota obrigatoria

Antes de aplicar em staging ou producao:

- manter signup publico e signup anonimo desabilitados;
- configurar somente callbacks aprovados;
- provisionar Admin por procedimento controlado;
- nao executar `supabase/seed.sql`;
- validar MFA do Admin;
- confirmar grants, RLS e isolamento com smoke tests.

## Checklist de validacao manual

- [ ] `supabase db reset` termina sem erro.
- [ ] `supabase test db` termina sem falhas.
- [ ] Existem somente os enums `app_role` e `member_status` da Fase 1.
- [ ] Existem somente `profiles`, `workspaces` e `workspace_members` como
      tabelas publicas criadas pela Fase 1.
- [ ] Signup publico e anonimo estao desabilitados.
- [ ] Public Visitor/`anon` nao possui grants nas tabelas internas.
- [ ] Admin A ve somente Workspace A.
- [ ] Editor A ve somente seu workspace, profile e membership permitidos.
- [ ] Usuario suspenso ve somente o proprio profile e membership suspensa.
- [ ] Admin B nao ve dados do Workspace A.
- [ ] Usuario sem membership nao ve dados de workspace.
- [ ] Nenhuma chave privilegiada aparece no repositorio ou cliente.

## Rollback

Consultar `supabase/ROLLBACK.md`. Local/teste deve ser recriado com
`supabase db reset`; ambientes compartilhados usam migration corretiva para
frente por padrao.
