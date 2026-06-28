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
  offer
  approval
  target
  affiliateUrl
  shortLink?
  generatedAt
```

## Regras

- Template nao deve buscar dados no banco.
- Renderer nao deve chamar publisher.
- Publisher nao deve alterar texto.
- Falha de template deve ocorrer antes de criar tentativa externa.
- Dados ausentes devem gerar fallback claro ou erro permanente.

## Seguranca

- Escapar markdown/html conforme canal.
- Nao inserir secrets em template.
- Nao renderizar payload bruto de integracoes.
- Validar HTTP/HTTPS para links.

## Fora da Fase 6A

- editor visual de template;
- IA/generacao automatica;
- storage de templates;
- renderer real.
