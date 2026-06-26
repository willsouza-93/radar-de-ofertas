# Failure Handling

Status: estrategia conceitual para falhas na captura futura. Nao implementa
retry, backoff, circuit breaker ou dead-letter nesta fase.

## Objetivo

Definir como o pipeline deve reagir a falhas externas, dados invalidos,
concorrencia e problemas parciais sem perder historico ou criar duplicidade.

## Classificacao de falhas

| Classe | Exemplo | Recuperavel | Escopo |
| --- | --- | --- | --- |
| Fonte indisponivel | 5xx, DNS, timeout | Sim | Execucao |
| Rate limit | 429, quota excedida | Sim | Execucao |
| Credencial invalida | 401, token revogado | Nao automatico | Conector |
| Contrato alterado | Campo removido | Talvez | Conector |
| Item invalido | URL/preco ruim | Nao para item | Item |
| Conflito dedupe | Duas ofertas candidatas | Nao automatico | Item |
| Score invalido | Resultado inconsistente | Nao para item | Item |
| Persistencia falhou | constraint/RLS inesperada | Talvez | Item/execucao |

## Retry

Retry deve ser usado apenas para falhas transientes:

- timeout;
- 5xx;
- rede;
- rate limit com janela conhecida;
- lock temporario interno.

Nao aplicar retry automatico para:

- credencial invalida;
- contrato externo alterado;
- item invalido;
- conflito de deduplicacao;
- violacao de permissao;
- erro de validacao.

## Backoff

Estrategia recomendada:

```text
attempt 1: immediate or scheduled
attempt 2: +1m plus jitter
attempt 3: +5m plus jitter
attempt 4: +20m plus jitter
```

Respeitar `Retry-After` quando a fonte informar.

## Timeout

Cada execucao deve ter:

- timeout total;
- timeout por chamada externa;
- tamanho maximo de lote;
- deadline propagado ao conector.

Se o prazo terminar:

- parar de buscar novos itens;
- persistir resumo do que foi processado com seguranca;
- marcar execucao como parcial;
- permitir reexecucao idempotente.

## Circuit breaker conceitual

Usar quando uma fonte falha repetidamente.

Estados conceituais:

```text
closed -> open -> half_open -> closed
```

- `closed`: conector opera normalmente.
- `open`: novas capturas automaticas bloqueadas temporariamente.
- `half_open`: teste limitado para verificar recuperacao.

Na primeira versao, isso pode ser manual: operador desabilita conector em caso
de falha recorrente.

## Dead-letter conceitual

Itens que nao podem ser processados apos tentativas seguras devem ir para uma
fila/log de investigacao futura.

Exemplos:

- payload com formato inesperado;
- dedupe conflict;
- FK inconsistente;
- URL que parece produto mas nao passa validacao.

Fase 5A nao cria dead-letter table. Pode ser inicialmente representado em logs
estruturados e resumo da execucao.

## Falhas parciais

Falha de item nao deve falhar o lote inteiro quando:

- o erro e local ao item;
- os demais itens continuam validos;
- nao ha transacao global necessaria.

Falhar lote inteiro quando:

- credencial invalida;
- contrato do conector impossibilita parse;
- workspace/membership invalido;
- banco indisponivel;
- configuracao critica ausente.

## Recuperacao

### Execucao interrompida

1. Identificar `captureRunId`.
2. Verificar itens persistidos.
3. Reexecutar com mesma idempotency key quando seguro.
4. Continuar por cursor/janela se disponivel.

### Conector com credencial invalida

1. Marcar conector como warning/disabled em fase futura.
2. Exigir intervencao Admin.
3. Testar credencial antes de reabilitar.

### Conflito de dedupe

1. Nao fazer merge automatico.
2. Registrar conflito com chaves candidatas.
3. Encaminhar para resolucao manual futura.

### Persistencia parcial

1. Preferir transacao por item.
2. Oferta e snapshot devem manter consistencia.
3. Se `approval_queue` falhar, oferta capturada pode permanecer sem fila e ser
   reconciliada em operacao futura.

## Runbook minimo futuro

- Verificar ultimas capturas por conector.
- Ver taxa de invalidos.
- Ver erros de credencial.
- Ver conflitos de dedupe.
- Reexecutar captura manualmente com limite pequeno.
- Desabilitar conector problematico.
- Reativar apos teste de leitura.

## Fora da Fase 5A

- Implementar retries.
- Criar circuit breaker real.
- Criar dead-letter table.
- Criar scheduler.
- Criar painel operacional.
