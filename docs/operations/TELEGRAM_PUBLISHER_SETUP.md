# Telegram Publisher Setup

Status: runbook operacional da Fase 6C. Nao registrar valores reais neste
documento.

## Variaveis server-only

Configurar apenas em ambiente server-side:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_DEFAULT_CHAT_ID
TELEGRAM_PUBLISHING_ENABLED
APP_URL
```

Regras:

- nunca usar prefixo `NEXT_PUBLIC_`;
- nunca expor o token na UI, logs, commits, PRs ou docs;
- `TELEGRAM_DEFAULT_CHAT_ID` nao vem do cliente;
- `TELEGRAM_PUBLISHING_ENABLED=true` habilita envio real;
- qualquer outro valor desabilita o publisher.

## Pre-requisitos manuais no Telegram

1. Criar um bot via BotFather.
2. Obter o token do bot e salvar como secret server-side.
3. Adicionar o bot ao canal/grupo de teste ou destino operacional.
4. Garantir permissao de envio de mensagens.
5. Identificar o chat ID e salvar como secret server-side.
6. Configurar `APP_URL` com a origem publica do app.

## Fluxo implementado

```text
Admin confirma publicacao manual
  -> request_telegram_publication(offer_id)
  -> Candidate/Job/Redirect persistidos
  -> Template Renderer telegram-mvp-v1
  -> claim_telegram_publication_job(...)
  -> TelegramPublisher.sendMessage
  -> record_telegram_publication_result(...)
```

## Limitacoes do MVP

- Apenas um target Telegram fixo server-side.
- Apenas texto simples.
- Sem Markdown/HTML.
- Sem media, upload ou botoes inline.
- Sem retry automatico.
- Sem scheduler.
- Sem click analytics.
- Sem registry de publishers.

## Resultado ambiguo

Timeout, erro de rede ou resposta invalida apos chamada externa sao registrados
como resultado ambiguo. O job fica pausado e nao pode disparar retry automatico.

Como Telegram `sendMessage` nao fornece idempotencia nativa, nao alegar
garantia de exactly once contra Telegram.

## Smoke test posterior

Nao executar antes de:

1. merge;
2. configuracao manual das variaveis;
3. aplicacao controlada das migrations em staging;
4. confirmacao explicita do proprietario.

Procedimento sugerido apos esses gates:

1. Habilitar `TELEGRAM_PUBLISHING_ENABLED=true` em staging.
2. Usar canal/grupo de teste.
3. Aprovar uma oferta de teste.
4. Acionar publicacao manual como Admin.
5. Conferir mensagem recebida e redirect `/r/{shortCode}`.
6. Conferir job e attempt no historico interno.
7. Desabilitar o kill switch se houver qualquer comportamento inesperado.

## Rollback

Rollback logico:

- Definir `TELEGRAM_PUBLISHING_ENABLED=false`.
- Nao acionar novas publicacoes manuais.
- Manter historico append-only preservado.

Rollback tecnico:

- Reverter o PR antes de aplicar migrations remotas, se ainda estiver em review.
- Se migrations ja tiverem sido aplicadas em staging, criar migration reversa
  controlada somente com autorizacao explicita, preservando dados quando
  necessario.

## Riscos conhecidos

- Timeout apos envio pode ter entregado mensagem sem retornar `message_id`.
- Chat ID incorreto ou permissao removida gera falha permanente.
- Rate limit registra `retryAfter`, mas nao agenda retry nesta fase.
- O redirect publico resolve destino, mas click analytics fica fora do escopo.
