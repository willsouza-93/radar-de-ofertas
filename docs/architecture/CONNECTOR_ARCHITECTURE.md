# Connector Architecture

Status: arquitetura conceitual para conectores futuros. Nao implementa codigo,
SDKs, APIs reais ou credenciais.

## Objetivo

Permitir que o Radar capture ofertas de multiplas origens sem acoplar o core a
Amazon, Shopee, Mercado Livre, Magalu, AliExpress ou qualquer marketplace
especifico.

O core deve conhecer apenas um contrato generico:

```text
Connector -> RawOffer[] -> Pipeline Core
```

## Principios

- Conectores sao adapters independentes.
- O core nao importa SDK nem regras especificas de marketplace.
- O conector nao calcula score final.
- O conector nao aprova, rejeita, agenda ou publica.
- Cada conector declara capabilities e versao.
- Cada conector pode falhar parcialmente sem quebrar o pipeline inteiro.
- Cada conector deve respeitar termos de uso, rate limit e permissao oficial.

## Responsabilidades do conector

Um conector deve:

- autenticar na fonte, quando aplicavel;
- buscar um lote limitado de dados;
- retornar registros brutos em formato comum;
- informar metadados de origem;
- classificar erros externos;
- respeitar timeout e rate limit;
- nao vazar secrets em logs;
- informar se dados como comissao, cupom ou preco anterior estao ausentes.

Um conector nao deve:

- gravar diretamente em `offers`;
- acessar RLS por conta propria;
- decidir workspace a partir do cliente;
- executar retry infinito;
- transformar falha de um item em falha total sem necessidade;
- criar approval decisions;
- publicar em canais.

## Interface conceitual

```text
ConnectorDefinition
  id
  version
  displayName
  sourceType
  capabilities
  limits
  requiredSecrets
  fetch(context): ConnectorResult

ConnectorContext
  workspaceId
  connectorConfig
  since
  pageToken
  limit
  correlationId
  deadline

ConnectorResult
  items: RawOffer[]
  nextPageToken?
  warnings[]
  errors[]
  rateLimit?
  sourceCursor?
```

Esta interface e documental. A Fase 5A nao cria tipos TypeScript.

## Lifecycle

```text
Registered
  -> Configured
  -> Testable
  -> Enabled
  -> Running
  -> Warning
  -> Disabled
```

### Registered

O codigo do conector existe e declara capacidades.

### Configured

Credenciais e parametros estao presentes, mas ainda nao foram validados.

### Testable

O conector pode executar teste seguro de leitura ou validacao de credenciais.

### Enabled

Pode ser usado por captura manual ou futura rotina agendada.

### Running

Existe uma execucao ativa.

### Warning

Fonte responde com erro recuperavel, rate limit ou degradacao.

### Disabled

Nao deve executar ate intervencao humana.

## Capabilities

Um conector deve declarar quais dados consegue fornecer:

- `external_identity`
- `current_price`
- `previous_price`
- `images`
- `affiliate_link`
- `coupon`
- `free_shipping`
- `commission`
- `seller`
- `category_hint`
- `pagination`
- `incremental_cursor`

O pipeline nao deve assumir que todos os conectores fornecem todos os campos.
Dados ausentes seguem a estrategia do score: fator ausente vale zero.

## Pontos de extensao

- Autenticacao: API key, OAuth, feed assinado, arquivo importado.
- Fetch: pagina unica, paginacao, cursor incremental.
- Mapping: campos especificos da fonte para `RawOffer`.
- Validation hints: avisos especificos sem acoplar o core.
- Rate limit: informacao de espera recomendada.
- Terms metadata: flags de retencao e exibicao permitida.

## Limites

- A Fase 5A nao define storage de configuracoes de conectores.
- A Fase 5A nao cria tabela `connectors`.
- A Fase 5A nao adiciona novos valores ao enum `offer_marketplace`.
- A Fase 5A nao escolhe marketplace inicial.
- A Fase 5A nao implementa scheduler.

Essas decisoes pertencem a Fase 5B/5C.

## Como adicionar novo marketplace sem alterar o core

1. Executar spike de viabilidade e termos.
2. Criar adapter que implemente o contrato generico.
3. Declarar capabilities e limites.
4. Mapear saida para `RawOffer`.
5. Rodar testes de contrato do conector.
6. Integrar ao registry de conectores.
7. Validar deduplicacao e idempotencia em ambiente local.

O core deve continuar consumindo apenas `RawOffer`.

## Versionamento dos conectores

Cada conector deve ter:

- `connector_id`: identificador estavel interno.
- `connector_version`: versao semantica do adapter.
- `contract_version`: versao do contrato de `RawOffer`.
- `source_contract_version`: versao/endpoint/feed externo quando conhecida.

Mudancas compativeis:

- adicionar campo opcional;
- melhorar warnings;
- acrescentar capability nova sem exigir uso.

Mudancas incompativeis:

- mudar significado de campo;
- mudar identidade externa;
- remover capability usada;
- alterar regra de paginacao.

Mudancas incompativeis devem exigir nova versao maior do conector e plano de
reprocessamento.

## Estrategia recomendada para o MVP futuro

1. Comecar com conector `manual/import` como referencia de contrato.
2. Implementar registry simples em memoria no servidor.
3. Persistir somente dados necessarios para `offers` e auditoria minima.
4. Adicionar primeiro conector oficial com feature flag operacional.
5. Evitar framework de plugins dinamicos ate existir mais de um conector real.
