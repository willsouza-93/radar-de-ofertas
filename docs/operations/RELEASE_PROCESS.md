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

3. O job procura primeiro release notes resumidas em:

```text
docs/releases/<tag>.md
```

Exemplo:

```text
docs/releases/v0.3.0.md
```

4. Se o arquivo existir, ele vira o corpo principal da GitHub Release.
5. Se o arquivo nao existir, o workflow usa release notes automaticas do GitHub
   e adiciona apenas links para documentacao tecnica.
6. O job procura changelog/relatorio tecnico para linkar:

- `docs/architecture/CHANGELOG_FASE_<minor>.md`
- `docs/operations/CHANGELOG_FASE_<minor>.md`
- `docs/operations/CHANGELOG_FASE_<minor>C.md`
- `docs/operations/PHASE_<minor>B_LOCAL_VALIDATION_REPORT.md`
- `docs/operations/PHASE_<minor>C_VALIDATION_REPORT.md`
- `CHANGELOG.md`

7. O job cria a GitHub Release usando:

```bash
gh release create
```

Quando existe `docs/releases/<tag>.md`, o workflow nao usa `--generate-notes`.
Quando nao existe, usa `--generate-notes` e adiciona os links tecnicos como
contexto curto.

O workflow usa apenas o `GITHUB_TOKEN` padrao do GitHub Actions, por meio de:

```yaml
permissions:
  contents: write
```

Nenhum secret adicional e necessario.

## Release notes resumidas

Para evitar GitHub Releases longas demais, crie um arquivo dedicado antes de
criar a tag:

```bash
mkdir -p docs/releases
touch docs/releases/v0.3.0.md
```

Formato recomendado:

```markdown
# Radar de Ofertas v0.3.0

## ✨ Novidades
- Resumo das principais entregas da versao.

## 🔒 Segurança
- Mudancas relevantes de RLS, permissoes, auditoria ou protecao de fluxo.

## 🧪 Qualidade
- Testes, validacoes e checks relevantes.

## 🚫 Fora de escopo
- O que explicitamente nao entrou nesta versao.

## 📚 Documentação técnica
- Links para changelog e relatorios tecnicos relevantes.
```

### Changelog tecnico vs release notes

Use changelog tecnico para:

- detalhes de migrations;
- nomes de tabelas, policies, funcoes e constraints;
- evidencias completas de testes;
- riscos operacionais;
- rollback e validacao interna.

Use release notes para:

- explicar valor entregue;
- resumir seguranca e qualidade;
- orientar leitores que nao precisam do detalhe completo;
- linkar a documentacao tecnica.

### Quando criar release notes manuais

Crie `docs/releases/<tag>.md` quando:

- a versao representa uma fase importante;
- o changelog tecnico e longo;
- a release sera lida por stakeholders de produto;
- ha decisoes de seguranca que precisam de resumo claro.

Para patches pequenos e tecnicos, pode deixar o arquivo ausente. Nesse caso, o
workflow usa as notas automaticas do GitHub e adiciona links tecnicos.

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
5. Se `docs/releases/<tag>.md` existia, ele foi usado como corpo principal.
6. Se `docs/releases/<tag>.md` nao existia, os links tecnicos apareceram sem
   colar o changelog inteiro.

Se o teste foi feito com uma tag incorreta, siga o procedimento de correcao de
tag descrito acima.
