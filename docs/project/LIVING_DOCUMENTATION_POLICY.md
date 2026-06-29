# Living Documentation Policy

Status: politica permanente para documentos em `docs/project`.

## Objetivo

Toda documentacao localizada em:

```text
docs/project/
```

e considerada documentacao viva.

Ela deve refletir sempre o estado mais recente do projeto na branch principal
`main`. Ela nunca deve representar apenas a fase em que foi criada.

## Politica

Toda implementacao futura deve avaliar obrigatoriamente se algum documento em
`docs/project/` precisa ser atualizado.

Caso uma mudanca arquitetural, funcional, operacional, de processo ou de
engenharia torne algum documento permanente desatualizado, esse documento deve
ser atualizado antes do merge.

Toda fase podera alterar, quando necessario:

- [CODEX_PROJECT_CONTEXT.md](CODEX_PROJECT_CONTEXT.md)
- [ARCHITECTURE_PRINCIPLES.md](ARCHITECTURE_PRINCIPLES.md)
- [ENGINEERING_GUIDELINES.md](ENGINEERING_GUIDELINES.md)
- [CODEX_HANDOFF.md](CODEX_HANDOFF.md)
- [PROJECT_GLOSSARY.md](PROJECT_GLOSSARY.md)
- [DECISION_INDEX.md](DECISION_INDEX.md)
- [PROJECT_STATE.md](PROJECT_STATE.md)

## Regra pratica

Antes de commitar, responder:

```text
Alguma pessoa ou nova sessao Codex ficaria desinformada se lesse docs/project
apos esta mudanca?
```

Se a resposta for sim, atualizar `docs/project/` no mesmo PR.

## O que nao fazer

- Nao transformar `docs/project/` em changelog detalhado.
- Nao duplicar especificacoes de fase quando um link resolver melhor.
- Nao criar snapshots versionados por padrao.
- Nao deixar nomes de arquivo sugerindo estado antigo, como
  `CODEX_HANDOFF_v0.6.md`, para documentos que devem ser lidos como atuais.

## Historico

O historico desses documentos deve ser preservado pelo Git, PRs e tags. Criar
arquivos em `docs/project/archive/` somente quando houver valor real em manter
um snapshot legivel fora do historico Git.
