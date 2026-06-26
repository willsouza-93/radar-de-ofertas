# Capture Data Contracts

Status: contratos conceituais para fases futuras. Nao gerar codigo nesta fase.

## Objetivo

Definir a evolucao de dados desde a captura bruta ate uma oferta publicada em
fase futura.

```text
RawOffer -> NormalizedOffer -> ScoredOffer -> ApprovedOffer -> PublishedOffer
```

## Regras gerais

- Contratos internos devem ter `contractVersion`.
- Campos obrigatorios devem ser minimos.
- Dados externos sao nao confiaveis ate passarem por normalizacao e validacao.
- Campos opcionais ausentes nao podem ser reponderados silenciosamente no score.
- URLs aceitam apenas HTTP/HTTPS.
- Dinheiro usa escala equivalente a `numeric(12,2)`.
- Moeda padrao e `BRL` enquanto multi-moeda estiver fora do produto.

## RawOffer

Registro recebido de um conector antes de normalizacao completa.

### Origem

- Conector manual/import.
- API/feed oficial.
- Fonte futura aprovada por spike.

### Campos obrigatorios

| Campo | Descricao |
| --- | --- |
| `contractVersion` | Versao do contrato RawOffer |
| `connectorId` | Identificador interno do conector |
| `connectorVersion` | Versao do adapter |
| `capturedAt` | Instante observado pelo pipeline |
| `title` | Titulo bruto |
| `sourceUrl` | URL original da oferta/produto |
| `currentPrice` | Preco atual bruto |

### Campos opcionais

| Campo | Descricao |
| --- | --- |
| `externalId` | Identificador oficial da fonte |
| `affiliateUrl` | Link afiliado quando fornecido ou informado |
| `previousPrice` | Preco comparativo |
| `currency` | Moeda informada |
| `imageUrl` | Imagem remota |
| `couponCode` | Cupom |
| `freeShipping` | Sinal de frete gratis |
| `commissionPercent` | Comissao estimada/oficial |
| `sellerId` | Identificador do vendedor |
| `sellerName` | Nome do vendedor |
| `categoryHint` | Categoria sugerida pela fonte |
| `rawPayloadRef` | Referencia segura ao payload bruto, se houver storage futuro |
| `sourceMetadata` | Metadados tecnicos sem secrets |

### Validacoes

- `title` nao pode ser vazio.
- `sourceUrl` deve ser parseavel como HTTP/HTTPS.
- `currentPrice` deve ser >= 0.
- `currency`, quando ausente, assume `BRL` na normalizacao.
- `affiliateUrl`, se ausente, pode impedir envio ao fluxo editorial ate ser
  completada manualmente, conforme decisao futura.

### Evolucao futura

Novos campos devem ser opcionais por padrao. Mudancas de significado exigem nova
versao de contrato.

## NormalizedOffer

Registro validado e normalizado, pronto para deduplicacao e score.

### Campos obrigatorios

| Campo | Descricao |
| --- | --- |
| `contractVersion` | Versao do contrato NormalizedOffer |
| `workspaceId` | Workspace resolvido server-side |
| `sourceKey` | Origem interna generica |
| `externalId` | Identidade externa normalizada ou fallback `url:<hash>` |
| `dedupeKey` | Chave deterministica de deduplicacao |
| `canonicalSourceUrl` | URL fonte canonizada |
| `sourceUrl` | URL fonte validada |
| `affiliateUrl` | URL afiliada validada |
| `title` | Titulo trimado |
| `currentPrice` | Preco atual normalizado |
| `currency` | `BRL` no MVP |
| `capturedAt` | Instante de captura |

### Campos opcionais

| Campo | Descricao |
| --- | --- |
| `imageUrl` | URL HTTP/HTTPS |
| `previousPrice` | Preco anterior |
| `discountPercent` | Percentual derivado ou informado |
| `couponCode` | Cupom normalizado |
| `freeShipping` | Booleano |
| `commissionPercent` | Percentual 0..100 |
| `categoryId` | Categoria interna, se resolvida |
| `tagIds` | Tags internas, se resolvidas |
| `sellerKey` | Identidade normalizada do seller |
| `normalizationWarnings` | Avisos nao bloqueantes |

### Validacoes

- `workspaceId` vem de membership ativa, nunca do cliente.
- `sourceUrl`, `affiliateUrl` e `imageUrl` aceitam apenas HTTP/HTTPS.
- `currentPrice`, `previousPrice` seguem escala monetaria.
- `discountPercent` fica entre 0 e 100.
- Categoria/tag devem pertencer ao mesmo workspace.

## ScoredOffer

Oferta normalizada com score deterministico.

### Campos obrigatorios

| Campo | Descricao |
| --- | --- |
| `normalizedOffer` | Dados normalizados |
| `score` | Inteiro 0..100 |
| `scoreVersion` | Versao da formula |
| `scoreFactors` | JSON explicavel |
| `highlights` | Lista derivada |

### Campos opcionais

| Campo | Descricao |
| --- | --- |
| `scoreWarnings` | Avisos sobre dados ausentes |
| `previousSnapshotsUsed` | Referencia a snapshots usados no calculo |

### Validacoes

- Score nunca decide aprovacao.
- Highlights sao derivados, nao aceitos diretamente do conector.
- Mudanca de pesos exige nova `scoreVersion`.

## ApprovedOffer

Representa oferta aprovada por Admin/Editor.

### Origem

- `approval_queue.status = approved`.
- `approval_decisions` append-only.

### Campos obrigatorios

| Campo | Descricao |
| --- | --- |
| `workspaceId` | Workspace da oferta |
| `offerId` | Oferta aprovada |
| `queueId` | Linha de curadoria |
| `decisionId` | Decisao aprovada |
| `approvedBy` | Perfil que aprovou |
| `approvedAt` | Momento da aprovacao |

### Campos opcionais

| Campo | Descricao |
| --- | --- |
| `approvalReason` | Motivo ou comentario |
| `notesSummary` | Resumo futuro, se houver |

### Validacoes

- Deve existir decisao `approved`.
- Nao pode ser produzido por conector.
- Nao publica automaticamente.

## PublishedOffer

Contrato futuro para resultado de publicacao.

### Campos obrigatorios

| Campo | Descricao |
| --- | --- |
| `workspaceId` | Workspace |
| `offerId` | Oferta |
| `publicationId` | Publicacao futura |
| `channel` | Canal de destino |
| `status` | Estado de publicacao |
| `idempotencyKey` | Chave contra duplicidade |

### Campos opcionais

| Campo | Descricao |
| --- | --- |
| `externalMessageId` | ID retornado pelo canal |
| `publishedAt` | Momento de sucesso |
| `failureCode` | Erro estavel |
| `retryAfter` | Proxima tentativa |

### Validacoes

- So pode nascer de oferta aprovada.
- Deve registrar resultado e idempotencia.
- Fica fora da Fase 5A.

## Compatibilidade entre versoes

Regras:

- Adicionar campo opcional e compativel.
- Tornar campo obrigatorio e incompativel.
- Mudar semantica de campo e incompativel.
- Renomear campo e incompativel.
- Remover campo e incompativel.

Cada execucao de pipeline deve registrar versoes usadas para permitir auditoria
e reprocessamento futuro.
