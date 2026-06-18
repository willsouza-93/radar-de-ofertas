# Estrategia RLS da Fase 3

Status: especificacao para Fase 3B.

## Principios

- Usar helpers existentes em `app_private`.
- Todas as tabelas novas ficam em `public` com RLS habilitado.
- Toda policy filtra `workspace_id`.
- `anon` nao recebe grants.
- Usuario suspenso nao acessa nada da curadoria.
- Admin e Editor possuem as mesmas permissoes de curadoria na Fase 3.
- Nenhuma tabela da Fase 3 e publica.

## Helpers existentes

Usar:

- `app_private.is_active_member(workspace_id)`;
- `app_private.has_role(workspace_id, allowed_roles)`;
- `app_private.current_role(workspace_id)`;
- `app_private.assert_role(workspace_id, allowed_roles)` apenas server-side, se
  ja permitido.

Nao criar helper novo sem necessidade.

## Grants

`anon`:

- sem grants em `approval_queue`, `approval_decisions` e `review_notes`.

`authenticated`:

- `approval_queue`: `select`, `insert`, `update`.
- `approval_decisions`: `select`, `insert`.
- `review_notes`: `select`, `insert`, `update`.
- sem `delete` em todas as tabelas.

Os grants apenas expõem a superficie para RLS; autorizacao efetiva depende das
policies.

## Policies por tabela

### `approval_queue`

- `SELECT`: Admin e Editor ativos do workspace.
- `INSERT`: Admin e Editor ativos do workspace, com oferta do mesmo workspace.
- `UPDATE`: Admin e Editor ativos do workspace.
- `DELETE`: negado.

Observacao: transicoes validas devem ser reforcadas no servidor. Se a Fase 3B
optar por constraints/funcoes de transicao no banco, isso deve ser documentado
na migration plan antes de implementar.

### `approval_decisions`

- `SELECT`: Admin e Editor ativos do workspace.
- `INSERT`: Admin e Editor ativos do workspace.
- `UPDATE`: negado.
- `DELETE`: negado.

Decisoes sao append-only.

### `review_notes`

- `SELECT`: Admin e Editor ativos do workspace.
- `INSERT`: Admin e Editor ativos do workspace.
- `UPDATE`: Admin e Editor ativos do workspace, apenas para notas nao
  terminalizadas conforme regra de negocio.
- `DELETE`: negado.

## Comportamento esperado

### Admin

- Lista fila do proprio workspace.
- Abre detalhe.
- Aprova e rejeita.
- Adiciona/edita observacoes conforme regra da Fase 3.
- Consulta historico.
- Nao acessa outro workspace.

### Editor

- Mesmas permissoes de curadoria do Admin na Fase 3.
- Nao ganha permissoes administrativas de categorias, integracoes, usuarios ou
  canais por causa desta fase.

### Usuario suspenso

- Zero linhas em leituras.
- `INSERT/UPDATE` bloqueados por RLS.

### Outro workspace

- Nao ve fila, decisoes ou notas.
- IDs de outro workspace retornam `NOT_FOUND` ou resultado vazio no servidor.

### Anon/Public Visitor

- Sem grants.
- Sem acesso a tabelas de curadoria.

## Testes RLS obrigatorios

- RLS habilitado nas tres tabelas.
- `anon` sem grants.
- Admin A le/escreve apenas workspace A.
- Editor A le/escreve apenas workspace A.
- Suspenso A nao le nem escreve.
- Admin B nao ve fila de workspace A.
- Editor nao consegue inserir decisao para oferta de outro workspace.
- `approval_decisions` nao permite update/delete.
- `review_notes` nao permite delete.
- `approval_queue` nao permite delete.
