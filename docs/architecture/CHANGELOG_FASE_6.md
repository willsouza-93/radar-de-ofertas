# Changelog Fase 6

Status: Fase 6B implementada localmente para revisao. Sem migrations,
Supabase, staging, producao, publisher real, scheduler ou integracoes externas.

## Fase 6A - Arquitetura de Publicacao

- Definido o dominio conceitual de publicacao:
  `Approved Offer -> Publication Candidate -> Publication Policy -> Template Renderer -> Publication Job -> Publisher -> Publication Result`.
- Documentado que publicacao consome apenas ofertas aprovadas pelo ciclo
  editorial atual.
- Definido que a autorizacao de publicacao deve usar a decisao terminal atual:
  `approval_queue.last_decision_id = approval_decisions.id`.
- Definido que templates devem renderizar a partir de snapshot aprovado e
  imutavel, nao da linha mutavel de `offers`.
- Definido que mensagens publicaveis exigem `redirectLink` em `/r/{shortCode}`.
- Definido que resultados ambiguos nao entram em retry automatico.
- Definido que candidatos devem nascer antes da politica bloquear ou liberar,
  preservando motivo operacional.

## Fase 6B - Publication Domain Implementation

### Implementado

- Criado dominio puro em `src/server/publication`.
- Implementados contratos TypeScript reutilizaveis:
  - `PublicationCandidate`;
  - `PublicationJob`;
  - `PublicationTarget`;
  - `PublicationPolicy`;
  - `PolicyDecision`;
  - `PublicationTemplate`;
  - `TemplateRenderer`;
  - `PublicationContext`;
  - `RenderedMessage`;
  - `Publisher`;
  - `PublicationRequest`;
  - `PublicationResult`;
  - `PublicationFailure`;
  - `PublicationHistoryEntry`;
  - `RetryDecision`;
  - `PublicationEvent`.
- Implementadas funcoes puras de candidate:
  - criacao a partir de oferta aprovada;
  - bloqueio de oferta nao aprovada;
  - bloqueio de decisao de aprovacao stale;
  - elegibilidade;
  - bloqueio por politica;
  - enfileiramento conceitual;
  - cancelamento;
  - expiracao.
- Implementada policy engine pura para:
  - target habilitado;
  - publicacao manual habilitada;
  - cooldown;
  - limite conceitual por target;
  - duplicidade por idempotency key.
- Implementado template renderer seguro:
  - variaveis obrigatorias;
  - fallback controlado;
  - escape por formato;
  - limite minimo/maximo;
  - redirect link HTTP/HTTPS obrigatorio em `/r/{shortCode}`;
  - renderizacao a partir de snapshot aprovado.
- Implementada criacao de `PublicationJob` em memoria:
  - shell antes de renderizacao;
  - anexo posterior de `RenderedMessage`;
  - status operacional.
- Implementado contrato generico `Publisher`.
- Implementada estrategia pura de retry:
  - falha transitoria;
  - falha permanente;
  - `retryAfter`;
  - limite de tentativas;
  - resultado ambiguo sem retry automatico;
  - exigencia de idempotency key para retry.
- Implementados eventos estruturados em memoria:
  - `PublicationRequested`;
  - `PublicationStarted`;
  - `PublicationSucceeded`;
  - `PublicationFailed`;
  - `PublicationRetried`;
  - `PublicationCancelled`;
  - `PublicationSkipped`.
- Implementada hierarquia de erros seguros:
  - `PublicationError`;
  - `PolicyError`;
  - `TemplateError`;
  - `PublisherError`;
  - `RetryError`.
- Implementado pipeline conceitual em memoria:
  - aceita `Publisher` por contrato;
  - nao persiste dados;
  - nao chama APIs externas;
  - retorna resultado, retry decision e eventos estruturados.

### Testes

- Criada suite unitária `src/server/publication/publication.test.ts`.
- Cobertura adicionada para:
  - contratos e criacao de candidate;
  - oferta nao aprovada;
  - decisao editorial stale;
  - transicoes de candidate;
  - policy engine;
  - duplicidade por idempotency key;
  - renderer;
  - redirect link obrigatorio;
  - job shell;
  - publisher contract com fake publisher;
  - retry transitorio, permanente e ambiguo;
  - sanitizacao de metadata;
  - pipeline feliz;
  - target desabilitado;
  - template invalido;
  - falha transitoria;
  - resultado ambiguo.

### Fora de escopo mantido

- Telegram Bot API.
- WhatsApp.
- Threads.
- Discord.
- Publisher real.
- Scheduler.
- Event Bus.
- IA.
- APIs externas.
- HTTP client.
- Migrations.
- Tabelas.
- RPCs.
- Edge Functions.
- Service Role.
- Supabase.
- Banco de dados.
- Staging e producao.

## Decisoes tecnicas

- A Fase 6B usa organizacao modular direta em `src/server/publication/*.ts`
  em vez de subpastas profundas. A estrutura reduz overhead e continua coesa
  para o tamanho atual do dominio.
- `PublicationCandidate` nasce em estado `created`; a policy depois transforma
  o fluxo em `eligible`, `blocked` ou `skipped` via resultado estruturado.
- A idempotency key inclui `approvalDecisionId` e `snapshotVersion`, preservando
  republicacao legitima apos reentrada editorial.
- `PublicationJob` nasce como shell antes da renderizacao para refletir o fluxo
  futuro em que `redirectLink` sera associado ao job/publication shell.
- Domain Events separados foram marcados como nao aplicaveis nesta fase; os
  eventos de observabilidade conceituais ja cobrem os eventos internos exigidos
  sem criar Event Bus.

## Limitacoes conhecidas

- Nao ha persistencia de candidates, jobs, historico ou redirect links.
- Nao ha publisher real.
- Nao ha scheduler ou worker.
- Nao ha feature flags reais.
- Nao ha permissao/RBAC nesta camada porque o dominio e puro; validacao de
  ator ficara na camada de aplicacao futura.

## Review Fase 6B

- Endurecida validacao do template renderer para rejeitar:
  - template vazio;
  - variavel obrigatoria invalida;
  - placeholder desconhecido;
  - placeholder malformado.
- Endurecida policy de publicacao manual para respeitar targets que declaram
  `supportsManualPublication = false`.
- Endurecida estrategia de retry para repetir apenas falhas classificadas como
  `transient`; falhas retryable de outras categorias nao geram retry automatico.
- Pipeline passou a calcular `RetryDecision` tambem quando o publisher lanca
  excecao transitoria segura.
- Observabilidade passou a sanitizar metadata aninhada.
- Renderer passou a exigir que o texto final contenha o `redirectLink` aprovado.
- Renderer passou a validar origem permitida do redirect, alem do path
  `/r/{shortCode}`.
- Renderer passou a aplicar o menor limite entre template e target.
- Publisher contract passou a rejeitar formatos de mensagem nao suportados.
- Policy passou a bloquear publicacao automatica sem habilitacao explicita.
- Pipeline passou a retornar falha estruturada para oferta nao aprovada ou
  decisao editorial stale.
- Pipeline passou a preservar `retryAfter` top-level retornado pelo publisher.
- Pipeline passou a marcar falhas ambiguas lancadas pelo publisher como
  `ambiguous`/`paused`, exigindo reconciliacao manual.
- Pipeline passou a tratar todo resultado `ambiguous` como revisao manual,
  mesmo quando o payload inclui `failure` retryable.
- Pipeline passou a sintetizar falha transitoria para `transient_failure` sem
  payload `failure`, preservando `retryAfter` quando existir.
- Pipeline passou a ignorar payload `failure` inconsistente quando o status do
  publisher e `success`, evitando retry de mensagem ja registrada como sucesso.
- Candidate passou a permitir reavaliacao `blocked -> blocked`, preservando o
  estado bloqueado quando a mesma politica continua ativa.
- Sanitizacao de erros e observabilidade passou a lidar com referencias
  circulares sem quebrar a construcao de falhas seguras.
- Testes unitarios ampliados para cobrir edge cases encontrados no review.
