# PHASE_3A_REVIEW

Status: revisao tecnica curta antes do merge da Fase 3A.

Escopo: revisar exclusivamente `under_review`, `review_notes` e `assigned_to`
para reduzir retrabalho na Fase 3B. Este documento nao implementa codigo, nao
gera migrations e nao altera os artefatos existentes automaticamente.

## 1. Resumo executivo

`PHASE_3A_REVIEW_STATUS`: `APPROVED_WITH_ADJUSTMENTS`

A especificacao da Fase 3A esta aprovada para merge como base de arquitetura,
mas a Fase 3B deve incorporar tres simplificacoes obrigatorias antes de criar
migrations:

1. Remover `under_review` do MVP e usar apenas `pending`, `approved` e
   `rejected`.
2. Tornar `review_notes` append-only, sem `UPDATE`.
3. Remover `assigned_to` da Fase 3B.

Esses ajustes preservam o objetivo do MVP: permitir revisao humana, aprovacao,
rejeicao, justificativa e historico sem publicar, agendar ou criar automacao
editorial.

## 2. Revisao de `under_review`

### Analise

`under_review` melhora a visibilidade operacional quando existe uma fila grande,
varios operadores ou necessidade de indicar que alguem iniciou analise. No MVP,
o valor principal da Fase 3 e validar se Admin/Editor conseguem decidir uma
oferta com base em score, highlights e contexto.

Com um time pequeno e sem SLA, lock de revisao ou atribuicao formal, o estado
`under_review` cria uma etapa intermediaria que nao muda a decisao de negocio.
Ele tambem exige mais transicoes, mais validacoes, mais testes, mais estados de
UI e mais tratamento de concorrencia.

### Riscos

- Sem `under_review`, a fila nao mostra explicitamente que uma oferta foi aberta
  ou comentada por alguem.
- Operadores podem revisar a mesma oferta em paralelo.
- A visibilidade de "em analise" precisara esperar uma fase futura se o volume
  crescer.

Esses riscos sao aceitaveis no MVP porque a decisao final continua protegida
por `expectedStatus`, historico append-only e isolamento por workspace.

### Recomendacao

Remover `under_review` da Fase 3B.

Estados MVP:

- `pending`
- `approved`
- `rejected`

`pending` cobre ofertas aguardando analise e ofertas com notas ainda nao
decididas. Adicionar uma nota nao deve alterar status.

### Impacto em migrations

- Criar `approval_status` apenas com `pending`, `approved`, `rejected`.
- `approval_queue.status` deve ter default `pending`.
- Remover constraints, checks ou dados seed relacionados a `under_review`.

### Impacto em RLS

- Nenhuma policy especifica para `under_review`.
- Policies continuam filtrando por workspace e membership ativa.
- Validacao de transicao fica mais simples: apenas `pending -> approved` e
  `pending -> rejected`.

### Impacto em contratos

- `listApprovalQueue.status` aceita somente `pending`, `approved`, `rejected`.
- `getApprovalDetail.queue.status` retorna somente esses estados.
- `approveOffer.expectedStatus` deve aceitar apenas `pending`.
- `rejectOffer.expectedStatus` deve aceitar apenas `pending`.
- `addReviewNote` retorna a nota criada e mantem `queueStatus = pending`.

### Impacto em testes

- Remover cenarios `pending -> under_review`,
  `under_review -> approved` e `under_review -> rejected`.
- Adicionar teste explicito de que `addReviewNote` nao muda o status da fila.
- Manter testes de conflito quando `expectedStatus` diverge.

### Impacto em UI futura

- Fila inicial pode ter abas/filtros `Pendentes`, `Aprovadas` e `Rejeitadas`.
- Nao criar badge, coluna ou acao "Em revisao" na Fase 3B.
- Notas devem aparecer no detalhe/historico sem alterar o agrupamento da fila.

## 3. Revisao de `review_notes`

### Analise

Permitir edicao de notas melhora correcao de texto e pequenos ajustes de UX, mas
tambem reduz rastreabilidade e exige policies de `UPDATE`, campos
`updated_by`/`updated_at`, regras para status terminal e testes adicionais.

Para curadoria, a nota tem natureza de historico operacional. Se uma observacao
estiver errada ou incompleta, o operador pode adicionar uma nova nota
corrigindo o contexto. Isso preserva a sequencia de analise com menor risco.

### Riscos

- Operadores nao poderao corrigir uma nota existente diretamente.
- O historico pode ficar mais verboso quando houver correcao.
- A UI deve deixar claro que notas sao registros permanentes.

Esses riscos sao menores que o risco de sobrescrever justificativas relevantes
ou criar permissao de update complexa sem necessidade real.

### Recomendacao

`review_notes` deve ser append-only na Fase 3B.

Permitir:

- `SELECT`
- `INSERT`

Negar:

- `UPDATE`
- `DELETE`

Nao incluir `updated_by` nem regra de edicao no MVP. Se necessario, uma fase
futura pode adicionar edicao com trilha de auditoria explicita.

### Impacto em migrations

- Criar `review_notes` com `created_by` e `created_at`.
- Nao criar `updated_by`.
- `updated_at` nao e necessario para notas append-only.
- Nao criar trigger de `updated_at` para `review_notes`, salvo padrao tecnico
  obrigatorio decidido na Fase 3B.

### Impacto em RLS

- `authenticated` recebe grants somente de `SELECT` e `INSERT` em
  `review_notes`.
- Policies de `UPDATE` nao devem existir.
- `DELETE` continua sem grant e sem policy.

### Impacto em contratos

- Nao criar endpoint/action para editar nota.
- `addReviewNote` apenas cria nova nota.
- `listReviewHistory` deve exibir notas em ordem cronologica.
- Mensagens de UX devem orientar: "Para corrigir uma observacao, adicione uma
  nova nota."

### Impacto em testes

- Testar `INSERT` de nota por Admin/Editor ativos.
- Testar bloqueio explicito de `UPDATE` em `review_notes`.
- Testar bloqueio explicito de `DELETE` em `review_notes`.
- Testar que notas de outro workspace nao aparecem.

### Impacto em UI futura

- Exibir notas como timeline.
- Botao: "Adicionar observacao".
- Nao exibir acao "Editar nota" nem menu de exclusao.
- Correcoes devem ser feitas como nova observacao.

## 4. Revisao de `assigned_to`

### Analise

`assigned_to` agrega valor quando ha um time maior, ownership individual,
roteamento de fila, SLA ou filtros por responsavel. No MVP atual, Admin e Editor
tem a mesma permissao operacional de curadoria e nao ha fluxo de atribuicao,
claim, transferencia ou bloqueio pessimista.

Adicionar `assigned_to` agora cria decisoes colaterais: quem atribui, se o
proprio operador pode se atribuir, se outro operador pode editar uma fila
atribuida, como filtrar, como popular seed multi-workspace e como tratar usuarios
suspensos ou removidos.

### Riscos

- Sem `assigned_to`, nao havera responsavel formal por cada item.
- Filtros "minhas ofertas" ficam fora da Fase 3B.
- Em equipes maiores, pode haver duplicidade de revisao.

Esses riscos sao aceitaveis enquanto o produto valida o fluxo de curadoria com
baixo custo operacional.

### Recomendacao

Remover `assigned_to` da Fase 3B.

O ownership operacional deve ser inferido pelo historico:

- `review_notes.created_by`
- `approval_decisions.decided_by`
- `approval_queue.last_reviewed_by`

Se a operacao crescer, adicionar `assigned_to`, `assigned_at` e `assigned_by` em
fase futura com regras proprias.

### Impacto em migrations

- Nao criar coluna `approval_queue.assigned_to`.
- Nao criar FK para `profiles(id)` relacionada a atribuicao.
- Nao criar indice `(workspace_id, assigned_to, status)`.

### Impacto em RLS

- RLS fica apenas por workspace/role ativa.
- Nao ha regra por "responsavel".
- Suspensos continuam sem acesso.

### Impacto em contratos

- `listApprovalQueue` nao aceita filtro `assignedTo`.
- `getApprovalDetail` nao retorna assignee.
- Nao criar action de assign/unassign.

### Impacto em testes

- Nao criar seeds com responsaveis.
- Nao testar filtro "minhas ofertas".
- Manter testes de isolamento por workspace e de ator em decisoes/notas.

### Impacto em UI futura

- Nao mostrar avatar de responsavel na fila.
- Nao criar dropdown "Atribuir para".
- Historico mostra quem comentou e quem decidiu, suficiente para MVP.

## 5. Acoes recomendadas

### Obrigatorias antes da Fase 3B

- Atualizar a implementacao planejada para usar apenas `pending`, `approved` e
  `rejected`.
- Remover `under_review` de enums, contratos, seeds e testes antes de criar SQL.
- Implementar `review_notes` como append-only.
- Remover `updated_by`, update de nota e policies de `UPDATE` em
  `review_notes`.
- Remover `assigned_to`, seu indice e qualquer contrato de atribuicao.

### Recomendadas

- Manter `approval_decisions` como fonte append-only de decisoes finais.
- Manter `last_reviewed_by` e `last_reviewed_at` em `approval_queue` para
  resumo rapido da ultima decisao.
- Incluir teste de que `addReviewNote` nao altera status.
- Escrever mensagens de UI deixando claro que notas sao permanentes.

### Opcionais

- Manter `last_decision_id` para facilitar detalhe e auditoria leve.
- Adicionar contador de notas no detalhe/listagem apenas se nao aumentar
  complexidade das queries da Fase 3B.

### Futuro

- Reintroduzir `under_review` somente se houver necessidade clara de visibilidade
  operacional ou SLA.
- Adicionar `assigned_to`, `assigned_at` e `assigned_by` quando existir equipe
  maior ou processo de ownership.
- Criar edicao de notas apenas com auditoria explicita, se for uma demanda real.

## 6. Status final

`PHASE_3A_REVIEW_STATUS`: `APPROVED_WITH_ADJUSTMENTS`

`READY_TO_MERGE_PHASE_3A_PR`: `SIM`

`READY_FOR_PHASE_3B`: `SIM`

Nao ha bloqueador para mergear o PR da Fase 3A. Os ajustes acima devem ser
incorporados no inicio da Fase 3B, antes de gerar migrations, RLS, contratos
TypeScript, seeds ou testes.

## Ajustes para incorporar no inicio da Fase 3B

1. Criar `approval_status` com apenas `pending`, `approved`, `rejected`.
2. Fazer `addReviewNote` criar nota sem mudar status.
3. Criar `review_notes` sem update sem delete.
4. Nao criar `approval_queue.assigned_to`.
5. Atualizar a matriz de testes da Fase 3B para refletir as simplificacoes.
