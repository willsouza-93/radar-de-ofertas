# Plano de Migrations da Fase 3

Status: ordem planejada. Nao gerar SQL nesta fase.

## Convencoes

- Criar arquivos com `npx supabase migration new <nome_logico>`.
- Nao inventar timestamps manualmente.
- Validar localmente com `npx supabase db reset` e `npx supabase test db`.
- Aplicar em staging somente apos merge na `main` e confirmacao operacional.

## Ordem planejada

| Ordem | Nome logico | Responsabilidade | Dependencias |
| --- | --- | --- | --- |
| 1 | `create_approval_domain_types` | Criar `approval_status` e `approval_decision_type` | Fase 2 |
| 2 | `create_approval_tables` | Criar `approval_queue`, `approval_decisions`, `review_notes` | Migration 1 |
| 3 | `create_approval_constraints_and_indexes` | FKs compostas, checks, indices e triggers | Migration 2 |
| 4 | `enable_approval_rls_and_policies` | Habilitar RLS e criar policies | Migrations 2 e 3 |
| 5 | `configure_approval_grants` | Grants minimos e bloqueio de anon/delete | Migration 4 |

## Dependencias de schema

- `public.workspaces`
- `public.profiles`
- `public.workspace_members`
- `public.offers`
- helpers `app_private.is_active_member` e `app_private.has_role`
- trigger helper `app_private.set_updated_at`

## Rollback

### Local

- Ajustar migrations antes do merge.
- Recriar banco local com `npx supabase db reset`.

### Staging

- Preferir migration corretiva para frente.
- Nao apagar fila/historico sem confirmacao explicita.
- Rollback destrutivo exigiria:
  1. backup;
  2. aprovacao do proprietario;
  3. registro operacional;
  4. execucao em janela controlada.

Ordem destrutiva teorica, se autorizada:

1. dropar grants/policies;
2. dropar `review_notes`;
3. dropar `approval_decisions`;
4. dropar `approval_queue`;
5. dropar enums.

## Validacoes por migration

- Objetos criados.
- RLS habilitado.
- `anon` sem grants.
- `authenticated` sem delete.
- FKs por workspace impedem associar oferta/fila/nota de workspaces diferentes.
- Decisao rejeitada exige motivo.
- Status terminal bloqueia novas mutacoes indevidas no servidor/testes.

## O que nao entra nas migrations

- `post_drafts`;
- `publications`;
- `publication_channels`;
- `redirect_links`;
- `click_events`;
- `job_runs`;
- Telegram;
- scheduler;
- storage.
