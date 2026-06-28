# Domain Events Evolution

Status: evolucao arquitetural futura. Nao altera a arquitetura atual e nao
implementa Event Bus, mensageria, Kafka, RabbitMQ, NATS ou tecnologia similar.

## Objetivo

Registrar um caminho futuro para migrar gradualmente de chamadas diretas para
um modelo orientado a eventos, sem quebrar o sistema existente.

## Eventos candidatos

- `OfferCaptured`;
- `OfferSubmittedForReview`;
- `OfferApproved`;
- `OfferRejected`;
- `PublicationCandidateCreated`;
- `PublicationRequested`;
- `PublicationStarted`;
- `PublicationSucceeded`;
- `PublicationFailed`;
- `PublicationRetried`;
- `PublicationCancelled`.

## Beneficios

- menor acoplamento entre captura, curadoria e publicacao;
- melhor observabilidade;
- possibilidade de reprocessamento;
- isolamento de falhas por dominio;
- escalabilidade de workers futuros;
- integracao mais limpa com scheduler e publishers.

## Trade-offs

- mais complexidade operacional;
- necessidade de idempotencia rigorosa;
- risco de eventos duplicados ou fora de ordem;
- maior esforco de testes;
- eventual consistencia no lugar de fluxo totalmente sincrono.

## Estrategia incremental

1. Manter chamadas diretas no MVP.
2. Registrar logs/eventos conceituais em pontos de fronteira.
3. Padronizar payloads de eventos sem criar Event Bus.
4. Criar outbox somente quando houver necessidade real de async confiavel.
5. Migrar um dominio por vez.
6. Manter consumidores idempotentes.

## Payload conceitual

```text
DomainEvent
  eventId
  eventName
  aggregateType
  aggregateId
  workspaceId
  occurredAt
  correlationId
  causationId?
  payload
  schemaVersion
```

## Impacto na publicacao

No futuro, `OfferApproved` pode gerar `PublicationCandidateCreated`. Depois,
`PublicationRequested` pode criar jobs ou acionar worker.

Na Fase 6A isso e apenas desenho futuro. A Fase 6B nao deve implementar Event
Bus salvo decisao explicita posterior.
