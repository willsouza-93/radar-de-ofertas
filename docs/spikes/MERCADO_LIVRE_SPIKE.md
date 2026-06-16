# Spike Mercado Livre

## Objetivo

Validar captura de ofertas por meios oficiais, sem assumir acesso de afiliados.

## Conclusao

**Go parcial para pesquisa/prototipo de conector oficial; No-Go para assumir o
conector de afiliados no MVP.**

Existe uma plataforma oficial com recursos de itens/pesquisa e OAuth 2.0 para
recursos privados. Nao foi confirmada, nas fontes oficiais consultadas, uma API
especifica para afiliados que forneca link afiliado, comissao ou todos os sinais
necessarios ao Radar.

O MVP deve continuar com cadastro manual. O conector so entra apÃ³s validacao
externa de acesso, termos e programa de afiliados.

## Classificacao por capacidade

| Capacidade | Classificacao | Evidencia/observacao |
|---|---|---|
| API oficial aplicavel a itens | Disponivel agora | Documentacao oficial de Items & Searches |
| Pesquisa de itens ativos | Disponivel agora, com restricoes | Recursos publicos/privados documentados; cobertura exata deve ser testada |
| OAuth 2.0 | Disponivel agora | Authorization Code server-side documentado |
| API especifica para afiliados | Informacao inconclusiva | Necessita validacao externa |
| Geracao/obtencao de link afiliado | Informacao inconclusiva | Necessita validacao externa |
| Preco atual | Disponivel agora, sujeito a teste de campo | Itens/produtos documentam precos; validar endpoint e cobertura |
| Preco anterior | Informacao inconclusiva | Pode depender de promocao/recurso; necessita validacao externa |
| Frete/frete gratis | Disponivel com contexto/restricoes | Recursos de shipping existem; aplicabilidade por item/usuario deve ser testada |
| Comissao de afiliado | Nao confirmada | Necessita validacao externa |
| Cupons | Informacao inconclusiva | Recursos de seller coupon existem, mas uso para curadoria/afiliado nao confirmado |
| Limites quantitativos | Informacao inconclusiva | `429 local_rate_limited` e documentado, valores exatos nao confirmados |
| Uso/armazenamento para curadoria afiliada | Informacao inconclusiva | Validar ToS e programa |

## Autenticacao

- Recursos privados usam OAuth 2.0 Authorization Code, server-side.
- Access token deve ser enviado via header Bearer.
- A documentacao consultada informa access token com validade de 6 horas e
  refresh token de uso unico, substituido a cada renovacao.
- Recursos publicos e privados diferem; a cobertura necessaria deve ser provada.
- Credenciais/tokens devem permanecer server-only.

## Dados potencialmente obtiveis

Confirmados em nivel de plataforma oficial:

- Identificador/listagem.
- Titulo e dados de item.
- Preco atual em recursos de itens/produtos.
- Pesquisa/listagem de itens ativos.
- Recursos relacionados a shipping e promocao existem.

Nao confirmados para o caso de uso de afiliados:

- Link afiliado.
- Comissao.
- Cupom aplicavel a qualquer comprador.
- Preco anterior consistente.
- Frete gratis contextual para o consumidor final.
- Pesquisa ampla de "melhores ofertas" sem seller/category conhecido.

## Restricoes e riscos

- Documentacao parece fortemente orientada a vendedores/integradores.
- OAuth privado pode exigir conta principal/manager e autorizacao.
- Dados de afiliacao podem pertencer a produto/programa separado.
- Campos podem ser contextuais ao usuario, vendedor, regiao ou promocao.
- `429` existe, mas limite numerico precisa de teste/contrato.
- Termos de armazenamento, cache e redistribuicao necessitam validacao externa.
- Scraping nao e alternativa autorizada pelo projeto.

## Checklist

- [ ] Criar/obter acesso oficial de desenvolvedor.
- [ ] Confirmar que o programa de afiliados permite integracao por API.
- [ ] Obter autorizacao/credenciais de teste legitimas.
- [ ] Validar endpoint para item conhecido no Brasil.
- [ ] Validar pesquisa de itens ativos aplicavel ao caso de uso.
- [ ] Mapear campos: ID, titulo, URL, imagem, preco atual e categoria.
- [ ] Verificar preco anterior/promocao.
- [ ] Verificar frete/frete gratis.
- [ ] Verificar cupons.
- [ ] Verificar comissao e link afiliado.
- [ ] Medir rate limit real sem exceder termos.
- [ ] Validar termos de armazenamento e exibicao.
- [ ] Documentar campos indisponiveis e fallback manual.

## Criterios de sucesso

- Acesso oficial autorizado para o caso de uso.
- Item/oferta pode ser obtido de forma estavel e legal.
- Campos minimos de captura sao obtidos ou complementados manualmente.
- Link afiliado pode ser obtido/fornecido legitimamente.
- Limites e termos permitem o volume MVP.
- Falha do conector nao bloqueia cadastro manual.

## Criterios de falha

- Programa de afiliados nao permite API ou armazenamento necessario.
- Nao existe forma oficial de obter/associar link afiliado.
- Acesso depende de scraping/workaround.
- Limites/termos inviabilizam operacao.
- Campos minimos nao podem ser obtidos nem complementados legitimamente.

## Go / No-Go

**Status atual: Go parcial para spike autenticado; No-Go para compromisso de MVP.**

- Conector de producao: **Necessita validacao externa**.
- Entrada manual permanece estrategia MVP e remove esse bloqueador.

## Fontes oficiais

- https://developers.mercadolibre.com.ar/en_us/authentication-and-authorization
- https://developers.mercadolibre.com.ar/en_us/items-and-searches
