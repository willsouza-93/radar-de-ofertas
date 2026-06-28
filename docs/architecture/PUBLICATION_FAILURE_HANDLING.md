# Publication Failure Handling

Status: especificacao arquitetural. Sem implementacao.

## Objetivo

Separar tipos de falha para permitir mensagens seguras, retry correto e suporte
operacional.

## Tipos de falha

### Erro do Publisher

Falha no adapter interno:

- configuracao ausente;
- payload interno invalido;
- contrato quebrado;
- timeout local.

### Erro do canal

Falha retornada pelo provedor:

- rate limit;
- canal inexistente;
- bot sem permissao;
- mensagem rejeitada;
- servico indisponivel.

### Erro do Template

Falha antes de chamar o publisher:

- variavel obrigatoria ausente;
- texto excede limite;
- formato incompativel com target;
- link invalido.

### Erro transitorio

Pode virar retry:

- timeout;
- 429;
- 5xx;
- erro de rede.

### Resultado ambiguo

Nao deve virar retry automatico quando ha chance de o canal ter aceitado o
envio, mas a resposta foi perdida antes de salvar `externalMessageId`.

Exemplo:

- resposta ambigua apos chamada externa.

Tratamento esperado:

- pausar o job;
- registrar falha ambigua;
- tentar reconciliacao segura se o canal permitir consulta;
- se nao for possivel confirmar, enviar para revisao manual de Admin;
- nunca reenviar automaticamente por backoff.

### Erro permanente

Nao deve virar retry automatico:

- credencial invalida;
- target desabilitado;
- oferta nao aprovada;
- template invalido;
- idempotency conflict irreconciliavel.

## Resultado de falha

```text
PublicationFailure
  category
  code
  safeMessage
  retryable
  retryAfter?
  providerRequestId?
```

## Mensagens seguras

Mensagens para UI/log operacional devem explicar a acao sem expor detalhes
sensiveis.

Exemplos:

- "Canal temporariamente indisponivel. Tentaremos novamente."
- "O bot nao possui permissao para enviar neste destino."
- "Template excede o limite do canal."

## Escalonamento

Falhas permanentes devem ficar visiveis para Admin. Falhas transitorias devem
registrar retry e so virar alerta humano apos limite de tentativas. Resultados
ambiguos ficam fora do retry automatico e entram em pausa/reconciliacao/revisao
manual.
