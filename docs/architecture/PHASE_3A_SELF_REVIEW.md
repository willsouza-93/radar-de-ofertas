# PHASE_3A_SELF_REVIEW

Status: revisao critica da especificacao da Fase 3A.

## Product Owner

### Avaliacao

A especificacao atende o objetivo de negocio: permitir que um operador humano
encontre uma oferta, revise score/highlights, aprove ou rejeite e consulte
historico.

### Riscos

- Produto ainda nao entrega agendamento/publicacao nesta fase.
- O usuario pode esperar "aprovar e agendar", mas a Fase 3 para em aprovado.

### Simplificacao recomendada

Manter CTA da UI como "Aprovar" nesta fase. "Aprovar e agendar" deve voltar
somente na Fase 4.

## Tech Lead

### Avaliacao

Separar `approval_queue` de `offers.status` reduz impacto na Fase 2 e evita
migration de enum de oferta neste momento.

### Riscos

- Duas fontes conceituais de estado podem confundir implementacao se UI misturar
`offers.status` com `approval_queue.status`.

### Mitigacao

Documentar que o estado editorial da Fase 3 vem de `approval_queue.status`.

## QA Lead

### Avaliacao

A matriz cobre RLS, transicoes, historico, isolamento e regressao de Fase 2.

### Riscos

- Se `listApprovalQueue` materializar registros de forma implicita, testes podem
ficar menos deterministas.

### Mitigacao

Preferir seeds locais com filas explicitas e helper transacional apenas em
mutacoes.

## Security Reviewer

### Avaliacao

`anon` segue sem acesso. Admin e Editor possuem permissao igual na curadoria,
conforme produto.

### Riscos

- Updates diretos em `approval_queue` poderiam burlar transicoes se o servidor
nao validar corretamente.
- `review_notes` podem conter dados sensiveis digitados por operador.

### Mitigacao

Server Actions devem validar transicoes e limitar tamanho de notas. UI deve
orientar a nao inserir segredos. Logs nao devem armazenar corpo completo de
notas.

## Overengineering encontrado

- Nao incluir audit log generico agora.
- Nao incluir assignment obrigatorio/SLA.
- Nao incluir lock pessimista de revisao.
- Nao incluir post draft.
- Nao incluir tabela de publicacao.

## Possiveis simplificacoes

1. Comecar sem `assigned_to` se a equipe for pequena.
2. Usar apenas `pending`, `approved`, `rejected` se `under_review` nao for
necessario na UI inicial.
3. Fazer `review_notes` append-only sem update, caso editar observacoes nao seja
critico na Fase 3B.

## Conclusao

`PHASE_3A_REVIEW_STATUS`: `APPROVED_WITH_NOTES`

`READY_FOR_PHASE_3A_REVIEW`: `SIM`
