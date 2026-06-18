# Estrategia de seed da Fase 2

Status: dados locais/teste para Fase 2B.

## Principios

- Seeds de fixture ficam restritos a local/teste.
- Supabase staging nao recebe usuarios/senhas genericas.
- Dados devem ser deterministas e idempotentes.
- Criar pelo menos dois workspaces em teste para validar isolamento.
- Public Visitor nao tem seed, conta, profile ou membership.
- Nenhum secret, token, service role ou credencial real em seed.

## Categorias locais

Criar categorias aprovadas pelo produto:

- Pet
- Mercado
- Tecnologia
- Casa
- Automotivo
- Gamer
- Bebes
- Eletrodomesticos

Cada categoria deve ter:

- `name`
- `slug`
- `color`
- `is_active = true`

## Tags locais

Tags simples para filtros e relacao N:N:

- `cupom`
- `frete-gratis`
- `menor-preco`
- `alta-comissao`
- `black-friday`
- `achadinho`

Tags nao devem representar automacoes ou regras futuras.

## Ofertas locais

Criar ofertas cobrindo:

1. Oferta com desconto alto, cupom, frete gratis e alta comissao.
2. Oferta sem historico anterior.
3. Oferta com preco atual acima do menor preco anterior.
4. Oferta sem comissao.
5. Oferta sem imagem.
6. Oferta com marketplace `manual`.
7. Oferta classificada como `mercado_livre`, sem API real.
8. Oferta classificada como `shopee`, sem API real.

Todas ficam com `status = captured`.

## Snapshots locais

Criar snapshots para validar:

- menor preco anterior;
- preco atual igual ao menor preco;
- preco acima do menor preco;
- cupom alterado;
- frete gratis alterado;
- ausencia de snapshot anterior.

## Multi-workspace

Workspace A:

- Admin A.
- Editor A.
- Usuario suspenso A.
- categorias, tags, ofertas e snapshots principais.

Workspace B:

- Admin B.
- categorias, tags, ofertas e snapshots proprios.

Objetivo: provar que Admin A/Editor A nao acessam dados do Workspace B.

## Cenarios negativos

Seeds/testes devem tentar criar ou validar bloqueio de:

- categoria duplicada por slug no mesmo workspace;
- tag duplicada por slug no mesmo workspace;
- oferta duplicada por `(workspace_id, marketplace, external_id)`;
- oferta com categoria de outro workspace;
- `offer_tags` com tag de outro workspace;
- snapshot de oferta de outro workspace;
- URL `javascript:`, `data:`, `file:` ou sem protocolo;
- preco negativo;
- `currency` diferente de `BRL`;
- score fora de `0..100`.

## Staging

Nao aplicar seeds de fixture automaticamente em staging.

Se for necessario validar dados integrados em staging:

1. Usar identidades nominais do projeto.
2. Criar dados manualmente pela aplicacao ou script controlado.
3. Nunca usar senhas genericas.
4. Registrar quem executou, quando e com qual objetivo.
5. Limpar dados somente com confirmacao explicita.

## Criterios de aceite

- Seed local roda mais de uma vez sem duplicar dados.
- Testes conseguem localizar dados por slugs/ids estaveis.
- Dois workspaces existem para RLS.
- Todos os highlights do score sao exercitados.
- Nenhum dado de fixture depende de integracao externa.
