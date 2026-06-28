# Publication Template Architecture

Status: especificacao arquitetural. Sem renderer implementado.

## Objetivo

Separar canal, template e mensagem renderizada.

```text
Publisher
  receives RenderedMessage

Template Renderer
  transforms PublicationContext + Template

Message
  ready-to-send payload
```

O Publisher nunca deve conhecer regras de formatacao editorial.

## Responsabilidades

### Publication Template

Define estrutura reutilizavel:

- titulo;
- preco;
- desconto;
- cupom;
- frete;
- chamada para acao;
- link afiliado;
- disclaimers;
- formato por canal.

### Template Renderer

Responsavel por:

- validar variaveis obrigatorias;
- escapar caracteres perigosos;
- aplicar limite de tamanho;
- escolher fallback quando dado estiver ausente;
- gerar `RenderedMessage`.

### Rendered Message

Payload pronto para publisher:

```text
RenderedMessage
  format: plain | markdown | html_restricted
  text
  media[]
  linkPreview?
  metadata
```

## Dados de entrada

```text
PublicationContext
  workspace
  approvedOfferSnapshot
  approvalDecision
  target
  redirectLink
  generatedAt
```

`approvedOfferSnapshot` representa a versao imutavel aprovada para publicacao.
O renderer nao deve ler diretamente a linha viva de `offers`, porque novas
capturas podem atualizar preco, cupom, frete ou link depois da aprovacao.

`redirectLink` e obrigatorio para mensagens enviaveis e deve apontar para
`/r/{shortCode}`. Publicar `affiliateUrl` bruto fica bloqueado para evitar
bypass de analytics e `click_events`.

## Regras

- Template nao deve buscar dados no banco.
- Renderer nao deve chamar publisher.
- Publisher nao deve alterar texto.
- Falha de template deve ocorrer antes de criar tentativa externa.
- Dados ausentes devem gerar fallback claro ou erro permanente.
- Mensagem enviavel exige `redirectLink`; sem ele, o renderer retorna erro
  permanente antes de chamar publisher.
- Preco, cupom, frete, link e texto devem vir do snapshot/draft aprovado, nao
  da oferta mutavel.

## Seguranca

- Escapar markdown/html conforme canal.
- Nao inserir secrets em template.
- Nao renderizar payload bruto de integracoes.
- Validar HTTP/HTTPS para links.
- Validar que `redirectLink` usa rota publica controlada `/r/{shortCode}`.

## Fora da Fase 6A

- editor visual de template;
- IA/generacao automatica;
- storage de templates;
- renderer real.
