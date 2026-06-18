# Plano de Implementacao da Fase 3

Status: especificacao executavel para Fase 3B. Nao implementar codigo nesta
fase.

## Objetivo

Validar o fluxo `Oferta capturada -> Fila de Curadoria -> Analise humana ->
Aprovacao/Rejeicao -> Oferta aprovada para agendamento futuro`.

A Fase 3 nao publica, nao agenda execucao e nao gera texto editorial. Ela apenas
registra a decisao humana sobre uma oferta ja capturada e pontuada na Fase 2.

## Escopo

Incluido na Fase 3:

- fila de curadoria;
- aprovacao humana;
- rejeicao humana;
- observacoes internas;
- historico de decisoes;
- isolamento por workspace;
- RLS para Admin, Editor, suspenso, outro workspace e anon;
- contratos server-side para listar fila, abrir detalhe, aprovar, rejeitar,
  adicionar observacao e consultar historico;
- seeds locais/teste;
- testes de RLS, transicoes, historico e isolamento.

## Fora de escopo

Nao implementar na Fase 3:

- Telegram, WhatsApp ou redes sociais;
- publicacao;
- agendamento real;
- scheduler;
- IA, OpenAI, Claude ou geracao automatica de texto;
- Mercado Livre API, Shopee API ou scraping;
- analytics, area publica, redirect publico;
- cupons avancados;
- upload de arquivos ou Storage;
- posts, drafts editoriais ou templates de mensagem.

## Dependencias

- Fase 1 aplicada: Auth, Workspace, Membership e helpers RLS em
  `app_private`.
- Fase 2 aplicada: `offers`, `categories`, `tags`, `price_snapshots`, score e
  highlights.
- Supabase staging operacional e historico de migrations reconciliado.
- GitHub Actions validando banco local.
- Nenhuma necessidade de `SUPABASE_SERVICE_ROLE_KEY` para UI ou Server Actions
  da Fase 3.

## Sequencia de implementacao futura

1. Criar branch da Fase 3B a partir de `main`.
2. Criar migrations com `npx supabase migration new`, sem timestamps manuais.
3. Criar enum `approval_status`.
4. Criar enum `approval_decision_type`.
5. Criar tabelas `approval_queue`, `approval_decisions` e `review_notes`.
6. Criar constraints, FKs compostas por `workspace_id`, indices e triggers
   `updated_at`.
7. Habilitar RLS e grants minimos.
8. Atualizar seeds locais/teste para cenarios pendente, em revisao, aprovado e
   rejeitado.
9. Criar testes pgTAP de RLS e transicoes.
10. Implementar modulo server-side de curadoria com Zod e workspace derivado da
    membership ativa.
11. Implementar contratos:
    - `listApprovalQueue`;
    - `getApprovalDetail`;
    - `approveOffer`;
    - `rejectOffer`;
    - `addReviewNote`;
    - `listReviewHistory`.
12. Rodar `npx supabase db reset`.
13. Rodar `npx supabase test db`.
14. Rodar testes TypeScript.
15. Abrir PR.
16. Aplicar em Supabase staging somente apos merge e autorizacao explicita.

## Riscos

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| Misturar aprovacao com publicacao | Alto | Tabelas e contratos nao criam post, agenda ou canal |
| Alterar `offers.status` cedo demais | Medio | Usar `approval_queue.status` como fonte da curadoria |
| Historico insuficiente | Medio | `approval_decisions` append-only e `review_notes` preservadas |
| RLS permissiva | Alto | Tests por Admin, Editor, suspenso, outro workspace e anon |
| Concorrencia de aprovacao | Medio | Usar `expectedStatus` nos contratos e update condicional |
| Overengineering editorial | Alto | Sem posts, IA, templates, canais ou scheduler nesta fase |

## Criterios de aceite

- Admin e Editor listam fila do proprio workspace.
- Admin e Editor veem detalhe com oferta, score, highlights, snapshots e
  historico de curadoria.
- Admin e Editor aprovam oferta pendente/em revisao.
- Admin e Editor rejeitam oferta com justificativa obrigatoria.
- Rejeicao sem motivo retorna `VALIDATION_ERROR`.
- Decisao gera historico append-only.
- Observacao interna pode ser adicionada.
- Usuario suspenso nao le nem escreve.
- Usuario de outro workspace nao acessa dados.
- `anon`/Public Visitor nao acessa tabelas internas.
- Transicoes proibidas retornam `INVALID_TRANSITION`.
- Nenhum dado de publicacao, agendamento, canal, Telegram ou post e criado.

## Gate da Fase 3A

`READY_FOR_IMPLEMENTATION`: Sim, se estes documentos forem aprovados e a Fase
3B mantiver o limite: curadoria e aprovacao apenas.
