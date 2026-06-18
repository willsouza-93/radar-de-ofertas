# Matriz de testes da Fase 2

Status: plano obrigatorio para Fase 2B.

## Score

| Cenario | Esperado |
| --- | --- |
| Desconto ausente | Fator desconto = 0 |
| Historico ausente | Fator historico = 0 |
| Comissao ausente | Fator comissao = 0 |
| Todos os fatores presentes | Score soma fatores e fica 0..100 |
| Mesmo input duas vezes | Mesmo score e mesmos highlights |
| Preco atual menor que menor preco anterior | `lowest_price` |
| Cupom preenchido | `coupon` |
| Frete gratis true | `free_shipping` |
| Comissao >= 8 | `high_commission` |
| Nova versao futura | Nao altera resultados `mvp-v1` sem recalculo explicito |

## Normalizacao

| Cenario | Esperado |
| --- | --- |
| Strings com espacos | Trim aplicado |
| URL HTTP/HTTPS | Aceita |
| URL `javascript:` | `VALIDATION_ERROR` |
| URL `data:` ou `file:` | `VALIDATION_ERROR` |
| Preco `"129,90"` | Normalizado ou rejeitado conforme parser aprovado |
| Preco negativo | `VALIDATION_ERROR` |
| Currency ausente | `BRL` |
| Currency diferente de `BRL` | Rejeitado na Fase 2 |
| `discount_percent` divergente | Servidor recalcula quando possivel |
| Campo extra no payload | Ignorado ou rejeitado por Zod estrito, conforme decisao da Fase 2B |

## Deduplicacao

| Cenario | Esperado |
| --- | --- |
| Mesma `(workspace, marketplace, external_id)` | Atualiza oferta existente |
| Mesmo source URL sem externalId | Usa dedupe key derivada e atualiza existente |
| Mesmo externalId em outro workspace | Cria/atualiza somente no outro workspace |
| Mudanca de titulo sem mudanca de preco | Atualiza oferta sem snapshot |
| Mudanca de preco | Atualiza oferta e cria snapshot |
| Conflito ambiguo de chave | `DUPLICATE_CONFLICT` |

## Snapshots

| Cenario | Esperado |
| --- | --- |
| Primeira captura valida | Cria snapshot inicial |
| Recaptura com mesmo preco/sinais | Nao cria snapshot redundante |
| Novo preco | Cria snapshot |
| Cupom muda | Cria snapshot |
| Frete muda | Cria snapshot |
| Snapshot update/delete pelo cliente | Bloqueado |

## Filtros

| Filtro | Esperado |
| --- | --- |
| marketplace | Retorna somente marketplace solicitado |
| categoryId | Retorna categoria do workspace |
| tagId | Retorna ofertas com tag do workspace |
| minScore | Retorna score >= minimo |
| minDiscount | Retorna desconto >= minimo |
| from/to | Filtra `captured_at` |
| sort score_desc | Ordena score desc |
| sort captured_desc | Ordena captura desc |
| sort discount_desc | Ordena desconto desc |
| limit > 100 | Rejeita ou limita a 100 |

## URLs e seguranca

- `source_url` e `affiliate_url` aceitam somente HTTP/HTTPS.
- `image_url`, quando informado, aceita somente HTTP/HTTPS.
- URLs invalidas nao chegam ao banco.
- URLs nao sao executadas nem buscadas pelo servidor na Fase 2.
- Erros nao retornam stack, SQL ou detalhes internos.

## RLS e isolamento

| Ator | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| Admin A | Proprio workspace | Permitido conforme tabela | Permitido conforme tabela | Negado, exceto vinculo se aprovado |
| Editor A | Proprio workspace | Negado | Negado | Negado |
| Suspenso A | Negado | Negado | Negado | Negado |
| Admin B | Somente Workspace B | Somente Workspace B | Somente Workspace B | Negado |
| anon | Negado | Negado | Negado | Negado |

Tabelas:

- `categories`
- `tags`
- `offers`
- `offer_tags`
- `price_snapshots`

## Captura manual

- Admin captura oferta valida.
- Editor recebe `FORBIDDEN`.
- Suspenso recebe `FORBIDDEN`.
- Usuario sem membership recebe `FORBIDDEN`.
- Categoria inexistente retorna erro.
- Tag inexistente retorna erro.
- Categoria/tag de outro workspace retorna erro sem vazamento.
- Payload invalido retorna `VALIDATION_ERROR`.

## Banco

- Tabelas possuem RLS habilitado.
- Indices esperados existem.
- Constraints de unique existem.
- Checks monetarios e URL existem.
- `anon` sem grants.
- `authenticated` sem delete amplo.
- `workspace_id` nao pode ser alterado para burlar isolamento.

## Gate

Fase 2B nao deve ser considerada pronta sem:

- Todos os testes unitarios de score passando.
- Testes de captura passando.
- Testes SQL/RLS passando.
- `npx supabase db reset` passando.
- GitHub Actions passando em PR.
