# Pipeline Observability

Status: baseline conceitual para observabilidade da captura futura. Nao
implementa ferramentas externas.

## Objetivo

Tornar a captura rastreavel, diagnosticavel e segura sem expor secrets ou dados
sensiveis.

## Principios

- Toda execucao possui `correlationId`.
- Cada conector possui observabilidade independente.
- Logs devem ser estruturados.
- Erros devem ter codigo estavel.
- Dados sensiveis devem ser mascarados.
- Metricas devem apoiar operacao, nao vanity.
- Auditoria humana continua separada de logs tecnicos.

## Logs esperados

Eventos minimos:

- `capture.started`
- `capture.connector.started`
- `capture.connector.completed`
- `capture.connector.failed`
- `capture.item.invalid`
- `capture.item.conflict`
- `capture.item.created`
- `capture.item.updated`
- `capture.item.unchanged`
- `capture.score.completed`
- `capture.persistence.failed`
- `capture.completed`

Campos comuns:

- `correlationId`
- `workspaceId`
- `connectorId`
- `connectorVersion`
- `captureRunId`
- `event`
- `status`
- `durationMs`
- `count`
- `errorCode`
- `safeMessage`

Em cenarios com multiplos conectores ativos no mesmo workspace, esses campos
devem permitir separar claramente a saude de Amazon, Mercado Livre, Shopee,
Magalu, AliExpress, importador manual ou qualquer outro conector futuro.

Nao registrar:

- tokens;
- headers completos;
- cookies;
- body bruto com segredo;
- service role key;
- URLs assinadas com credenciais.

## Metricas

### Execucao

- capturas iniciadas;
- capturas concluidas;
- capturas com falha;
- duracao por conector;
- itens recebidos por captura.
- conectores ativos por workspace.

### Itens

- criados;
- atualizados;
- inalterados;
- invalidos;
- conflitos;
- snapshots criados.

### Qualidade dos dados

- percentual sem preco anterior;
- percentual sem imagem;
- percentual sem affiliate URL;
- percentual sem external ID;
- media de score por conector.

### Confiabilidade

- timeout por conector;
- rate limit por conector;
- erro de persistencia;
- erro de score;
- retries realizados.
- falhas isoladas por conector.

Falha de um conector nao deve mascarar a saude dos demais. Dashboards e logs
futuros devem deixar claro quando uma origem falhou e outras continuaram
operando normalmente.

## Eventos

Eventos devem ser pensados para duas audiencias:

- operador tecnico: diagnosticar fonte, timeout e persistencia;
- curador: entender por que uma oferta apareceu ou foi marcada como incompleta.

Eventos tecnicos nao substituem `approval_decisions` nem `review_notes`.

## Auditoria

Auditoria humana:

- aprovar;
- rejeitar;
- adicionar nota.

Auditoria tecnica futura:

- iniciar captura manual;
- configurar conector;
- desabilitar conector;
- reprocessar captura.

Captura automatica nao deve registrar "decisao editorial".

## Tracing

Conceito recomendado:

```text
captureRun
  span connector.fetch
  span normalize.batch
  span validate.item
  span dedupe.item
  span score.item
  span persist.item
  span queue.materialize
```

Tracing externo fica para fase futura. Inicialmente, correlation IDs e logs
estruturados sao suficientes.

## Alertas

Alertas futuros devem cobrir:

- conector indisponivel;
- aumento de timeouts;
- rate limit recorrente;
- erro de normalizacao acima do esperado;
- erro de score;
- erro de persistencia;
- falha futura de publicacao.

Para MVP, painel/log operacional pode ser suficiente antes de ferramentas
externas.

## Como detectar falhas

### Marketplace indisponivel

Sinais:

- erro 5xx;
- DNS/connect timeout;
- falha de autenticacao em massa;
- zero itens quando havia cursor esperado.

Acao:

- classificar como externo;
- aplicar retry/backoff;
- marcar conector como warning se recorrente.

### Timeout

Sinais:

- deadline excedido;
- lote incompleto;
- conexao abortada.

Acao:

- reduzir lote;
- retry com backoff;
- preservar cursor anterior.

### Rate limit

Sinais:

- HTTP 429;
- header `Retry-After`;
- codigo especifico do provedor.

Acao:

- respeitar espera;
- nao loopar;
- registrar `retryAfter`.

### Erro de normalizacao

Sinais:

- URL invalida;
- preco invalido;
- titulo vazio;
- moeda nao suportada.

Acao:

- classificar item como invalido;
- continuar lote;
- incluir amostra sanitizada no log.

### Erro de score

Sinais:

- fator falhou;
- entrada inconsistente;
- resultado fora de range.

Acao:

- bloquear persistencia daquele item;
- logar erro estavel;
- manter captura de outros itens.

### Erro de persistencia

Sinais:

- unique conflict inesperado;
- FK violation;
- transacao abortada;
- RLS/grant inesperado.

Acao:

- falha do item ou da execucao conforme escopo;
- registrar detalhe tecnico seguro;
- nao tentar bypass com service role sem decisao explicita.

### Erro de publicacao futura

Sinais:

- canal negado;
- payload invalido;
- timeout;
- rate limit.

Acao:

- pertence ao pipeline futuro de publicacao;
- nunca deve ser tratado pela captura.
