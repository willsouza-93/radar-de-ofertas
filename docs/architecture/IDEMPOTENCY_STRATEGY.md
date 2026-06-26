# Idempotency Strategy

Status: estrategia arquitetural. Nao cria tabelas, funcoes ou migrations nesta
fase.

## Objetivo

Permitir que capturas, retries e execucoes repetidas produzam o mesmo resultado
logico sem duplicar ofertas, snapshots, filas ou decisoes editoriais.

## Principios

- Cada operacao repetivel deve ter chave deterministica.
- Mutacoes devem ser pequenas e transacionais quando cruzarem estado critico.
- Retry pode repetir entrada, mas nao pode duplicar saida.
- Captura nunca cria multiplas aprovacoes para a mesma oferta.
- Falhas parciais devem ser registradas com correlation ID.

## Cenarios

### Mesma oferta recebida varias vezes

Resultado esperado:

- localizar oferta existente por `dedupe_key` ou identidade externa;
- atualizar `last_seen_at`;
- criar snapshot apenas se houver mudanca relevante;
- manter uma unica `approval_queue` por oferta/workspace.
- avaliar reentrada editorial separadamente da deduplicacao tecnica.

### Oferta reaparece apos algum tempo

Resultado esperado:

- se nao houve mudanca material e o cooldown editorial nao expirou, tratar como
  `unchanged/noop`;
- se houve mudanca material, atualizar oferta, criar snapshot quando aplicavel,
  recalcular score e permitir nova curadoria;
- se nao houve mudanca material, mas o cooldown editorial de 24 horas expirou,
  permitir nova avaliacao editorial;
- nunca tratar a oferta como invalida apenas por ela ja existir.

O cooldown editorial e uma regra de produto. Ele nao substitui idempotency key,
retry, lock, cursor ou janela tecnica.

### Captura repetida apos retry

Resultado esperado:

- reaproveitar `captureRunId` ou idempotency key da janela;
- nao recriar ofertas ja persistidas;
- processar novamente itens pendentes se seguro;
- registrar resumo final sem contagem duplicada quando possivel.

### Scheduler executando novamente

Resultado esperado futuro:

- execucao usa `capture:{workspace}:{connector}:{window}` ou cursor equivalente;
- se a execucao anterior terminou, a nova deve ser `noop` ou refresh controlado;
- se a execucao anterior ficou presa, aplicar lock timeout e reconciliacao.

### Marketplace reenviando registros

Resultado esperado:

- registros iguais viram `unchanged`;
- registros atualizados viram `updated`;
- registros conflitantes viram `conflict` para investigacao.

## Chaves recomendadas

### Capture run

```text
capture:<workspaceId>:<connectorId>:<windowOrCursor>
```

### Item capturado

```text
capture-item:<captureRunId>:<dedupeKey>
```

### Offer

```text
<sourceKey>:external:<externalId>
<sourceKey>:url:<sha256(canonicalSourceUrl)>
```

### Snapshot

```text
snapshot:<offerId>:<observedAtBucket>:<price>:<coupon>:<shipping>
```

Observacao: a implementacao atual usa unique `(offer_id, observed_at)` e evita
snapshot quando dados relevantes nao mudam. Uma fase futura pode refinar a
granularidade.

### Approval queue

```text
approval-queue:<workspaceId>:<offerId>
```

Ja existe unique `(workspace_id, offer_id)`.

## Como impedir duplicacao

- Unique constraints em dados de destino.
- Upsert por chave natural.
- Transacao para criar/atualizar oferta e snapshot quando necessario.
- Criar `approval_queue` somente como `pending`.
- Nunca inserir `approval_decisions` durante captura.
- Usar `expectedStatus` no fluxo humano de decisao.

## Como impedir inconsistencia

- Validar workspace em todos os registros relacionados.
- Evitar aceitar `workspaceId` do cliente.
- Registrar estado do item como `created`, `updated`, `unchanged`, `invalid` ou
  `conflict`.
- Separar erro de item de erro de execucao.
- Nao sobrescrever dados editoriais por captura.

## Como impedir perda de historico

- Snapshot append-only quando preco/sinais mudarem.
- Decisoes append-only.
- Notas append-only.
- Atualizacao de oferta preserva `captured_at` original.
- `last_seen_at` mostra a observacao mais recente.

## Como impedir multiplas aprovacoes da mesma oferta

- Captura nao aprova.
- `approval_queue` e unica por oferta/workspace.
- Aprovacao/rejeicao exige `pending`.
- `apply_approval_decision` continua sendo a fronteira atomica de decisao.
- Captura posterior de oferta aprovada nao deve criar nova fila sem decisao
  explicita futura.

## Estrategia recomendada

1. Fase 5B: modelar execucao de captura e itens processados somente se for
   necessario para auditoria operacional.
2. Fase 5C: primeiro conector deve usar idempotency key por janela/cursor.
3. Antes de scheduler, validar execucao manual repetida localmente.
4. Scheduler so deve chamar operacoes idempotentes.

## Tradeoffs

- Persistir cada item bruto melhora auditoria, mas aumenta custo e schema.
- Idempotency keys em banco reduzem duplicidade, mas exigem migrations.
- Comecar com upsert em `offers` e logs resumidos e mais simples para MVP.
