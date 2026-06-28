# Phase 6 Publication Architecture

Status: especificacao arquitetural da Fase 6A. Este documento nao implementa
codigo, migrations, tabelas, publishers reais, scheduler, Telegram, WhatsApp,
IA ou Event Bus.

## Objetivo

Projetar o dominio de publicacao para transformar ofertas aprovadas em
tentativas controladas de envio para canais, mantendo o core desacoplado de
Telegram, WhatsApp, redes sociais ou qualquer canal especifico.

Regra central:

```text
Captura nao publica.
Curadoria aprova.
Publicacao consome somente ofertas aprovadas.
```

## Fluxo geral

```text
Offer
  -> Approved
  -> Publication Candidate
  -> Publication Pipeline
  -> Publication Job
  -> Publisher
  -> Publication Result
  -> Publication History
```

## Responsabilidades por etapa

### Offer

Representa a oferta persistida e enriquecida pelas fases anteriores. Ela contem
dados de produto, preco, score, highlights e links.

Fora de responsabilidade:

- decidir publicacao;
- formatar mensagem;
- chamar canal externo.

### Approved

Estado editorial obtido pelo fluxo de curadoria. Para entrar em publicacao deve
existir evidencia consistente:

- `approval_queue.status = approved`;
- `approval_decisions.decision = approved`;
- offer, queue e decision pertencem ao mesmo workspace.

### Publication Candidate

Representa uma oportunidade de publicacao derivada de uma oferta aprovada.

Responsabilidades:

- referenciar a oferta aprovada;
- declarar canal/target desejado;
- carregar prioridade e contexto editorial;
- bloquear duplicidade antes de criar job.

### Publication Pipeline

Orquestra a preparacao da publicacao.

Responsabilidades:

- validar se a oferta ainda esta aprovada;
- aplicar `PublicationPolicy`;
- renderizar template;
- criar `PublicationJob`;
- registrar observabilidade;
- impedir envio direto sem job/idempotencia.

### Publication Job

Unidade executavel de publicacao.

Responsabilidades:

- carregar target, payload renderizado e idempotency key;
- controlar status operacional;
- registrar tentativas;
- isolar retry/failure handling;
- nunca alterar decisao editorial.

### Publisher

Contrato generico de envio. O dominio conhece apenas `Publisher`.

Exemplos futuros:

- `TelegramPublisher`;
- `WhatsAppPublisher`;
- `ThreadsPublisher`;
- `DiscordPublisher`;
- `FuturePublisher`.

### Publication Result

Resposta normalizada de uma tentativa de envio.

Responsabilidades:

- classificar sucesso, falha transitoria, falha permanente ou resultado
  ambiguo;
- guardar identificador externo quando existir;
- preservar mensagem segura para usuario/operacao.

### Publication History

Historico append-only das tentativas e resultados.

Responsabilidades:

- manter rastreabilidade;
- permitir auditoria;
- alimentar suporte e diagnostico;
- evitar apagar evidencia de falhas ou duplicidades.

## Fronteiras

```text
Curation Domain
  approved offer
    -> Publication Domain
        candidate -> policy -> template -> job
          -> Publisher Port
              channel adapter
```

O dominio de publicacao nao deve importar SDKs de canal. Adaptadores concretos
ficam em camada de infraestrutura.

## Workspace e seguranca

- `workspaceId` deve ser derivado server-side.
- `anon` nao acessa tabelas internas.
- Publicacao exige usuario interno autenticado e permissao definida pela fase
  de implementacao.
- Secrets de canal nunca ficam no frontend.
- Publisher nunca deve registrar tokens, headers sensiveis ou payloads com
  segredo.

## Feature flags

Feature flags poderao controlar operacao e rollout sem alterar o core:

- `telegram.enabled`;
- `whatsapp.enabled`;
- `threads.enabled`;
- `discord.enabled`;
- `manualPublishing.enabled`.

Na Fase 6A isso e apenas arquitetura. Nenhuma flag e implementada.

## Fora da Fase 6A

- Codigo TypeScript.
- SQL/migrations.
- Tabelas/RLS/RPCs.
- Telegram Bot API.
- WhatsApp.
- Scheduler.
- Event Bus.
- IA.
