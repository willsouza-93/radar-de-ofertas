# Phase 6 Roadmap

Status: proposta arquitetural. Nao implementa codigo.

## Objetivo

Definir uma sequencia MVP-first para evoluir de oferta aprovada ate publicacao
controlada, preservando simplicidade e seguranca.

## Sequencia recomendada

### 6B - Publication Domain Implementation

Implementar dominio interno, contratos, policies, templates conceituais
simples, jobs e historico minimo.

Nao implementar publisher real ainda.

### 6C - Telegram Publisher

Implementar primeiro publisher real usando Telegram como adapter.

Objetivo:

- validar contrato `Publisher`;
- validar idempotencia;
- validar failure handling;
- validar observabilidade.

### 6D - Connector Registry

Formalizar registry de conectores/publishers habilitados por workspace e
feature flags operacionais.

Justificativa: depois do primeiro publisher real, o produto precisa controlar
capacidades ativas sem acoplar o core.

### 6E - Marketplace Connector

Adicionar primeiro conector de marketplace aprovado por spike e termos.

Justificativa: publicacao real ganha valor maior quando ha entrada recorrente
de ofertas.

### 6F - Scheduler

Adicionar execucao agendada apenas depois de captura, curadoria e publicacao
manual estarem estaveis.

### 7A - AI Enrichment

Adicionar enriquecimento/geracao assistida somente apos fluxo manual e
publicacao controlada estarem validados.

## Ordem alternativa considerada

Scheduler antes de Telegram foi rejeitado porque aumentaria risco operacional
sem validar o principal contrato externo de publicacao.

IA antes de publicacao foi rejeitada porque melhoraria texto, mas nao validaria
o caminho de valor principal: oferta aprovada chegando ao canal.

## Gates sugeridos

- 6B pronto: dominio testado sem canal real.
- 6C pronto: Telegram publica com idempotencia e retry seguro.
- 6D pronto: flags/registry controlam capacidades.
- 6E pronto: conector real alimenta curadoria sem quebrar fluxo manual.
- 6F pronto: scheduler opera sem duplicidade.
