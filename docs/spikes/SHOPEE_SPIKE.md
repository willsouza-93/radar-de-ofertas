# Spike Shopee

## Objetivo

Validar captura de ofertas Shopee por meios oficiais, sem assumir acesso de
afiliados ou Open Platform.

## Conclusao

**No-Go para conector no MVP ate validacao externa.**

Nao foi possivel confirmar, por documentacao oficial publica acessivel durante
esta Fase 0, um contrato aplicavel ao Radar de Ofertas no Brasil que entregue os
dados e permissoes necessarios. A existencia, elegibilidade e escopo de qualquer
Open Platform/API de afiliados para este caso devem ser confirmados diretamente
com a Shopee.

## Classificacao por capacidade

| Capacidade | Classificacao | Observacao |
|---|---|---|
| API oficial aplicavel ao Radar no Brasil | Incerto | Necessita validacao externa |
| API especifica para afiliados | Incerto | Necessita validacao externa |
| Processo de aprovacao/acesso | Necessita aprovacao/Incerto | Necessita validacao externa |
| Autenticacao | Incerto | Nao assumir mecanismo |
| Pesquisa/captura de ofertas | Incerto | Necessita validacao externa |
| Preco atual | Incerto | Necessita validacao externa |
| Preco anterior | Incerto | Necessita validacao externa |
| Frete/frete gratis | Incerto | Necessita validacao externa |
| Comissao | Incerto | Necessita validacao externa |
| Cupons | Incerto | Necessita validacao externa |
| Link afiliado | Incerto | Necessita validacao externa |
| Rate limits | Incerto | Necessita validacao externa |
| Termos de armazenamento/exibicao | Incerto | Necessita validacao externa |

## Estrategia de validacao externa

1. Identificar canal oficial do programa de afiliados Shopee Brasil.
2. Solicitar confirmacao escrita de API/feed aplicavel.
3. Solicitar documentacao, requisitos de aprovacao e termos.
4. Confirmar se a API permite uso por ferramenta interna de curadoria.
5. Confirmar campos, limites, retencao e geracao de links.
6. Somente apÃ³s isso executar teste autenticado.

## Dados minimos exigidos para Go

- Identificador estavel.
- Titulo.
- URL fonte.
- Link afiliado legitimo.
- Preco atual.
- Imagem opcional.
- Timestamp de captura.

Preco anterior, frete, cupom e comissao melhoram o score, mas podem ser
complementados manualmente ou valer zero conforme arquitetura aprovada.

## Restricoes e riscos

- Acesso pode exigir aprovacao comercial.
- API de sellers e API de afiliados, se existirem, podem ter escopos distintos.
- Links podem expirar ou exigir geracao contextual.
- Campos podem variar por conta/regiao/campanha.
- Termos podem proibir armazenamento ou redistribuicao.
- Scraping/workaround nao e permitido no MVP.

## Checklist

- [ ] Identificar contato oficial Shopee Brasil.
- [ ] Confirmar existencia de API/feed para afiliados.
- [ ] Obter documentacao oficial e termos.
- [ ] Confirmar elegibilidade/aprovacao.
- [ ] Confirmar autenticacao e gestao de segredos.
- [ ] Confirmar campos minimos.
- [ ] Confirmar comissao, cupons e frete.
- [ ] Confirmar rate limits.
- [ ] Confirmar armazenamento/cache/exibicao.
- [ ] Executar teste autenticado autorizado.
- [ ] Documentar fallback manual.

## Criterios de sucesso

- Acesso oficial autorizado e documentado.
- Campos minimos disponiveis ou complementaveis manualmente.
- Link afiliado legitimo e estavel.
- Termos e limites compatÃ­veis com o MVP.
- Credenciais podem ser protegidas server-side.

## Criterios de falha

- Nenhuma API/feed oficial aplicavel.
- Acesso negado ou inviavel.
- Dependencia de scraping/workaround.
- Termos impedem uso/armazenamento.
- Link afiliado nao pode ser associado legitimamente.

## Go / No-Go

**Status atual: No-Go para conector MVP.**

O cadastro manual de ofertas Shopee continua permitido quando os dados e links
forem obtidos legitimamente pelo Admin. Reavaliar no pÃ³s-MVP apÃ³s validacao
externa oficial.

## Fonte oficial

- Portal oficial potencial: https://open.shopee.com/

O conteudo necessario nao pÃ´de ser confirmado de forma publica nesta Fase 0.
**Necessita validacao externa.**
