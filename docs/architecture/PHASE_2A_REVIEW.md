# PHASE_2A_REVIEW

Status: aprovado com ajustes antes da Fase 2B.

## Resumo executivo

Resultado: **aprovado com ajustes**.

A Fase 2A esta conceitualmente correta e pronta para orientar a Fase 2B, mas a
revisao encontrou tres ajustes finos que devem ser incorporados no inicio da
implementacao para reduzir retrabalho:

1. Especificar de forma deterministica o algoritmo de `dedupe_key`.
2. Remover `workspaceId` dos contratos recebidos do cliente e deriva-lo da
   membership ativa.
3. Manter `offer_tags` com delete fisico de vinculo, sem soft delete ou
   historico nesta fase.

Nenhum ponto exige reabrir arquitetura, alterar Fase 1 ou expandir escopo.

## Revisao do dedupe_key

### Analise

Os documentos da Fase 2A definem `external_id`, `dedupe_key`, `source_url` e
`affiliate_url`, mas ainda deixam ambigua a regra exata de normalizacao.

Para o MVP, a deduplicacao deve ser deterministica, simples e independente de
APIs externas. A fonte preferencial de identidade e:

1. `external_id`, quando informado.
2. URL canonica derivada de `source_url`, quando `external_id` nao existir.

`affiliate_url` nao deve ser a base primaria do `dedupe_key`, porque tende a
conter parametros de afiliacao, campanha e tracking que mudam com frequencia.
Ela deve ser validada e persistida, mas nao usada para identificar o produto
exceto como fallback extremo e explicito.

### Especificacao recomendada

Gerar `dedupe_key` no servidor.

Formato recomendado:

```text
<marketplace>:external:<normalized_external_id>
```

quando `external_id` existir.

Quando `external_id` estiver ausente:

```text
<marketplace>:url:<sha256(canonical_source_url)>
```

`canonical_source_url` deve ser gerada a partir de `source_url`.

Normalizacao obrigatoria da URL:

- aceitar somente protocolos `http:` e `https:`;
- normalizar protocolo e host para lowercase;
- remover `www.` inicial do host;
- remover porta padrao `:80` para HTTP e `:443` para HTTPS;
- remover hash/fragment (`#...`);
- remover trailing slash do path, exceto quando path for `/`;
- preservar path com case original, porque alguns servidores podem tratar paths
  como case-sensitive;
- ordenar query params restantes por nome e valor;
- remover query params vazios apos trim;
- remover parametros conhecidos de tracking.

Query params a ignorar:

- todos que comecem com `utm_`;
- `fbclid`;
- `gclid`;
- `gbraid`;
- `wbraid`;
- `msclkid`;
- `yclid`;
- `mc_cid`;
- `mc_eid`;
- `igshid`;
- `ref`;
- `ref_`;
- `spm`;
- `campaign`;
- `campaign_id`;
- `ad_id`;
- `adset_id`;
- `creative`;
- `click_id`;
- `clickid`;
- `aff_id`;
- `affiliate_id`;
- `tag`;
- `ascsubtag`;

Parametros especificos de produto devem ser preservados quando forem parte da
identificacao do item, por exemplo `id`, `item_id`, `product_id`, `sku`,
`variation_id`, `seller_id`.

`normalized_external_id`:

- trim;
- lowercase somente quando o marketplace for `manual`;
- para `mercado_livre` e `shopee`, preservar case se houver risco de IDs
  case-sensitive; ainda assim remover espacos em volta.

### Riscos

Risco de colisao:

- Baixo usando SHA-256 da URL canonica.
- Maior se a canonicalizacao remover parametro que na pratica identifica
  variacao do produto.

Risco de ofertas duplicadas:

- Medio se o usuario inserir URLs muito diferentes para o mesmo produto.
- Medio se `external_id` for omitido e o marketplace usar URLs com estrutura
  instavel.

Risco de merge indevido:

- Baixo quando `external_id` e confiavel.
- Medio quando dois produtos compartilham URL de landing page com variacao
  apenas em query param removido.

### Recomendacao

Obrigatoria antes da Fase 2B:

- Implementar `dedupe_key` como regra server-side deterministica.
- Usar `external_id` como prioridade quando informado.
- Usar `source_url` canonica e hash quando `external_id` estiver ausente.
- Nao usar `affiliate_url` como identidade primaria.
- Cobrir normalizacao e colisao por testes unitarios.

## Revisao do workspaceId

### Analise

Os contratos atuais incluem `workspaceId` nos requests de:

- `captureOfferManual`
- `listOffers`
- `getOfferDetail`
- `updateOfferManual`

Isso funciona tecnicamente se o servidor validar membership ativa, mas aumenta
superficie de abuso e ruido nos testes. Como a Fase 1 ja definiu membership como
fonte de autoridade, o workspace efetivo deve ser derivado no servidor.

No MVP existe um workspace operacional principal por usuario interno. Mesmo que
o banco suporte multi-workspace para isolamento e testes, a UI do MVP nao deve
exigir que o cliente escolha ou envie workspace.

### Respostas objetivas

1. `workspaceId` deve ser enviado pelo cliente?

Nao para os contratos da aplicacao MVP.

2. `workspaceId` deve ser derivado da membership ativa?

Sim. O servidor deve resolver o workspace ativo a partir da sessao e de
`workspace_members`.

3. Existe caso legitimo para permitir envio pelo cliente?

Somente futuro, se houver UI multi-workspace explicita. Mesmo nesse caso o
cliente enviaria uma escolha de contexto, e o servidor ainda validaria a
membership ativa. Nao e necessario na Fase 2.

4. Impacto:

- Server Actions: devem chamar helper server-side para resolver workspace antes
  de validar permissao.
- Queries: devem filtrar pelo workspace resolvido, nao por input do cliente.
- RLS: permanece como defesa em profundidade usando `workspace_id`.
- Testes: devem cobrir tentativa de injetar `workspaceId` de outro workspace,
  mesmo se o contrato publico nao aceitar esse campo.

### Riscos

- Enviar `workspaceId` pelo cliente pode induzir implementacoes a confiar no
  body/query.
- Pode gerar bugs de UX quando usuario tem uma unica membership ativa.
- Pode vazar diferencas de erro entre workspace inexistente e proibido.

### Recomendacao

Obrigatoria antes da Fase 2B:

- Remover `workspaceId` dos schemas Zod recebidos do cliente.
- Resolver workspace no servidor pela membership ativa.
- Se o usuario tiver zero memberships ativas: `FORBIDDEN`.
- Se no futuro houver mais de uma membership ativa, criar decisao especifica de
  seletor de workspace; nao improvisar na Fase 2.
- Manter `workspace_id` no banco e nas queries internas.

## Revisao do offer_tags

### Analise

`offer_tags` e uma tabela de vinculo N:N. A Fase 2A permite delete fisico de
vinculo para Admin, enquanto nega delete fisico para entidades principais.

Essa decisao e adequada para MVP porque remover uma tag de uma oferta nao apaga
a tag nem a oferta. Soft delete adicionaria colunas, indices, filtros,
constraints parciais e carga de RLS sem gerar valor real nesta fase.

### Respostas objetivas

1. DELETE fisico e aceitavel?

Sim, para `offer_tags`, limitado a Admin ativo do workspace e apenas no vinculo.

2. Soft delete agrega valor real nesta fase?

Nao. Agrega complexidade sem necessidade para validar captura, curadoria e
score.

3. Ha necessidade de historico?

Nao na Fase 2. Historico de mudanca de tags pode entrar futuramente junto de
auditoria editorial, mas isso pertence a fases posteriores.

4. Qual abordagem reduz complexidade?

PK `(offer_id, tag_id)` com insert/delete fisico do vinculo, validado por
workspace e Server Action.

5. Qual abordagem recomendada?

Manter delete fisico apenas para `offer_tags`. Nao criar `deleted_at`,
`removed_by`, `removed_at` ou audit log nesta fase.

### Riscos

- Sem historico, nao sera possivel auditar alteracoes de tags na Fase 2.
- Esse risco e aceitavel porque tags sao apoio de curadoria, nao decisao de
  aprovacao/publicacao.

### Recomendacao

Recomendada:

- Manter delete fisico de vinculo.
- Garantir que RLS permita delete somente para Admin ativo do mesmo workspace.
- Testar que Editor nao remove vinculos.
- Testar que Admin nao remove vinculo de outro workspace.

## Impacto na Fase 2B

### Dedupe key

Impacto em migrations:

- Nenhuma nova tabela.
- Manter `dedupe_key text not null`.
- Manter unique `(workspace_id, dedupe_key)`.
- Considerar tamanho suficiente para prefixo + hash.

Impacto em RLS:

- Nenhum impacto direto.

Impacto em contratos:

- Especificar que `dedupe_key` nunca vem do cliente.
- `externalId` permanece opcional.
- `sourceUrl` vira base obrigatoria de fallback.
- `affiliateUrl` validada, mas nao usada como identidade primaria.

Impacto em testes:

- Adicionar testes de canonicalizacao.
- Adicionar testes de tracking params removidos.
- Adicionar teste de query param de produto preservado.
- Adicionar teste de recaptura com URL equivalente.

Impacto em seed:

- Incluir duas ofertas/entradas equivalentes com tracking diferente para validar
  update em vez de duplicacao.

### workspaceId

Impacto em migrations:

- Nenhum. `workspace_id` continua obrigatorio nas tabelas.

Impacto em RLS:

- Nenhum enfraquecimento. RLS continua filtrando por `workspace_id`.

Impacto em contratos:

- Remover `workspaceId` dos requests publicos de Fase 2B.
- Usar workspace resolvido internamente nas queries/mutacoes.

Impacto em testes:

- Testar que cliente nao consegue forcar outro workspace.
- Testar usuario sem membership ativa.
- Testar usuario com membership suspensa.
- Testar Admin B tentando acessar ID de oferta do Workspace A.

Impacto em seed:

- Manter dois workspaces para isolamento.
- Nao exigir workspace selecionavel em fixtures de API.

### offer_tags

Impacto em migrations:

- Manter tabela simples.
- Nao adicionar soft delete.
- Garantir FKs e PK `(offer_id, tag_id)`.

Impacto em RLS:

- Criar policy de delete somente para Admin ativo do workspace, se o fluxo de
  substituicao de tags usar delete.
- Alternativa aceitavel: negar delete no Data API e alterar vinculos somente em
  Server Action/RPC validada. Para MVP, a opcao mais simples e policy restrita a
  Admin.

Impacto em contratos:

- `tagIds` em `captureOfferManual` e `updateOfferManual` substitui o conjunto de
  tags da oferta.
- Editor nao altera tags.

Impacto em testes:

- Admin adiciona/remove tag.
- Editor nao remove tag.
- Admin de outro workspace nao remove tag.
- Remocao de tag nao apaga oferta nem tag.

Impacto em seed:

- Incluir ofertas com multiplas tags.
- Incluir caso de troca de tags em teste de update.

## Acoes recomendadas

### Obrigatorias antes da Fase 2B

1. Incorporar algoritmo de `dedupe_key` no inicio da implementacao.
2. Remover `workspaceId` dos schemas de input expostos ao cliente.
3. Resolver workspace ativo no servidor antes de toda query/mutacao.
4. Adicionar testes de canonicalizacao, tracking params e deduplicacao.
5. Adicionar testes de tentativa de injecao de workspace.

### Recomendadas

1. Manter delete fisico apenas em `offer_tags`.
2. Tratar `tagIds` como substituicao completa do conjunto de tags da oferta.
3. Documentar no changelog da Fase 2B que `affiliate_url` nao compoe identidade
   primaria da oferta.

### Opcionais

1. Criar helper interno `resolveActiveWorkspaceForUser`.
2. Criar fixture especifica para URL com params de tracking.
3. Criar metricas futuras de colisao/duplicidade manual, sem implementar agora.

## Status final

`PHASE_2A_REVIEW_STATUS`: `APPROVED_WITH_ADJUSTMENTS`

`READY_FOR_PHASE_2B`: `SIM`

A Fase 2B pode iniciar, incorporando os ajustes obrigatorios no primeiro passo
da implementacao.
