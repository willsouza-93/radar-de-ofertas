# Deduplication Strategy

Status: estrategia arquitetural para captura futura. Nao altera a implementacao
atual.

## Objetivo

Evitar ofertas duplicadas sem perder historico de preco, sinais de score ou
auditoria de captura.

## Identidades relevantes

### Mesma oferta

Mesma oportunidade comercial observada na mesma fonte, normalmente identificada
por:

1. `connector_id` ou marketplace interno;
2. `external_id` confiavel;
3. URL canonica da oferta/produto.

### Mesmo produto

Produto equivalente vendido em uma ou varias fontes. Pode exigir matching por
titulo, modelo, GTIN/EAN, seller e categoria.

No MVP futuro, "mesmo produto" nao deve gerar merge automatico. Deve ser apenas
sinal auxiliar para curadoria ou analise futura.

### Mesma URL

URL que aponta para o mesmo recurso depois de canonicalizacao:

- protocolo normalizado;
- host lowercase e sem `www.`;
- porta padrao removida;
- fragmento removido;
- trailing slash normalizado;
- parametros de tracking removidos;
- query params restantes ordenados.

### Mesmo marketplace

No estado atual, `offer_marketplace` aceita `manual`, `mercado_livre` e
`shopee`. Em arquitetura futura, o core deve migrar gradualmente para origem
generica de conector. Ate la, o mapeamento para enum existente deve ocorrer no
boundary de persistencia, nao no core do pipeline.

### Mesmo seller

Seller ajuda a reduzir falsos positivos, mas nao deve ser criterio primario no
MVP. Muitos conectores podem nao fornecer seller confiavel.

## Chave primaria recomendada

Prioridade:

```text
<sourceKey>:external:<externalId>
```

Fallback:

```text
<sourceKey>:url:<sha256(canonicalSourceUrl)>
```

Onde `sourceKey` e a origem interna estavel do conector ou marketplace.

## Canonicalizacao de URL

Remover:

- fragment/hash;
- portas padrao;
- trailing slash redundante;
- parametros `utm_*`;
- parametros `ref_*`;
- parametros de tracking conhecidos como `fbclid`, `gclid`, `gbraid`,
  `wbraid`, `msclkid`, `yclid`, `mc_cid`, `mc_eid`, `igshid`, `spm`,
  `campaign`, `campaign_id`, `ad_id`, `adset_id`, `creative`, `click_id`,
  `clickid`, `aff_id`, `affiliate_id`, `tag`, `ascsubtag`.

Preservar:

- parametros que alteram produto, variacao ou vendedor;
- path significativo;
- query params desconhecidos, ordenados, ate decisao especifica por conector.

## Quando ignorar

Ignorar item capturado quando:

- nao possui `source_url` valida;
- nao possui preco atual valido;
- viola contrato minimo;
- e duplicata perfeita e nao altera preco, cupom, frete, comissao, titulo,
  imagem ou `last_seen_at` relevante;
- fonte retornou item removido/indisponivel sem dado suficiente para atualizar.

Mesmo ignorado, o resumo da captura deve contar o item como `unchanged` ou
`invalid`, conforme o caso.

## Quando atualizar

Atualizar `offers` quando a oferta existente tem mudanca relevante:

- preco atual;
- preco anterior;
- cupom;
- frete gratis;
- comissao;
- imagem;
- titulo;
- categoria/tag resolvida;
- `last_seen_at`.

Mudanca de preco ou sinais comerciais deve gerar `price_snapshots` quando
respeitar a regra de snapshot.

## Quando substituir

Substituir dados textuais/metadata somente quando a nova fonte for confiavel e
mais recente.

Nao substituir automaticamente:

- decisao de curadoria;
- notas;
- historico de decisoes;
- oferta aprovada/rejeitada;
- link afiliado curado manualmente, salvo regra futura explicita.

## Quando manter historico

Manter historico quando:

- preco muda;
- cupom aparece/desaparece;
- frete gratis muda;
- comissao muda;
- score muda por mudanca de dado relevante;
- oferta ja estava em curadoria e uma nova captura altera contexto.

Historico de preco fica em `price_snapshots`. Historico editorial fica em
`review_notes` e `approval_decisions`.

## Riscos

| Risco | Impacto | Mitigacao |
| --- | --- | --- |
| Colisao de URL canonica | Oferta errada atualizada | Preferir `external_id` confiavel |
| Parametro desconhecido removido indevidamente | Variacao perdida | Remover somente tracking conhecido |
| Marketplace sem ID estavel | Duplicatas | Fallback por URL canonica e alertas |
| Produto igual em sellers diferentes | Merge indevido | Seller nao e chave primaria |
| Link afiliado usado como identidade | Duplicata/erro | Nunca usar `affiliate_url` como identidade primaria |

## Decisao recomendada

Manter a estrategia atual como base:

1. `external_id` normalizado quando confiavel;
2. URL fonte canonizada como fallback;
3. `affiliate_url` apenas como dado de destino, nunca identidade primaria;
4. conflitos viram erro operacional, nao merge automatico silencioso.
