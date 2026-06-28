# Publication Policy

Status: especificacao arquitetural. Sem implementacao.

## Objetivo

Definir politicas que controlam se, quando e como uma oferta aprovada pode
entrar no pipeline de publicacao.

## Politicas iniciais

### Cooldown

Evita republicar a mesma oferta em uma janela curta.

Entradas:

- workspace;
- offer;
- target;
- ultimo sucesso;
- ultima tentativa;
- reentrada editorial.

Saidas:

- permitido;
- bloqueado ate data/hora;
- exige revisao manual.

### Limite por canal

Evita sobrecarga ou comportamento parecido com spam.

Exemplos:

- maximo de publicacoes por hora;
- maximo por dia;
- maximo por categoria;
- maximo por workspace/canal.

### Horarios permitidos

Controla janelas de envio por workspace.

Exemplo futuro:

```text
America/Sao_Paulo
segunda a sexta: 08:00 - 22:00
sabado/domingo: 09:00 - 20:00
```

### Prioridade

Define ordenacao de candidates/jobs.

Sinais possiveis:

- score;
- desconto;
- menor preco;
- alta comissao;
- recencia;
- decisao manual.

### Duplicidade

Impede criar multiplos jobs equivalentes.

Chave conceitual:

```text
publication:<workspaceId>:<offerId>:<targetId>:<contentVersion>
```

### Publicacao manual

Acao humana explicita pode criar candidate/job, respeitando:

- oferta aprovada;
- idempotencia;
- target habilitado;
- permissionamento.

### Publicacao automatica

Fica para fase futura e deve ser habilitada por feature flag e politica de
workspace. Mesmo automatica, nao pode publicar oferta sem aprovacao humana.

## Resultado de politica

```text
PolicyDecision
  allowed
  reason
  blockedUntil?
  warnings[]
```

## Fora da Fase 6A

- modelo de banco;
- horarios configuraveis;
- scheduler;
- execucao automatica.
