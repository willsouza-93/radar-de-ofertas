# Publisher Architecture

Status: especificacao arquitetural. Nao implementa publishers reais.

## Objetivo

Definir o contrato generico que permite publicar em multiplos canais sem
alterar o core do dominio de publicacao.

O dominio conhece apenas:

```text
Publisher
```

Implementacoes futuras:

```text
TelegramPublisher implements Publisher
WhatsAppPublisher implements Publisher
ThreadsPublisher implements Publisher
DiscordPublisher implements Publisher
FuturePublisher implements Publisher
```

## Principios

- Publisher e um adapter de infraestrutura.
- Publisher nao decide se uma oferta pode ser publicada.
- Publisher nao renderiza template.
- Publisher nao calcula retry policy.
- Publisher nao acessa `offers`, `approval_queue` ou `approval_decisions`.
- Publisher recebe uma mensagem pronta e um target.
- Publisher retorna resultado normalizado.

## Contrato conceitual

```text
Publisher
  id
  version
  displayName
  capabilities
  limits
  publish(request): PublicationResult

PublicationRequest
  workspaceId
  publicationJobId
  idempotencyKey
  target
  message
  correlationId
  publicationRunId

PublicationTarget
  channel
  destinationId
  destinationLabel?
  options?

RenderedMessage
  format
  text
  media?
  buttons?
  metadata?

PublicationResult
  status
  externalMessageId?
  providerRequestId?
  failureCode?
  safeMessage?
  retryAfter?
  rawStatus?
```

## Capabilities

Um publisher deve declarar capacidades:

- texto simples;
- markdown/html restrito;
- imagem;
- botoes;
- preview de link;
- edicao de mensagem;
- delete/cancelamento;
- rate limit conhecido;
- idempotencia nativa ou simulada.

O pipeline nao deve assumir que todos os canais suportam todos os recursos.

## Limites por canal

Cada publisher deve expor limites operacionais:

- tamanho maximo de texto;
- quantidade maxima de midias;
- tipos de midia aceitos;
- limite de tentativas;
- timeout recomendado;
- comportamento sob rate limit;
- erros permanentes conhecidos.

## Telegram como publisher futuro

Telegram sera apenas uma implementacao concreta de `Publisher`.

O core nao deve conter:

- `botToken`;
- `chatId`;
- chamadas para Bot API;
- parse_mode especifico;
- regras de retry especificas do Telegram.

Esses detalhes ficam no adapter futuro.

## Testabilidade futura

Cada publisher deve permitir:

- teste de contrato com fake publisher;
- simulacao de sucesso;
- simulacao de rate limit;
- simulacao de falha permanente;
- validacao de idempotency key.
