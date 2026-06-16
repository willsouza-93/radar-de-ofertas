# Plano de migrations da Fase 1

## Objetivo

Definir a ordem executavel das migrations de identidade, workspace e RLS sem
implementar SQL nesta fase.

Toda migration deve ser versionada no repositorio, aplicada primeiro em
ambiente local descartavel e validada antes de avancar para staging ou
producao.

## Convencao de nomes

Os nomes finais devem usar o timestamp gerado pela CLI do Supabase:

`<timestamp>_<nome_logico>.sql`

Nao devem ser inventados timestamps manualmente. Os nomes logicos aprovados
para a Fase 1 sao:

1. `create_identity_types_and_private_schema`
2. `create_identity_tables`
3. `create_profile_provisioning`
4. `create_identity_auth_helpers`
5. `enable_identity_rls_and_policies`
6. `configure_identity_grants`

## Ordem das migrations

| Ordem | Nome logico | Responsabilidade | Dependencias |
|---|---|---|---|
| 1 | `create_identity_types_and_private_schema` | Criar tipos controlados de role/status e namespace privado para helpers | Nenhuma |
| 2 | `create_identity_tables` | Criar `profiles`, `workspaces`, `workspace_members`, constraints e indices | Migration 1 e `auth.users` |
| 3 | `create_profile_provisioning` | Definir provisionamento confiavel de profile a partir de identidade Auth | Migration 2 |
| 4 | `create_identity_auth_helpers` | Criar helpers privados usados por RLS e validacoes server-side | Migrations 1 e 2 |
| 5 | `enable_identity_rls_and_policies` | Habilitar RLS e criar policies das tabelas de identidade | Migrations 3 e 4 |
| 6 | `configure_identity_grants` | Restringir grants e superficie exposta aos papeis de banco | Migration 5 |

## Conteudo esperado por migration

### 1. Tipos e namespace privado

- enum de role limitado a `admin` e `editor`;
- enum de status de membership;
- namespace privado para helpers;
- nenhuma permissao publica no namespace privado.

### 2. Tabelas de identidade

- tabelas, chaves e relacionamentos definidos em
  [IDENTITY_MODEL.md](IDENTITY_MODEL.md);
- unicidade de membership por usuario/workspace;
- indices para consultas de membership ativa e role;
- constraints para impedir estados invalidos.

### 3. Provisionamento de profile

- mecanismo privado para garantir profile correspondente a cada usuario
  interno;
- comportamento explicito para falha de provisionamento;
- validacao de que Public Visitor nao cria registro.

### 4. Helpers de autorizacao

- helpers descritos em [RLS_STRATEGY.md](RLS_STRATEGY.md);
- isolamento contra recursao entre policies;
- contexto de workspace sempre explicito;
- nenhum helper concede acesso baseado apenas em metadata do cliente.

### 5. RLS e policies

- RLS habilitada em todas as tabelas publicas da Fase 1;
- policies separadas por operacao;
- bloqueio de `anon`, usuario suspenso e outro workspace;
- escrita sensivel restrita ao servidor.

### 6. Grants

- revogar acessos implicitos desnecessarios;
- conceder somente o minimo exigido pelas policies e operacoes aprovadas;
- manter funcoes privadas fora do alcance direto do cliente.

## Validacao por migration

Cada migration deve:

1. aplicar em banco local vazio;
2. aplicar sobre a migration anterior;
3. passar verificacoes de schema, constraints e indices;
4. nao abrir acesso antes da migration de policies;
5. registrar intencao de rollback;
6. passar `db reset` completo antes de merge.

## Estrategia de rollback

### Local e testes

- descartar o banco;
- reaplicar toda a cadeia versionada;
- corrigir a migration ainda nao promovida.

### Staging e producao

- preferir migration corretiva para frente;
- nunca editar migration ja aplicada;
- rollback destrutivo exige backup verificado, janela controlada e aprovacao;
- nunca remover identidades de `auth.users` como rollback automatico;
- preservar auditabilidade e memberships historicas.

## Gate de promocao

Uma migration so avanca de ambiente quando:

- cadeia completa aplica em banco vazio;
- testes de RLS e matriz da Fase 1 passam;
- grants e advisors de seguranca nao apresentam achado critico;
- plano de recuperacao foi registrado;
- backup aplicavel ao ambiente foi confirmado.

## Riscos

- ordem incorreta pode deixar janela temporaria sem RLS;
- helper mal definido pode causar recursao ou bypass;
- provisionamento de profile pode gerar identidade parcial;
- rollback destrutivo pode apagar historico ou bloquear acesso.
