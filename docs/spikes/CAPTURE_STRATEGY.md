# Estrategia de entrada do MVP

## Objetivo

Escolher a menor entrada capaz de validar:

`Captura -> Curadoria -> Aprovacao -> Agendamento -> Publicacao`

sem depender de APIs externas.

## Premissas

- Entrada manual e obrigatoria na arquitetura aprovada.
- Admin e o unico papel que cria/altera oferta via UI.
- Campos minimos: origem/marketplace, external ID estavel, titulo, URL fonte,
  link afiliado, preco atual e data de captura.
- Dados opcionais ausentes valem zero ou nao geram highlight no score.
- Deduplicacao usa marketplace/origem + external ID.

## Comparacao

| Criterio | A: Cadastro manual individual | B: Importacao CSV | C: Importacao JSON |
|---|---|---|---|
| Complexidade | Baixa | Media | Media/alta |
| Tempo de implementacao | Curto | Medio | Medio |
| Experiencia do usuario | Boa para baixo volume; cansativa em lote | Boa para planilhas/lotes; exige feedback de erros | Fraca para usuario comum; boa para integracao tecnica |
| Risco | Baixo | Medio: encoding, colunas e erros parciais | Medio/alto: payloads arbitrarios e suporte |
| Escalabilidade operacional | Baixa | Media/alta | Alta para sistemas, baixa para humanos |
| Deduplicacao | Simples e imediata | Necessita preview/resultado por linha | Necessita validacao de schema e resultado por item |
| Auditoria | Clara por registro | Exige job/import ID | Exige job/import ID |
| Dependencia externa | Nenhuma | Ferramenta de planilha apenas | Cliente tecnico/arquivo |

## Opcao A - Cadastro manual individual

### Escopo

Formulario Admin com os campos minimos e opcionais aprovados. Ao salvar, o
sistema normaliza, deduplica, cria snapshot e calcula score.

### Vantagens

- Valida o fluxo fim a fim com menor custo.
- Feedback e correcao de erro imediatos.
- Nao exige parser, processamento em lote ou UX nova de importacao.
- Serve como fallback permanente para APIs indisponiveis.

### Limites

- Nao atende volume alto.
- Pode gerar erro humano.
- External ID precisa de orientacao clara.

### Estimativa relativa

**Menor entre as opcoes.** Nao definir prazo numerico antes do planejamento da
Fase 2.

## Opcao B - Importacao CSV

### Escopo

Upload de template versionado, preview, validacao por linha, resultado parcial e
relatorio de erros.

### Vantagens

- Familiar para operacao e planilhas.
- Boa evolucao para dezenas/centenas de ofertas.
- Facilita transicao enquanto APIs externas nao existem.

### Limites

- Exige decisoes de encoding, separador, decimal, headers e tamanho.
- Necessita UX/contratos adicionais de preview e erro por linha.
- Pode criar duplicidade ou importar dados ruins sem validacao cuidadosa.

### Estimativa relativa

**Media**, significativamente maior que cadastro individual.

## Opcao C - Importacao JSON

### Escopo

Arquivo/payload aderente ao contrato interno normalizado.

### Vantagens

- Bom para integracoes tecnicas e automacao futura.
- Tipos e estrutura mais ricos que CSV.
- Proximo do contrato dos adapters.

### Limites

- Ruim para operacao nao tecnica.
- Exige schema versionado, limites e tratamento de payload hostil.
- Pode antecipar complexidade de API/conector sem validar necessidade.

### Estimativa relativa

**Media**, mas com maior custo de suporte operacional.

## Recomendacao

### Estrategia MVP

**Opcao A: cadastro manual individual.**

Justificativa:

- E suficiente para validar o fluxo principal.
- Remove marketplaces como bloqueadores.
- Menor custo e risco.
- Ja esta aprovada como entrada obrigatoria.

O template de dados e o contrato interno devem ser definidos na Fase 2, sem
implementar importacao ainda.

### Estrategia pÃ³s-MVP

1. **CSV** como primeira evolucao operacional se o volume manual se tornar
   gargalo.
2. **JSON** como contrato de adapters/importacao tecnica quando houver conector
   oficial ou integracao interna real.
3. Conectores oficiais apenas apÃ³s Go dos spikes externos.

## Gate de sucesso

- Admin consegue cadastrar uma oferta legitima completa.
- Oferta duplicada e atualizada, nao recriada.
- Preco gera snapshot.
- Score e highlights sao calculados.
- Oferta segue para curadoria sem depender de API externa.
