# Workflow de Aprovacao

Status: especificacao para Fase 3B.

## Objetivo

Definir o ciclo de vida de curadoria sem publicar ou agendar ofertas.

## Estados

| Estado | Significado |
| --- | --- |
| `pending` | Oferta esta na fila e aguarda analise humana |
| `under_review` | Admin/Editor iniciou revisao ou adicionou observacao |
| `approved` | Oferta aprovada e pronta para agendamento futuro |
| `rejected` | Oferta rejeitada com justificativa |

Estado inicial recomendado: `pending`.

## Transicoes permitidas

| De | Para | Acao | Papeis |
| --- | --- | --- | --- |
| `pending` | `under_review` | abrir analise ou adicionar nota | Admin, Editor |
| `pending` | `approved` | aprovar oferta | Admin, Editor |
| `pending` | `rejected` | rejeitar oferta | Admin, Editor |
| `under_review` | `approved` | aprovar oferta | Admin, Editor |
| `under_review` | `rejected` | rejeitar oferta | Admin, Editor |
| `rejected` | `under_review` | reabrir analise futura, se aprovado na Fase 3B | Admin, Editor |

## Transicoes proibidas

| De | Para | Motivo |
| --- | --- | --- |
| `approved` | `pending` | Aprovado e terminal na Fase 3 |
| `approved` | `under_review` | Evita alterar decisao pronta para Fase 4 |
| `approved` | `rejected` | Exige fluxo futuro de cancelamento/revisao |
| `rejected` | `approved` direto | Deve reabrir analise antes, se permitido |
| qualquer | `scheduled` | Fase 3 nao agenda |
| qualquer | `published` | Fase 3 nao publica |

## Acoes

### Iniciar revisao

- Opcional no MVP.
- Pode ocorrer quando o operador abre detalhe ou adiciona a primeira nota.
- Nao cria decisao.

### Aprovar oferta

Precondicoes:

- membership ativa;
- papel `admin` ou `editor`;
- oferta pertence ao workspace;
- fila em `pending` ou `under_review`;
- `expectedStatus` confere com estado atual.

Efeitos:

- cria `approval_decisions` com `decision = approved`;
- atualiza `approval_queue.status = approved`;
- registra `last_reviewed_by`, `last_reviewed_at` e `last_decision_id`;
- nao cria post, publicacao, schedule, canal ou job.

### Rejeitar oferta

Precondicoes:

- mesmas de aprovacao;
- `reason` obrigatorio, 3..2000 caracteres.

Efeitos:

- cria `approval_decisions` com `decision = rejected`;
- atualiza `approval_queue.status = rejected`;
- registra responsavel/data;
- nao apaga oferta.

### Adicionar observacao

Precondicoes:

- fila em `pending` ou `under_review`;
- body 1..2000 caracteres;
- membership ativa Admin/Editor.

Efeitos:

- cria `review_notes`;
- pode mover `pending -> under_review`;
- nao altera decisao final.

## Concorrencia

Todas as mutacoes sensiveis devem receber `expectedStatus`.

Se o estado atual divergir:

- retornar `INVALID_TRANSITION` ou `VERSION_CONFLICT`;
- nao criar decisao parcial;
- orientar UI a recarregar o detalhe.

## Auditoria minima

A Fase 3 usa `approval_decisions` e `review_notes` como trilha de curadoria.
Uma tabela ampla de audit log permanece fora desta fase, salvo decisao futura.
