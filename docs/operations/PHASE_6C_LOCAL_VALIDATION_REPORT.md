# Phase 6C Local Validation Report

Status: validacao local da branch `feature/phase-6c-telegram-publisher`.

## Objetivo

Implementar publicacao manual, controlada, Admin-only e idempotente de ofertas
aprovadas para Telegram, mantendo Telegram como adapter de infraestrutura.

## Escopo entregue

- Migration `20260630013836_phase_6c_telegram_publication.sql`.
- RPCs de request, claim, record e redirect.
- Adapter `TelegramPublisher`.
- Template fixo `telegram-mvp-v1`.
- Rota publica `/r/{shortCode}`.
- UI minima no detalhe de oferta.
- Testes unitarios do adapter e schema de confirmacao.
- Teste pgTAP da Fase 6C.

## Validacoes executadas

| Comando | Resultado |
| --- | --- |
| `npm.cmd run typecheck` | Passou |
| `npm.cmd test` | Passou: 18 arquivos, 150 testes |
| `npm.cmd run build` | Passou |
| `npx.cmd supabase db reset` | Passou |
| `npx.cmd supabase test db` | Passou: 5 arquivos, 149 testes pgTAP |
| `npx.cmd supabase db advisors --local --type security --fail-on none` | Passou: No issues found |

## Observacao de ambiente local

A primeira tentativa de `npx.cmd supabase db reset` retornou:

```text
supabase start is not running.
```

Foram tentados:

- `npx.cmd supabase start`;
- `npx.cmd supabase start --debug`.

Ambos excederam timeout sem subir a stack completa. Dois processos
`supabase.exe` remanescentes foram encerrados manualmente.

Resolucao aplicada:

- `npx.cmd supabase db start --debug` iniciou apenas o Postgres local;
- `npx.cmd supabase db reset` passou;
- `npx.cmd supabase test db` passou;
- `npx.cmd supabase db advisors --local --type security --fail-on none`
  passou.

## Testes implementados

### TypeScript/Vitest

- sucesso de `sendMessage`;
- erro explicito da Bot API;
- rate limit com `retryAfter`;
- rede/timeout como resultado ambiguo;
- resposta invalida;
- configuracao ausente;
- texto acima do limite;
- ausencia de logs contendo token/header/body;
- confirmacao explicita obrigatoria na action schema.

### pgTAP

Arquivo: `supabase/tests/database/phase_6c_telegram_publication.test.sql`

Cobre:

- grants/RLS das novas tabelas;
- `anon` sem acesso a tabelas internas;
- RPC de request autenticada;
- request sem `workspaceId` ou `chatId`;
- Admin ativo publica oferta aprovada atual;
- duplicidade retorna job idempotente;
- claim bloqueia concorrencia;
- attempt append-only;
- sucesso nao pode ser sobrescrito;
- redirect ativo resolve e codigo invalido nao resolve;
- oferta rejeitada bloqueada;
- Editor, suspenso, outro workspace e anon bloqueados.

## Riscos

- Sem smoke real antes dos gates operacionais.
- Resultado ambiguo exige revisao manual; sem reconciliacao automatica nesta
  fase.

## Smoke test pendente

Pendente ate merge, configuracao manual de env, migrations controladas em
staging e confirmacao explicita do proprietario.

## Conclusao local

Codigo TypeScript, testes unitarios, build, migrations locais, pgTAP e advisors
passaram. A stack completa `supabase start` continuou lenta/instavel, mas o
Postgres local necessario para as validacoes obrigatorias foi iniciado com
`supabase db start`.
