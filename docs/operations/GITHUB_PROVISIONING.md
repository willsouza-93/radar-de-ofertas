# GitHub Provisioning

## Repositorio validado

- Repositorio: `willsouza-93/radar-de-ofertas`
- URL: `https://github.com/willsouza-93/radar-de-ofertas`
- Default branch: `main`
- Visibilidade observada: publico

## Branch local

Branch criada para a Fase 1C:

```text
feature/phase-1c-provisioning
```

## Estado anterior observado

- PR #1 da Fase 1 foi observado como merged.
- Nenhum workflow ativo foi listado antes da Fase 1C.
- Nenhum secret do GitHub Actions foi listado antes da Fase 1C.

## Estado final da Fase 1C

- PR #2 foi mergeado na `main`.
- Workflow `Phase 1 Validation` rodou apos o merge na `main`.
- Resultado observado: `success`.
- Run observado: `27655463039`.

## Workflow criado

Arquivo:

```text
.github/workflows/phase-1-validation.yml
```

Pipeline minima:

- Checkout.
- Setup Node.
- Instalacao de dependencias.
- Inicio do Supabase local apenas com database.
- `supabase db reset`.
- `supabase test db`.

O workflow nao usa secrets reais e nao acessa o projeto Supabase remoto.

Decisao: PR CI deve continuar usando Supabase local. O Supabase staging nao deve ser usado em CI de pull request.

## Bloqueio de push resolvido

O push inicial do branch foi rejeitado pelo GitHub porque o token OAuth do GitHub CLI nao possuia escopo `workflow`.

Escopos iniciais observados:

```text
gist, read:org, repo
```

Acao executada:

```bash
gh auth refresh -h github.com --scopes workflow --clipboard
git push -u origin feature/phase-1c-provisioning
```

Depois do push, o PR #2 foi aberto e mergeado contra `main`.

## Observacao sobre Docker

O GitHub Actions `ubuntu-latest` possui Docker disponivel, requisito para Supabase local. Se a imagem ou servicos do Supabase CLI mudarem no futuro, o workflow pode exigir ajustes de exclusao de servicos ou timeout.

## Comandos de validacao local

```bash
git remote -v
gh repo view willsouza-93/radar-de-ofertas
gh pr view 1 --repo willsouza-93/radar-de-ofertas
gh secret list --repo willsouza-93/radar-de-ofertas
gh workflow list --repo willsouza-93/radar-de-ofertas
```

## Pendencias

- Configurar secrets apenas quando houver necessidade real de CI/CD remoto com deploy ou migracoes remotas.
- Criar workflow separado para migrations remotas futuras, se a operacao deixar de ser manual.
