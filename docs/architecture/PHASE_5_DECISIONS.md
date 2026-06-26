# Phase 5 Decisions

Status: decisoes arquiteturais registradas para a Fase 5A.

## Decisoes tomadas

### 1. Captura como pipeline separado de curadoria

Decisao: captura termina em `offers`, `price_snapshots` e, quando aplicavel em
fase futura, `approval_queue.pending`.

Motivo: preservar aprovacao humana obrigatoria e evitar que integracoes externas
contornem o fluxo editorial.

### 2. Core baseado em contrato generico de conector

Decisao: o core deve consumir `RawOffer`/`NormalizedOffer`, nao SDKs ou modelos
de marketplaces especificos.

Motivo: adicionar novos marketplaces sem alterar regras centrais.

### 3. Integracoes oficiais continuam preferidas

Decisao: APIs/feed oficiais ou importacao estruturada precedem qualquer outro
caminho.

Motivo: reduzir risco legal, operacional e de manutencao.

### 4. Scraping continua fora do escopo

Decisao: scraping nao deve ser dependencia do pipeline.

Motivo: risco de termos de uso, instabilidade, bloqueio e custo oculto.

### 5. Deduplicacao prioriza external ID e URL canonica

Decisao: usar identidade externa confiavel primeiro; fallback por URL fonte
canonica com hash.

Motivo: compatibilidade com a implementacao atual e menor risco de merge
indevido.

### 6. Affiliate URL nao e identidade primaria

Decisao: `affiliate_url` e dado de destino/monetizacao, nao chave de dedupe.

Motivo: links de afiliado podem variar por campanha, usuario, tag ou canal.

### 7. Score permanece deterministico

Decisao: Fase 5 nao introduz ML/IA no score.

Motivo: manter explicabilidade e testabilidade.

### 8. Observabilidade com correlation ID

Decisao: toda execucao futura deve ter correlation ID e logs estruturados.

Motivo: diagnosticar falhas sem depender de reproducoes manuais.

### 9. Publicacao futura fica desacoplada

Decisao: pipeline de publicacao consome apenas ofertas aprovadas.

Motivo: captura nao deve ter poder editorial.

### 10. IA futura como enriquecimento, nao decisao

Decisao: IA pode sugerir texto, mas nao aprovar, publicar ou pontuar na primeira
etapa.

Motivo: reduzir risco de automacao indevida e manter controle humano.

## Alternativas descartadas

### Conectores acoplados ao core

Descartado porque cada marketplace traria regras, campos e SDKs para o dominio
central.

### Criar scheduler na Fase 5A

Descartado porque a fase e 100% arquitetural.

### Criar tabelas de capture runs agora

Descartado porque ainda nao ha conector real nem volume operacional validado.

### Usar IA para ranquear ofertas

Descartado porque o score atual ja resolve o MVP com explicabilidade.

### Publicar automaticamente apos score alto

Descartado porque viola aprovacao humana obrigatoria.

## Tradeoffs

| Decisao | Beneficio | Custo |
| --- | --- | --- |
| Contrato generico | Menor acoplamento | Mais desenho antes do primeiro conector |
| External ID primeiro | Menos duplicidade | Depende da qualidade da fonte |
| URL canonica fallback | Funciona sem ID oficial | Risco de colisao/falso merge |
| Sem scheduler agora | Menor risco | Captura real ainda manual no inicio |
| Sem IA agora | Mais controle | Menos automacao editorial |

## Riscos

- APIs oficiais podem nao fornecer dados suficientes.
- Alguns marketplaces podem nao permitir uso/armazenamento esperado.
- URL canonica pode ser insuficiente para variacoes complexas.
- Sem tabela de execucao, a primeira implementacao precisa decidir nivel de
  auditoria.
- Enum atual de marketplace pode exigir evolucao para fontes genericas.

## Decisoes adiadas

- Primeiro marketplace real.
- Modelo fisico de `connectors`.
- Modelo fisico de `capture_runs`.
- Scheduler escolhido.
- Retencao de payload bruto.
- Politica para ofertas aprovadas que mudam de preco.
- Provedor/modelo de IA.
- Modelo de publicacao e posts.
