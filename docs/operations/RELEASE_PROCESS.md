# Release Process

Este projeto usa um fluxo de release semi-automatico baseado em tags Git.

O objetivo e criar GitHub Releases rastreaveis sem executar deploy, migrations,
seeds, alteracoes em secrets ou qualquer operacao de ambiente.

## Como criar uma tag local

1. Garanta que a branch principal esta atualizada:

```bash
git checkout main
git pull origin main
```

2. Confira o ultimo commit:

```bash
git log -1 --oneline
```

3. Crie uma tag anotada no formato `vMAJOR.MINOR.PATCH`:

```bash
git tag -a v0.2.0 -m "v0.2.0"
```

Use sempre tags anotadas para releases publicas do projeto.

## Como enviar a tag

Envie a tag para o GitHub:

```bash
git push origin v0.2.0
```

O workflow `.github/workflows/release.yml` sera acionado automaticamente quando a
tag enviada seguir o padrao `v*.*.*`.

## Como o workflow cria a GitHub Release

Quando uma tag `v*.*.*` e enviada:

1. O GitHub Actions inicia o workflow `Release`.
2. O job valida o formato exato da tag com regex:

```text
^v[0-9]+\.[0-9]+\.[0-9]+$
```

3. O job procura um changelog do projeto para complementar as notas:

- `docs/architecture/CHANGELOG_FASE_<minor>.md`
- `docs/operations/CHANGELOG_FASE_<minor>.md`
- `docs/operations/CHANGELOG_FASE_<minor>C.md`
- `CHANGELOG.md`

4. O job cria a GitHub Release usando:

```bash
gh release create
```

5. As notas automaticas sao geradas pelo GitHub a partir dos commits e PRs
   disponiveis.
6. O changelog do projeto, quando encontrado, e adicionado como contexto no
   inicio das release notes.

O workflow usa apenas o `GITHUB_TOKEN` padrao do GitHub Actions, por meio de:

```yaml
permissions:
  contents: write
```

Nenhum secret adicional e necessario.

## Como corrigir uma tag criada por engano

Se a tag foi criada localmente, mas ainda nao foi enviada:

```bash
git tag -d v0.2.0
```

Se a tag ja foi enviada e a GitHub Release ainda nao deve existir:

1. Remova ou edite a GitHub Release manualmente na interface do GitHub.
2. Remova a tag remota:

```bash
git push origin :refs/tags/v0.2.0
```

3. Remova a tag local:

```bash
git tag -d v0.2.0
```

4. Crie a tag correta e envie novamente.

Importante: nao reaproveite uma tag ja publicada para apontar para outro commit
sem alinhamento explicito. Tags de release devem ser tratadas como registros
historicos.

## Como nomear versoes

Padrao:

- `v0.1.0`: Fase 1.
- `v0.2.0`: Fase 2.
- `v0.3.0`: Fase 3.
- `v1.0.0`: primeiro fluxo completo utilizavel.

Use patch versions para correcoes dentro da mesma fase:

- `v0.2.1`: correcao pequena apos `v0.2.0`.
- `v0.2.2`: segunda correcao da Fase 2.

## Quando usar prerelease

Versoes `v0.x.x` sao consideradas prerelease automaticamente pelo workflow.

Use `v0.x.x` enquanto o produto ainda estiver em validacao MVP e sem o primeiro
fluxo completo utilizavel em producao.

Use `v1.0.0` somente quando o fluxo essencial estiver pronto e validado de ponta
a ponta.

## O que nunca deve acontecer em release

O workflow de release nunca deve:

- aplicar migration;
- alterar secrets;
- fazer deploy;
- publicar dados;
- rodar operacao destrutiva;
- alterar Supabase;
- alterar Vercel;
- publicar pacote npm;
- iniciar jobs, schedulers ou integracoes externas.

Release neste projeto e apenas um artefato de comunicacao e rastreabilidade no
GitHub.

## Como testar o workflow

Teste recomendado em uma versao patch de prerelease:

```bash
git checkout main
git pull origin main
git tag -a v0.2.1 -m "v0.2.1"
git push origin v0.2.1
```

Depois valide no GitHub:

1. O workflow `Release` foi executado.
2. A GitHub Release foi criada.
3. A release esta marcada como prerelease para `v0.x.x`.
4. As notas automaticas foram geradas.
5. O changelog do projeto apareceu como contexto quando havia arquivo
   correspondente.

Se o teste foi feito com uma tag incorreta, siga o procedimento de correcao de
tag descrito acima.

