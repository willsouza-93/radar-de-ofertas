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

## Bloqueio de push observado

O push do branch foi rejeitado pelo GitHub porque o token OAuth atual do GitHub CLI nao possui escopo `workflow`.

Escopos observados:

```text
gist, read:org, repo
```

Acao manual necessaria:

```bash
gh auth refresh -h github.com --scopes workflow --clipboard
git push -u origin feature/phase-1c-provisioning
```

Depois do push, abrir PR contra `main`.

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

- Abrir PR da branch `feature/phase-1c-provisioning`.
- Aguardar execucao do workflow no GitHub Actions apos push/PR.
- Reautenticar GitHub CLI com escopo `workflow` antes do push.
- Configurar secrets apenas quando houver necessidade real de CI/CD remoto com deploy ou migracoes remotas.
