# CHANGELOG_FASE_3

Status: Fase 3B implementada localmente para revisao.

## Escopo implementado

- Dominio de curadoria sem publicacao e sem agendamento.
- Enum `approval_status` com apenas:
  - `pending`
  - `approved`
  - `rejected`
- Enum `approval_decision_type` com:
  - `approved`
  - `rejected`
- Tabelas:
  - `approval_queue`
  - `approval_decisions`
  - `review_notes`
- RLS e grants para Admin e Editor ativos.
- Bloqueio para `anon`, usuario suspenso, usuario sem membership e outro
  workspace.
- `review_notes` append-only, sem update/delete.
- Hardening de integridade do workflow: Admin/Editor nao podem alterar
  `approval_queue.status` nem inserir `approval_decisions` diretamente via
  SQL/PostgREST/Supabase Client.
- Funcao oficial `public.apply_approval_decision` para aplicar aprovacao ou
  rejeicao atomicamente com `expectedStatus`.
- Hardening relacional final:
  - toda nova linha em `approval_queue` deve nascer `pending`;
  - `approval_decisions` nao pode apontar queue A e offer B;
  - `review_notes` nao pode apontar queue A e offer B;
  - `approval_queue.last_decision_id` nao pode apontar decisao de outra queue.
- Services TypeScript equivalentes aos contratos da Fase 3:
  - `listApprovalQueue`
  - `getApprovalDetail`
  - `approveOffer`
  - `rejectOffer`
  - `addReviewNote`
  - `listReviewHistory`

## Decisoes aplicadas do PHASE_3A_REVIEW

- `under_review` nao foi criado.
- `assigned_to` nao foi criado.
- `assign/unassign` nao foi criado.
- Edicao e exclusao de notas nao foram criadas.
- `addReviewNote` nao altera status da fila.

## Migrations criadas

- `20260618195210_create_curation_domain_types.sql`
- `20260618195220_create_curation_tables.sql`
- `20260618195230_create_curation_constraints_and_indexes.sql`
- `20260618195240_enable_curation_rls_and_policies.sql`
- `20260618195250_configure_curation_grants.sql`
- `20260618212909_harden_curation_workflow_integrity.sql`
- `20260618220504_harden_curation_relationship_integrity.sql`

## Banco de dados

### Objetos criados

- `public.approval_status`
- `public.approval_decision_type`
- `public.approval_queue`
- `public.approval_decisions`
- `public.review_notes`
- Indices por workspace, status, fila, oferta, decisao e ator.
- Trigger `approval_queue_set_updated_at`.

### RLS

- `approval_queue`: `SELECT`, `INSERT`, `UPDATE` para Admin/Editor ativos.
- `approval_decisions`: `SELECT`, `INSERT` para Admin/Editor ativos.
- `review_notes`: `SELECT`, `INSERT` para Admin/Editor ativos.
- `approval_queue`: sem `INSERT`, `UPDATE` ou `DELETE` para clientes
  autenticados.
- `approval_decisions`: sem `INSERT`, `UPDATE` ou `DELETE` para clientes
  autenticados.
- `public.apply_approval_decision`: `EXECUTE` para `authenticated`; a funcao
  valida membership ativa, role, `expectedStatus`, motivo de rejeicao e aplica
  decision/status/nota opcional na mesma transacao.
- Nenhum grant para `anon`.
- Nenhum `DELETE` exposto.
- Nenhum `UPDATE` exposto para `approval_decisions` ou `review_notes`.

## Seeds

`supabase/seed.sql` recebeu fixtures locais deterministicas:

- fila pendente;
- fila aprovada;
- fila rejeitada;
- workspace B para isolamento;
- notas e decisoes de historico.

Esses dados sao apenas local/teste e nao devem ser aplicados em staging.

## Testes implementados

### Banco

Arquivo:

- `supabase/tests/database/phase_3_curation_rls.test.sql`

Cobertura:

- enums sem `under_review`;
- RLS habilitado;
- grants de `anon` e `authenticated`;
- Admin A;
- Editor A;
- usuario suspenso;
- usuario sem membership;
- Admin de outro workspace;
- workspace isolation;
- `pending -> approved`;
- `pending -> rejected`;
- notas append-only;
- decisoes append-only;
- bloqueio de update direto em `approval_queue.status`;
- bloqueio de insert direto em `approval_decisions`;
- aprovacao/rejeicao pelo caminho oficial atomico;
- inserts de queue obrigatoriamente `pending`;
- bloqueio de relacionamento cruzado queue/offer em decisoes e notas;
- bloqueio de `last_decision_id` apontando decisao de outra queue;
- `decided_by` e `created_by` validados contra `auth.uid()` nos fluxos de
  cliente;
- historico cronologico.

### TypeScript

Arquivos:

- `src/server/curation/schemas.ts`
- `src/server/curation/service.ts`
- `src/server/curation/service.test.ts`
- `src/server/curation/types.ts`

Cobertura:

- workspace derivado server-side;
- rejeicao de `workspaceId` injetado;
- listagem;
- detalhe;
- aprovacao;
- rejeicao;
- approve twice;
- reject twice;
- expected status conflict;
- notas append-only;
- historico;
- bloqueios de suspenso, sem membership e outro workspace.

## Validacoes locais executadas

- `npx.cmd supabase db reset`
- `npx.cmd supabase test db`
- `npm.cmd run typecheck`
- `npm.cmd test`

`git diff --check` deve permanecer obrigatorio antes do commit final.

## Fora de escopo mantido

Nao foi implementado:

- Telegram;
- WhatsApp;
- publicacao;
- agendamento;
- scheduler;
- IA;
- OpenAI/Claude;
- marketplace APIs;
- scraping;
- analytics;
- area publica;
- redirect publico.

## Riscos e limitacoes

- Services TypeScript usam interface de repository, seguindo o padrao da Fase 2.
  A adaptacao para Supabase client/Server Actions reais deve usar
  `public.apply_approval_decision` ou uma transacao equivalente server-side.
- As mutacoes de aprovacao/rejeicao foram protegidas contra bypass direto no
  banco; qualquer adapter futuro deve preservar a atomicidade.
- Staging nao foi alterado nesta fase.

## Rollback

### Local antes de merge

- Ajustar ou remover as migrations novas.
- Executar `npx.cmd supabase db reset`.

### Staging apos merge

- Nao aplicar rollback destrutivo sem confirmacao explicita.
- Preferir migration corretiva.
- Se for necessario remover objetos de curadoria em staging, exigir plano
  aprovado pelo proprietario.
