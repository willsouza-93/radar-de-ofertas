# Estrategia de score MVP v1

Status: formula deterministica para Fase 2B.

## Objetivo

Ordenar ofertas capturadas manualmente por potencial de curadoria, de forma
explicavel e testavel. O score nunca aprova, agenda, publica ou rejeita nada.

## Versao

- `score_version`: `mvp-v1`
- Range: `0..100`
- Arredondamento: inteiro mais proximo, limitado por `min(max(score, 0), 100)`.
- Persistencia: `score`, `score_version`, `score_factors`, `highlights`.

## Pesos

| Fator | Peso maximo |
| --- | ---: |
| Desconto | 35 |
| Historico de preco | 30 |
| Comissao | 20 |
| Completude/confiabilidade manual | 15 |
| Total | 100 |

Dados ausentes valem zero no fator correspondente. A formula nao repondera
silenciosamente os pontos faltantes.

## Fator: desconto

Entrada:

- `current_price`
- `previous_price`
- `discount_percent`, quando informado ou derivado

Regra:

- Se `previous_price` ausente ou `previous_price <= current_price`: 0.
- Caso contrario, calcular desconto percentual:
  `(previous_price - current_price) / previous_price * 100`.
- Pontuacao: `min(35, discount_percent / 50 * 35)`.

Exemplos:

- 10% de desconto: 7 pontos.
- 25% de desconto: 18 pontos.
- 50% ou mais: 35 pontos.

## Fator: historico de preco

Entrada:

- snapshots anteriores da mesma oferta.
- `current_price`.

Regra:

- Sem snapshot anterior elegivel: 0.
- Se `current_price <= menor_preco_anterior`: 30.
- Se ate 5% acima do menor preco anterior: 20.
- Se ate 10% acima do menor preco anterior: 10.
- Acima disso: 0.

Observacao: o snapshot da captura atual nao deve ser considerado como "anterior"
para calcular este fator.

## Fator: comissao

Entrada:

- `commission_percent`.

Regra:

- Ausente ou 0: 0.
- Maior que 0 e menor que 4%: 4.
- 4% a 7,99%: 8.
- 8% a 11,99%: 14.
- 12% ou mais: 20.

## Fator: completude/confiabilidade manual

Entrada:

- campos obrigatorios validos;
- categoria;
- imagem;
- dado comparativo de preco;
- URL de afiliado parseavel.

Regra:

| Condicao | Pontos |
| --- | ---: |
| Campos obrigatorios validos (`title`, `source_url`, `affiliate_url`, `current_price`) | 6 |
| Categoria informada e ativa | 3 |
| `image_url` HTTP/HTTPS valida | 2 |
| `previous_price` valido ou snapshot anterior existente | 2 |
| `affiliate_url` HTTP/HTTPS parseada com host valido | 2 |

Maximo: 15.

## Highlights

| Highlight | Regra |
| --- | --- |
| `lowest_price` | Existe snapshot anterior e `current_price <= menor_preco_anterior` |
| `coupon` | `coupon_code` preenchido apos trim |
| `free_shipping` | `free_shipping = true` |
| `high_commission` | `commission_percent >= 8` |

Highlights devem ser derivados de dados persistidos e nunca informados
diretamente pelo cliente.

## Tratamento de dados ausentes

- Campo ausente nao invalida score se o contrato permitir ausencia.
- Fator ausente vale zero.
- `score_factors` deve registrar fator com valor zero e motivo legivel.
- Nao redistribuir pontos para outros fatores.
- Score com poucos dados pode ser baixo; isso e esperado no MVP.

## Estrutura sugerida de `score_factors`

```json
{
  "version": "mvp-v1",
  "discount": {
    "points": 18,
    "max": 35,
    "reason": "25.0% de desconto informado/derivado"
  },
  "priceHistory": {
    "points": 30,
    "max": 30,
    "reason": "Preco atual igual ou abaixo do menor preco anterior"
  },
  "commission": {
    "points": 14,
    "max": 20,
    "reason": "Comissao entre 8% e 11.99%"
  },
  "completeness": {
    "points": 13,
    "max": 15,
    "reason": "Oferta com categoria, imagem e URLs validas"
  }
}
```

## Exemplos

### Oferta forte

- Preco atual: 99.90
- Preco anterior: 149.90
- Menor preco anterior: 109.90
- Comissao: 10%
- Categoria e imagem presentes

Resultado esperado:

- Desconto: 23
- Historico: 30
- Comissao: 14
- Completude: 15
- Score: 82
- Highlights: `lowest_price`, `high_commission`

### Oferta com poucos dados

- Preco atual: 79.90
- Sem preco anterior
- Sem snapshots anteriores
- Sem comissao
- Categoria presente

Resultado esperado:

- Desconto: 0
- Historico: 0
- Comissao: 0
- Completude: 11
- Score: 11
- Highlights: nenhum

## Limites

- Score nao mede conversao real.
- Score nao valida termos de marketplace.
- Score nao substitui revisao humana.
- Score nao deve usar IA ou dados externos na Fase 2.
- Pesos so mudam com nova `score_version`.

## Testes obrigatorios

- Score sempre entre 0 e 100.
- Todos os fatores ausentes ficam em zero.
- Nao ha reponderacao.
- Mesma entrada gera mesmo score.
- Highlights corretos por regra.
- `lowest_price` ignora snapshot da captura atual.
- Nova versao futura nao altera resultados historicos sem recalculo explicito.
