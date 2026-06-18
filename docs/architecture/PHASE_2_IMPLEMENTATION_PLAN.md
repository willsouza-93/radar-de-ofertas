# Plano de implementacao da Fase 2

Status: especificacao executavel para Fase 2B.

## Objetivo

Validar o fluxo `Captura manual -> Curadoria -> Score` com o menor escopo
possivel, sem dependencias externas e sem alterar a fundacao de Auth,
Workspace, Membership e RLS criada na Fase 1.

## Escopo

Incluido na Fase 2:

- `categories`
- `tags`
- `offers`
- `offer_tags`
- `price_snapshots`
- captura manual de oferta
- normalizacao de dados
- deduplicacao por workspace e chave natural
- atualizacao de preco
- criacao de snapshots
- score deterministico MVP v1
- highlights derivados
- listagem/leitura de ofertas
- detalhe da oferta
- filtros basicos server-side
- seed local/teste
- testes de score, banco, RLS e captura
- documentacao de validacao

## Fora de escopo

Nao implementar na Fase 2:

- Telegram, WhatsApp, redes sociais ou qualquer publicacao.
- Aprovacao, agendamento, editor de post ou fila editorial.
- IA, OpenAI, Claude, ML ou geracao automatica de texto.
- APIs Mercado Livre/Shopee, scraping ou conectores externos.
- Analytics avancado, site publico, area do cliente ou notificacoes.
- Upload de imagens, Storage, Edge Functions ou jobs agendados.
- Cupons como entidade gerenciavel.
- Logs/audit de negocio alem do minimo estritamente necessario para validar
  captura manual, se a Fase 2B decidir incluir.

## Sequencia de implementacao

1. Confirmar branch da Fase 2B a partir de `main` atualizada.
2. Criar migrations locais com `npx supabase migration new`, sem inventar
   timestamps.
3. Criar tipos/enums minimos do dominio de ofertas.
4. Criar tabelas `categories`, `tags`, `offers`, `offer_tags` e
   `price_snapshots`.
5. Criar constraints, indices e triggers `updated_at`.
6. Implementar RLS e grants minimos para Admin, Editor, suspenso, outro
   workspace e `anon`.
7. Implementar seed local/teste idempotente para catalogo e ofertas.
8. Implementar score deterministico e normalizadores em TypeScript.
9. Implementar Server Actions/queries:
   - `captureOfferManual`
   - `listOffers`
   - `getOfferDetail`
   - `updateOfferManual`, se necessario para corrigir oferta capturada.
10. Implementar testes unitarios de score/normalizacao.
11. Implementar testes de banco/RLS.
12. Implementar testes de captura, deduplicacao e snapshots.
13. Rodar `npx supabase db reset` e `npx supabase test db`.
14. Rodar suite TypeScript quando existir app Next.js.
15. Abrir PR com checklist de validacao.
16. Aplicar em Supabase staging somente apos merge e confirmacao operacional.

## Dependencias

- Fase 1A/1B/1C concluidas e sincronizadas na `main`.
- Supabase local funcional via Docker.
- Supabase staging classificado oficialmente como staging.
- Vercel Preview/Staging apontando para Supabase staging.
- GitHub Actions da Fase 1C passando.
- Sem necessidade de `SUPABASE_SERVICE_ROLE_KEY` para a Fase 2A.

## Riscos

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| Score pouco util | Medio | Formula versionada, explicavel e facil de ajustar |
| URL maliciosa | Alto | Validar somente HTTP/HTTPS, tamanho, parse e normalizacao no servidor |
| Duplicidade por entrada manual inconsistente | Medio | Chave natural e fallback derivado de URL normalizada |
| RLS permissiva | Alto | Matriz por Admin, Editor, suspenso, outro workspace e anon |
| Snapshot duplicado | Medio | Unicidade por oferta/preco/observacao ou regra idempotente da action |
| Overengineering para fases futuras | Alto | Remover tudo que nao valida captura, curadoria e score |
| Dados ausentes distorcendo score | Medio | Fator ausente vale zero; nao reponderar silenciosamente |

## Criterios de aceite

- Admin cria oferta manual valida.
- Entrada duplicada atualiza a oferta existente.
- Mudanca de preco gera novo snapshot.
- Preco igual nao cria snapshot redundante.
- Score fica entre 0 e 100, com `score_version` e `score_factors`.
- Highlights derivam apenas de dados existentes e regras documentadas.
- Listagem filtra por marketplace, categoria, tag, score, desconto e data.
- Detalhe retorna oferta, tags, categoria, score explicado e snapshots.
- Editor le ofertas e detalhes, mas nao captura/edita manualmente.
- Usuario suspenso nao le nem escreve.
- Usuario de outro workspace nao acessa dados alheios.
- `anon`/Public Visitor nao acessa tabelas internas.
- CI de PR continua usando Supabase local.

## Gate da Fase 2A

`READY_FOR_IMPLEMENTATION`: Sim, desde que a Fase 2B respeite este documento e
nao inclua itens de aprovacao, publicacao, integracoes externas ou IA.
