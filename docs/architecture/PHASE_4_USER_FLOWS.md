# Fluxos de Usuario da Fase 4

Status: fluxos para primeira UI navegavel.

## Fluxo 1 - Login

```mermaid
flowchart TD
  A["Usuario acessa /login"] --> B["Preenche email e senha"]
  B --> C{"Credenciais validas?"}
  C -->|"Nao"| D["Mostra erro inline"]
  C -->|"Sim"| E{"Membership ativa?"}
  E -->|"Nao"| F["AccessLimitedState"]
  E -->|"Sim"| G["Dashboard"]
```

## Fluxo 2 - Dashboard para melhor acao

```mermaid
flowchart TD
  A["Dashboard"] --> B["Carrega pendentes de curadoria"]
  A --> C["Carrega melhores ofertas por score"]
  B --> D{"Ha pendentes?"}
  D -->|"Sim"| E["CTA Revisar oferta"]
  D -->|"Nao"| F["CTA Ver ofertas"]
  E --> G["Curation Detail"]
```

## Fluxo 3 - Filtrar ofertas

```mermaid
flowchart TD
  A["Offers list"] --> B["Usuario ajusta filtros"]
  B --> C["URL atualiza query params"]
  C --> D["listOffers server-side"]
  D --> E{"Resultados?"}
  E -->|"Sim"| F["Tabela/lista atualizada"]
  E -->|"Nao"| G["Empty filtrado"]
```

## Fluxo 4 - Abrir detalhe da oferta

```mermaid
flowchart TD
  A["Offers list"] --> B["Ver detalhes"]
  B --> C["getOfferDetail"]
  C --> D["Offer Detail"]
  D --> E["Score e highlights"]
  D --> F["Historico de precos"]
  D --> G["Status de curadoria quando existir"]
```

## Fluxo 5 - Curadoria pendente

```mermaid
flowchart TD
  A["Curation Queue"] --> B["Seleciona oferta pendente"]
  B --> C["getApprovalDetail"]
  C --> D["Curation Detail"]
  D --> E["Revisa score, highlights e historico"]
  E --> F{"Decisao"}
  F -->|"Adicionar nota"| G["addReviewNote"]
  F -->|"Aprovar"| H["ApproveModal"]
  F -->|"Rejeitar"| I["RejectModal"]
```

## Fluxo 6 - Aprovar

```mermaid
flowchart TD
  A["Curation Detail pending"] --> B["Abrir ApproveModal"]
  B --> C["Nota opcional"]
  C --> D["Confirmar"]
  D --> E["approveOffer expectedStatus pending"]
  E --> F{"Sucesso?"}
  F -->|"Sim"| G["Status approved + timeline atualizada"]
  F -->|"VERSION_CONFLICT"| H["Mensagem recarregar detalhe"]
  F -->|"Erro"| I["Toast/erro inline"]
```

## Fluxo 7 - Rejeitar

```mermaid
flowchart TD
  A["Curation Detail pending"] --> B["Abrir RejectModal"]
  B --> C["Informar motivo"]
  C --> D{"Motivo valido?"}
  D -->|"Nao"| E["Erro inline"]
  D -->|"Sim"| F["rejectOffer expectedStatus pending"]
  F --> G{"Sucesso?"}
  G -->|"Sim"| H["Status rejected + motivo no historico"]
  G -->|"VERSION_CONFLICT"| I["Mensagem recarregar detalhe"]
```

## Fluxo 8 - Historico

```mermaid
flowchart TD
  A["Curation Detail"] --> B["ReviewHistory"]
  B --> C["Notas append-only"]
  B --> D["Decisoes append-only"]
  C --> E["Sem editar/excluir"]
  D --> F["Ator, data, decisao e motivo"]
```

## Fluxo 9 - Public Visitor tenta rota interna

```mermaid
flowchart TD
  A["Anon/Public Visitor acessa /curation"] --> B["Guard server-side"]
  B --> C["Sem sessao"]
  C --> D["Redirect /login"]
  D --> E["Nenhum dado interno carregado"]
```

## Decisoes de fluxo

- Aprovacao nao publica.
- Rejeicao nao apaga oferta.
- Nota nao muda status.
- Historico e leitura, nao edicao.
- Filtros ficam na URL.
