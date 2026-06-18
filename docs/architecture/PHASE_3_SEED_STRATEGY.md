# Estrategia de Seed da Fase 3

Status: dados locais/teste para Fase 3B.

## Principios

- Seeds da Fase 3 sao apenas locais/teste.
- Nao aplicar seeds de fixture em staging.
- Dados devem ser idempotentes.
- Manter dois workspaces para isolamento.
- Nao criar Public Visitor.
- Nao criar posts, publicacoes, canais ou agendas.

## Cenarios positivos

Workspace A:

- oferta capturada sem fila;
- oferta em `pending`;
- oferta em `under_review` com nota;
- oferta `approved` com decisao;
- oferta `rejected` com motivo;
- historico com mais de uma nota.

Workspace B:

- pelo menos uma oferta em fila;
- uma decisao propria;
- nota propria.

## Cenarios negativos

Seeds/testes devem cobrir:

- fila com oferta de outro workspace deve falhar;
- decisao com queue/offer divergentes deve falhar;
- nota com queue/offer divergentes deve falhar;
- rejeicao sem motivo deve falhar;
- status invalido deve falhar;
- tentativa de delete deve falhar por grant/RLS.

## Dados sugeridos

Usar ofertas existentes da Fase 2 como base:

- oferta forte de tecnologia para `approved`;
- oferta com poucos dados para `pending`;
- oferta com preco acima do menor anterior para `under_review`;
- oferta isolada do Workspace B para teste de isolamento;
- oferta rejeitada por motivo textual claro.

## Idempotencia

- Usar UUIDs fixos apenas em seed/teste.
- Usar `on conflict` para filas.
- Decisoes historicas podem usar IDs fixos ou serem recriadas em reset local.
- Evitar datas relativas; usar timestamps fixos.

## Staging

Nao aplicar seed automatico.

Se for necessario validar staging:

1. criar dados pela UI/API futura com usuarios nominais;
2. registrar quem criou;
3. nao usar senhas genericas;
4. nao limpar sem confirmacao.
