# Demo Dataset

Status: dataset local de demonstracao para validacao funcional da UI.

## Objetivo

`supabase/demo_seed.sql` cria um conjunto rico de dados para validar a Fase 4B
sem alterar schema, migrations, RLS, funcoes, contracts ou o seed principal.

O arquivo e exclusivo para uso local/demo. Nao aplicar em staging ou producao.

## Como usar localmente

1. Restaurar o banco local com o seed principal:

```powershell
npx.cmd supabase db reset
```

2. Rodar testes de banco antes da demo seed, pois a suite pgTAP atual valida
   contagens fixas do seed principal:

```powershell
npx.cmd supabase test db
```

3. Aplicar o dataset demo local:

```powershell
npx.cmd supabase db query --file supabase/demo_seed.sql
```

Se a versao local da CLI nao suportar `--file`, executar o SQL via Studio local
ou `psql` apontando para o banco local Supabase.

Observacao: apos aplicar `demo_seed.sql`, os testes pgTAP de contagem base nao
devem ser usados como validacao de regressao, porque o dataset demo adiciona
mais ofertas, snapshots e itens de curadoria ao workspace local.

## Quantidades geradas

- Categorias demo: 10.
- Tags demo: 20.
- Ofertas demo: 64.
- Snapshots: 96, sendo 64 snapshots atuais e 32 snapshots historicos extras.
- Fila de curadoria: 64 itens.
- Decisoes: 50.
- Notas: 64.

## Distribuicao de curadoria

- Pendentes: 14.
- Aprovadas: 25.
- Rejeitadas: 25.

As ofertas pendentes alimentam o Dashboard e a fila principal de Curadoria.
As aprovadas e rejeitadas permitem validar tabs, historico e estados terminais.

## Categorias

- Tecnologia
- Informatica
- Perifericos
- Eletrodomesticos
- Games
- Casa
- Escritorio
- Audio
- Smart Home
- Mercado

## Tags

Inclui cenarios de oportunidade e revisao:

- Menor preco
- Cupom validado
- Frete gratis
- Alta comissao
- Custo-beneficio
- Volta as aulas
- Setup gamer
- Home office
- Casa inteligente
- Oferta relampago
- Preco suspeito
- Revisar duplicidade
- Excelente desconto
- Baixo estoque
- Produto premium
- Entrada manual
- Shopee
- Mercado Livre
- Pix desconto
- Validacao UX

## Distribuicao de ofertas

O dataset cobre:

- scores baixos, medios e altos;
- descontos baixos, medios e altos;
- marketplaces `manual`, `mercado_livre` e `shopee`;
- categorias e tags variadas;
- ofertas com e sem cupom;
- ofertas com e sem frete gratis;
- ofertas com alta e baixa comissao;
- produtos plausiveis de eletronicos, informatica, perifericos, casa,
  escritorio, games e eletrodomesticos.

## Objetivos de validacao por tela

### Dashboard

Garante pendencias suficientes para preencher:

- lista "Requer sua atencao";
- melhores ofertas por score;
- resumo operacional;
- badge de pendencias na navegacao.

### Ofertas

Permite validar:

- tabela desktop;
- cards mobile;
- filtros por busca, marketplace, categoria, tag, score e desconto;
- ordenacao;
- detalhe da oferta;
- historico de preco.

### Curadoria

Permite validar:

- tabs Pendentes, Aprovadas e Rejeitadas;
- filtros preservando status;
- detalhe pendente com nota e decisoes;
- detalhe terminal sem acoes de mutacao;
- historico com notas e decisoes;
- mensagens de aprovacao/rejeicao e motivos variados.

## Idempotencia e isolamento

O seed usa IDs deterministicas com prefixos reservados:

- categorias: `c0000000-*`
- tags: `d0000000-*`
- ofertas: `e0000000-*`
- filas: `f0000000-*`
- decisoes: `a1000000-*`
- notas: `a2000000-*`

Ao rodar novamente, o script remove somente os registros demo com esses prefixos
e recria o dataset. Ele nao altera `supabase/seed.sql`.

## Seguranca

- Nao contem secrets.
- Nao cria usuarios novos.
- Usa o workspace local `Radar de Ofertas` criado pelo seed principal.
- Nao deve ser aplicado em staging/producao.
