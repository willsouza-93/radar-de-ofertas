# Publication Retry Strategy

Status: especificacao arquitetural. Sem scheduler ou filas implementadas.

## Objetivo

Definir como tentativas de publicacao devem lidar com falhas, timeout e
duplicidade.

## Classificacao de erros

### Transitorios

Podem ser tentados novamente:

- timeout;
- rate limit;
- erro 5xx do provedor;
- rede instavel.

### Ambiguos

Nao devem virar retry automatico quando existe chance de o provedor ter aceito
o envio, mas a resposta se perdeu antes de salvar `externalMessageId`.

Exemplo:

- resposta ambigua sem external id apos chamada externa.

Resultado esperado:

- pausar job;
- registrar falha ambigua;
- tentar reconciliacao segura quando o canal permitir consulta;
- caso nao seja possivel confirmar, enviar para revisao manual de Admin.

### Permanentes

Nao devem ser repetidos automaticamente:

- credencial invalida;
- canal inexistente;
- permissao removida;
- mensagem invalida;
- payload excede limite;
- link invalido.

## Backoff

Estrategia recomendada:

```text
tentativa 1: imediata
tentativa 2: +1 minuto
tentativa 3: +5 minutos
tentativa 4: +15 minutos
tentativa 5: terminal
```

Rate limit com `retryAfter` do provedor deve prevalecer sobre backoff padrao.

## Idempotencia

Toda tentativa deve usar uma chave estavel:

```text
publication:<workspaceId>:<offerId>:<targetId>:<contentVersion>
```

Regras:

- nao reenviar cegamente quando houve timeout apos chamada externa;
- salvar `externalMessageId` assim que conhecido;
- tratar resposta duplicada como sucesso idempotente quando seguro;
- resposta ambigua sem confirmacao nao agenda backoff automatico;
- nunca criar duas mensagens para a mesma chave sem decisao humana.

## Resultado de retry

```text
RetryDecision
  retry
  retryAt?
  terminal
  reason
```

## Cancelamento

Jobs podem ser cancelados antes de nova tentativa se:

- oferta deixar de estar aprovada;
- target for desabilitado;
- operador cancelar manualmente;
- politica de duplicidade detectar publicacao equivalente.

## Fora da Fase 6A

- cron;
- fila;
- worker;
- tabela de jobs;
- publisher real.
