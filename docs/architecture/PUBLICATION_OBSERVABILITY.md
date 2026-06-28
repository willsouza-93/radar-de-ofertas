# Publication Observability

Status: especificacao arquitetural. Sem ferramenta externa implementada.

## Objetivo

Garantir rastreabilidade do fluxo de publicacao sem vazar secrets.

## Eventos

Eventos conceituais:

- `PublicationRequested`;
- `PublicationStarted`;
- `PublicationSucceeded`;
- `PublicationFailed`;
- `PublicationRetried`;
- `PublicationCancelled`;
- `PublicationSkipped`.

## Campos comuns

```text
eventName
workspaceId
offerId
publicationCandidateId?
publicationJobId?
publicationRunId
publisherId
targetId
correlationId
idempotencyKey
status
failureCode?
safeMessage?
createdAt
```

## CorrelationId

Conecta a publicacao a um fluxo maior:

- captura;
- curadoria;
- geracao de candidate;
- job;
- publisher.

Quando a publicacao for disparada manualmente, o servidor deve gerar um novo
`correlationId` se nenhum existir.

## PublicationRunId

Identifica uma execucao especifica do pipeline/publication worker.

Um mesmo `correlationId` pode conter varias tentativas; cada execucao deve ter
`publicationRunId` proprio.

## Structured Logs

Logs devem ser estruturados, seguros e de baixa cardinalidade.

Nao registrar:

- tokens;
- secrets;
- headers completos;
- payload bruto do provedor;
- dados pessoais desnecessarios.

## Evidencias minimas

- candidate criado/bloqueado;
- job criado;
- inicio da tentativa;
- resultado normalizado;
- retry agendado;
- falha terminal;
- usuario/ator quando manual.

## Metricas futuras

- publicacoes por canal;
- taxa de sucesso;
- falhas por codigo;
- retries por publisher;
- tempo ate sucesso;
- bloqueios por politica.
