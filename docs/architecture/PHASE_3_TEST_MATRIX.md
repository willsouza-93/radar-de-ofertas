# Matriz de Testes da Fase 3

Status: plano obrigatorio para Fase 3B.

## RLS

| Ator | Esperado |
| --- | --- |
| Admin A | Le e escreve curadoria apenas no Workspace A |
| Editor A | Le e escreve curadoria apenas no Workspace A |
| Suspenso A | Nao le nem escreve |
| Admin B | Nao acessa dados do Workspace A |
| anon | Sem grants e sem acesso |

Operacoes por tabela:

- `approval_queue`: select/insert/update permitido a Admin/Editor ativos; delete
  negado.
- `approval_decisions`: select/insert permitido; update/delete negado.
- `review_notes`: select/insert/update permitido conforme regra; delete negado.

## Fluxos

- listar fila pendente;
- abrir detalhe de aprovacao;
- adicionar nota;
- mover `pending -> under_review`;
- aprovar `pending`;
- aprovar `under_review`;
- rejeitar `pending`;
- rejeitar `under_review`;
- consultar historico combinado.

## Transicoes

| Cenario | Esperado |
| --- | --- |
| `pending -> approved` | Sucesso |
| `pending -> rejected` | Sucesso com motivo |
| `under_review -> approved` | Sucesso |
| `under_review -> rejected` | Sucesso com motivo |
| `approved -> rejected` | `INVALID_TRANSITION` |
| `approved -> under_review` | `INVALID_TRANSITION` |
| `rejected -> approved` direto | `INVALID_TRANSITION` |
| rejeitar sem motivo | `VALIDATION_ERROR` |
| `expectedStatus` divergente | `VERSION_CONFLICT` |

## Historico

- aprovar cria uma linha em `approval_decisions`;
- rejeitar cria uma linha em `approval_decisions`;
- notas aparecem em ordem cronologica;
- historico nao vaza dados de outro workspace;
- `approval_decisions` nao permite update/delete.

## Workspace isolation

- Admin A nao abre queue de Workspace B.
- Editor A nao adiciona nota em oferta de Workspace B.
- Admin B nao lista fila de Workspace A.
- FKs compostas impedem queue/decision/note cruzando workspaces.

## API/server actions

- cliente nao envia `workspaceId`;
- usuario sem membership recebe `FORBIDDEN`;
- usuario suspenso recebe `FORBIDDEN`;
- payload com campo extra e rejeitado por Zod estrito;
- IDs invisiveis retornam `NOT_FOUND`.

## Regressao de Fase 2

- score nao e recalculado por aprovar/rejeitar;
- snapshots nao sao alterados;
- tags/categorias nao sao alteradas;
- ofertas aprovadas continuam sem publicacao/agendamento.

## Gate

Fase 3B nao fica pronta sem:

- `npx supabase db reset` passando;
- `npx supabase test db` passando;
- testes TypeScript de contratos/transicoes passando;
- `git diff --check` limpo;
- evidencia de que nenhum objeto de publicacao/agendamento foi criado.
