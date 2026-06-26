# AI Enrichment Architecture

Status: arquitetura futura. Nao escolher provedor, modelo, SDK ou implementar
IA nesta fase.

## Objetivo

Definir onde IA poderia entrar futuramente sem comprometer seguranca,
curadoria humana ou score deterministico.

Fluxo conceitual:

```text
Offer
  -> Enrichment
  -> Summary
  -> Optimized title
  -> Hashtags
  -> Publication draft
  -> Human review
```

## Principios

- IA nunca aprova.
- IA nunca publica.
- IA nunca altera score deterministico na primeira etapa.
- IA gera sugestoes editaveis.
- Humano revisa antes de qualquer publicacao.
- Prompt, input e output devem ser auditaveis sem expor secrets.
- Provedor/modelo ficam adiados.

## Possiveis enriquecimentos

- resumo curto da oferta;
- titulo editorial otimizado;
- bullets de beneficios;
- hashtags;
- alerta de risco textual;
- sugestao de categoria/tag;
- sugestao de motivo de destaque.

## Entrada recomendada

Usar apenas dados necessarios:

- titulo;
- marketplace/origem;
- preco atual;
- preco anterior;
- desconto;
- categoria;
- highlights;
- cupom/frete;
- score e fatores;
- observacoes internas selecionadas, se permitido.

Evitar:

- tokens;
- dados pessoais;
- cookies;
- headers;
- payload bruto completo;
- segredos de afiliado.

## Saida recomendada

```text
AiSuggestion
  summary
  titleSuggestion
  hashtags
  riskNotes
  promptVersion
  modelMetadata
  createdAt
```

Saida deve ser sugestao, nao fonte da verdade.

## Guardrails

- Tamanho maximo de input.
- Tamanho maximo de output.
- Rejeitar conteudo inseguro.
- Registrar versao de prompt.
- Permitir descarte humano.
- Nunca atualizar oferta original sem acao explicita.

## Relacao com score

Score permanece:

- numerico;
- deterministico;
- versionado;
- testavel.

IA pode explicar uma oferta em linguagem natural, mas nao deve compor a
pontuacao inicial.

## Relacao com publicacao

IA pode sugerir rascunho futuro. Publicacao exige:

1. oferta aprovada;
2. rascunho revisado;
3. agendamento/publicacao humana ou fluxo aprovado;
4. logs e idempotencia.

## Decisoes adiadas

- Provedor.
- Modelo.
- Custo por geracao.
- Retencao de prompt/output.
- Moderacao.
- Cache de sugestoes.
- Politica de uso de dados.

## Fora da Fase 5A

- OpenAI.
- Claude.
- SDKs.
- Prompts reais.
- UI de edicao de post.
- Geracao automatica.
- Publicacao automatica.
