# Modelo de Dominio de Curadoria

Status: especificacao para migrations futuras da Fase 3B.

## Principios

- Todo registro pertence a um `workspace_id`.
- A fonte da oferta continua sendo `offers`.
- A Fase 3 nao altera dados de preco, score, tags ou captura.
- A aprovacao nao publica e nao agenda.
- Public Visitor nao possui acesso ao dominio de curadoria.
- Historico de decisoes deve ser append-only.

## Enums

### `approval_status`

Valores:

- `pending`: oferta aguardando analise humana.
- `under_review`: operador iniciou analise ou adicionou observacao.
- `approved`: oferta aprovada e pronta para agendamento futuro.
- `rejected`: oferta rejeitada e fora da fila ativa.

### `approval_decision_type`

Valores:

- `approved`
- `rejected`

## `approval_queue`

Finalidade: representar o estado atual de curadoria de uma oferta.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | uuid | PK, default gerado pelo banco |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `offer_id` | uuid | FK composta para `offers(workspace_id, id)`, not null |
| `status` | approval_status | not null, default `pending` |
| `priority_score` | smallint | copia do score no momento de entrada, 0..100 |
| `assigned_to` | uuid | FK `profiles(id)`, nullable |
| `last_decision_id` | uuid | FK `approval_decisions(id)`, nullable |
| `last_reviewed_by` | uuid | FK `profiles(id)`, nullable |
| `last_reviewed_at` | timestamptz | nullable |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Constraints:

- unique `(workspace_id, offer_id)`.
- unique `(workspace_id, id)` para FKs compostas.
- `priority_score between 0 and 100`.
- `last_reviewed_by` e `last_reviewed_at` devem aparecer juntos quando
  informados.

Indices:

- `(workspace_id, status, priority_score desc, created_at desc)`.
- `(workspace_id, offer_id)`.
- `(workspace_id, assigned_to, status)`.
- `(workspace_id, updated_at desc)`.

Regra de materializacao:

- A Fase 3B pode criar `approval_queue` para ofertas capturadas por seed,
  backfill local ou na primeira acao de curadoria.
- `listApprovalQueue` pode listar apenas registros materializados. Backfill de
  ofertas antigas em staging deve ser operacao controlada, sem seed fixture.

## `approval_decisions`

Finalidade: historico append-only de aprovacoes e rejeicoes.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `queue_id` | uuid | FK composta para `approval_queue(workspace_id, id)` |
| `offer_id` | uuid | FK composta para `offers(workspace_id, id)` |
| `decision` | approval_decision_type | not null |
| `previous_status` | approval_status | not null |
| `next_status` | approval_status | not null |
| `reason` | text | nullable para aprovacao, obrigatorio para rejeicao |
| `decided_by` | uuid | FK `profiles(id)`, not null |
| `decided_at` | timestamptz | not null |
| `created_at` | timestamptz | not null |

Constraints:

- `next_status` deve ser `approved` quando `decision = approved`.
- `next_status` deve ser `rejected` quando `decision = rejected`.
- `reason` obrigatorio para `decision = rejected`.
- `reason` maximo de 2000 caracteres.
- decisao deve pertencer ao mesmo workspace da fila e da oferta.

Indices:

- `(workspace_id, queue_id, decided_at desc)`.
- `(workspace_id, offer_id, decided_at desc)`.
- `(workspace_id, decision, decided_at desc)`.
- `(workspace_id, decided_by, decided_at desc)`.

## `review_notes`

Finalidade: observacoes internas de curadoria, visiveis apenas para Admin e
Editor do workspace.

| Coluna | Tipo | Regras |
| --- | --- | --- |
| `id` | uuid | PK |
| `workspace_id` | uuid | FK `workspaces(id)`, not null |
| `queue_id` | uuid | FK composta para `approval_queue(workspace_id, id)` |
| `offer_id` | uuid | FK composta para `offers(workspace_id, id)` |
| `body` | text | not null, 1..2000 apos trim |
| `created_by` | uuid | FK `profiles(id)`, not null |
| `updated_by` | uuid | FK `profiles(id)`, nullable |
| `created_at` | timestamptz | not null |
| `updated_at` | timestamptz | not null |

Constraints:

- nota deve pertencer ao mesmo workspace da fila e da oferta.
- `body` nao pode ser vazio apos trim.
- delete fisico negado.

Indices:

- `(workspace_id, queue_id, created_at desc)`.
- `(workspace_id, offer_id, created_at desc)`.
- `(workspace_id, created_by, created_at desc)`.

Regra de edicao:

- Admin e Editor podem adicionar notas.
- Edicao de nota existente e permitida apenas antes de status terminal
  `approved` ou `rejected`.
- Para preservar historico, alteracoes relevantes podem ser registradas como
  nova nota em vez de sobrescrever conteudo antigo, se a Fase 3B escolher o
  caminho mais simples.

## Relacionamentos

```text
workspaces 1--N approval_queue
offers 1--0..1 approval_queue
approval_queue 1--N approval_decisions
approval_queue 1--N review_notes
profiles 1--N approval_decisions.decided_by
profiles 1--N review_notes.created_by
profiles 1--N approval_queue.assigned_to
```

## Estados

Estados atuais da curadoria vivem em `approval_queue.status`.

`offers.status` permanece `captured` na Fase 3B, salvo decisao explicita futura
para expandir o enum de ofertas. Isso evita alterar semanticamente a Fase 2 e
mantem a aprovacao isolada.

## Regras de negocio

- Somente ofertas do mesmo workspace podem entrar na fila.
- Uma oferta possui no maximo uma linha atual em `approval_queue`.
- Decisoes sao append-only.
- Aprovar cria decisao `approved` e atualiza `approval_queue.status`.
- Rejeitar cria decisao `rejected`, exige motivo e atualiza
  `approval_queue.status`.
- Aprovacao nao cria post, publicacao, agendamento ou canal.
- Score e highlights sao lidos de `offers`; nao sao recalculados na Fase 3.
- Concorrencia deve ser tratada com `expectedStatus` no contrato.
