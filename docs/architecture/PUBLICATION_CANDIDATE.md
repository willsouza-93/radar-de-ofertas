# Publication Candidate

Status: especificacao arquitetural. Nao cria schema.

## Definicao

`PublicationCandidate` representa uma oferta aprovada que pode ser considerada
para publicacao em um ou mais targets.

Ele nao e uma publicacao executada. E uma oportunidade editorial/operacional.

## Quando nasce

Um candidate nasce quando:

- existe oferta aprovada;
- existe decisao humana valida;
- existe ao menos um target/canal habilitado para o workspace.

A politica de publicacao nao deve impedir o nascimento do candidate. Ela deve
ser aplicada depois para marcar o candidate como `eligible` ou `blocked`.
Assim cooldown, limite por canal e horarios permitidos podem gerar estado
duravel com motivo e `blockedUntil`, em vez de descartar silenciosamente a
oportunidade.

Na implementacao futura, o nascimento pode ser:

- manual, por acao de Admin/Editor;
- automatico, depois de `OfferApproved`;
- reentrada editorial aprovada novamente.

## Quando deixa de existir

Um candidate deixa o estado ativo quando:

- vira `PublicationJob`;
- e cancelado;
- e pulado por politica;
- a oferta deixa de estar elegivel;
- o target/canal e desabilitado.

Historico nao deve ser apagado.

## Estados sugeridos

```text
eligible
blocked
queued
cancelled
expired
```

## Transicoes

```text
created -> eligible
created -> blocked
eligible -> queued
eligible -> blocked
eligible -> cancelled
eligible -> expired
blocked -> eligible
queued -> cancelled
```

Transicoes proibidas:

- candidate sem oferta aprovada;
- candidate direto para sucesso de publicacao;
- candidate que cria decision editorial;
- candidate que chama publisher sem job.

## Responsabilidades

- carregar contexto aprovado;
- aplicar dedupe antes de job;
- preservar prioridade;
- explicar por que esta bloqueado ou elegivel.

## Fora de responsabilidade

- renderizar mensagem;
- enviar para canal;
- registrar external message id;
- aplicar retry.
