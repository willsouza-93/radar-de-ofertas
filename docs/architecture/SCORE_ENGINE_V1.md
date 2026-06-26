# Score Engine V1

Status: arquitetura do motor de score futuro. Nao substitui nem implementa
algoritmo nesta fase.

## Objetivo

Evoluir o score deterministico atual para uma arquitetura extensivel, mantendo:

- explicabilidade;
- testes;
- versionamento;
- ausencia de aprovacao automatica;
- compatibilidade com dados incompletos.

## Base atual

A Fase 2 definiu `mvp-v1` com:

- desconto;
- historico de preco;
- comissao;
- completude/confiabilidade manual;
- highlights derivados.

A Fase 5A nao altera pesos nem comportamento existente.

## Criterios possiveis futuros

| Criterio | Uso possivel | Risco |
| --- | --- | --- |
| Preco atual | Comparar atratividade absoluta | Precisa contexto por categoria |
| Desconto | Medir diferenca contra preco anterior | Preco anterior pode ser inflado |
| Marketplace | Sinal de confiabilidade/fonte | Pode enviesar sem dado real |
| Frete | Melhorar conversao estimada | Pode ser regional/contextual |
| Cupom | Aumentar destaque | Cupom pode expirar |
| Categoria | Pesos por segmento | Exige configuracao editorial |
| Seller | Reputacao/confianca | Nem toda fonte fornece |
| Score historico | Aprendizado simples por performance | Depende de analytics futuros |

## Arquitetura recomendada

```text
ScoringInput
  -> Factor calculators
  -> Factor results
  -> Score combiner
  -> Highlight derivation
  -> Score audit payload
```

### Factor calculators

Cada fator deve:

- receber input normalizado;
- retornar pontos, maximo e motivo;
- ser deterministico;
- tratar ausencia explicitamente;
- nao acessar rede externa;
- nao escrever no banco.

### Score combiner

Responsavel por:

- somar fatores;
- limitar range `0..100`;
- arredondar;
- registrar `scoreVersion`;
- garantir que pesos somem conforme versao.

### Highlight derivation

Highlights sao derivados de dados persistidos:

- menor preco;
- cupom;
- frete gratis;
- alta comissao.

Fases futuras podem adicionar highlights, mas isso deve exigir migracao/contrato
quando impactar enum persistido.

## Versionamento

Cada versao deve declarar:

- `scoreVersion`;
- fatores;
- pesos;
- thresholds;
- campos de entrada;
- formato de `score_factors`;
- regra de migracao/recalculo.

Mudanca de peso ou semantica cria nova versao.

## Tratamento de dados ausentes

Regra mantida:

- fator ausente vale zero;
- nao redistribuir peso;
- `score_factors` explica o motivo;
- dados ausentes podem gerar warnings para curadoria.

## Relacao com conectores

Conectores podem fornecer sinais, mas nao pontos.

Exemplo:

- conector informa `freeShipping = true`;
- score decide se isso vira highlight ou pontos.

## Relacao com IA futura

IA nao deve alterar score numerico na primeira etapa. Se houver enriquecimento
futuro, ele deve produzir sugestoes editoriais separadas do score deterministico.

## Testes futuros

- Mesma entrada gera mesmo score.
- Versao antiga nao muda resultado sem recalculo explicito.
- Fator ausente vale zero.
- Campos invalidos sao rejeitados antes do score.
- Score nao altera status de curadoria.
- Score nao cria publicacao.

## Fora da Fase 5A

- Novo algoritmo.
- Novos pesos.
- Machine learning.
- IA.
- Score dinamico por marketplace.
- Recalculo em lote.
