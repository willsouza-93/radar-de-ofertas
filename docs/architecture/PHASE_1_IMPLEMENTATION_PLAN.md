# Fase 1 - Plano executavel de implementacao

## Objetivo

Validar e preparar a fundacao local, Auth, identidade, workspace e RLS antes de
implementar os modulos de negocio.

Este documento nao implementa codigo, SQL, migrations ou scaffolding. Ele define
a ordem executavel e os gates para a implementacao.

## Escopo da Fase 1

Incluido:

- ambiente local Supabase e ambientes remotos separados;
- Supabase Auth para Admin e Editor;
- `profiles`, `workspaces` e `workspace_members`;
- roles `admin` e `editor`;
- helpers privados de autorizacao;
- RLS e grants das tabelas de identidade;
- provisionamento inicial controlado;
- seed local/teste de identidade;
- matriz automatizada de RLS e isolamento.

Excluido:

- cadastro publico;
- Public Visitor em `auth.users` ou workspace;
- tabelas de ofertas, publicacoes, canais, logs e analytics;
- UI final, fluxo de convite completo e gestao de usuarios pelo backoffice;
- Telegram, scheduler e integracoes externas.

## Precondicoes operacionais

Precisam estar registradas antes do primeiro passo de implementacao:

1. Owner dos projetos Supabase/Vercel, billing, MFA e recuperacao.
2. URLs e callbacks de local, staging e production.
3. Secret store oficial e lista de pessoas autorizadas.
4. Identidade do Admin inicial de cada ambiente.
5. Nome, slug e timezone definitivos do workspace inicial.

## Sequencia de implementacao

### Etapa 1 - Congelar parametros e ferramentas

Atividades:

- registrar precondicoes operacionais;
- confirmar versoes suportadas de Node.js, Supabase CLI e dependencias;
- validar documentacao/changelog Supabase antes de implementar;
- definir convencao de migrations, seeds e testes;
- confirmar que `service_role`/secret key sera server-only.

Dependencias: nenhuma.

Criterios de aceite:

- todos os parametros obrigatorios preenchidos;
- ambientes e owners identificados;
- nenhuma credencial em documentos ou repositorio;
- versoes e comandos confirmados pela documentacao oficial vigente.

### Etapa 2 - Preparar ambientes isolados

Atividades:

- preparar Supabase local;
- configurar projetos separados para staging e production;
- configurar URLs/callbacks Auth;
- definir Data API exposed schemas/grants;
- validar separacao de chaves publicaveis e privilegiadas.

Dependencias: Etapa 1.

Criterios de aceite:

- ambientes nao compartilham banco, Auth ou segredos;
- local pode ser recriado de forma deterministica;
- `anon` nao possui acesso a tabelas internas;
- chave privilegiada nao e exposta ao cliente.

### Etapa 3 - Implementar modelo de identidade

Atividades:

- criar tipos e schema privado;
- criar `profiles`, `workspaces` e `workspace_members`;
- criar constraints e indices;
- configurar sincronizacao de `auth.users` para `profiles`;
- validar lifecycle de usuario convidado, ativo e suspenso.

Dependencias: Etapa 2 e `IDENTITY_MODEL.md`.

Criterios de aceite:

- todo Admin/Editor autenticado possui um perfil;
- toda membership referencia perfil e workspace validos;
- role aceita somente `admin` ou `editor`;
- Public Visitor nao cria registro;
- usuario suspenso continua existente, mas perde acesso ao workspace.

### Etapa 4 - Implementar helpers e RLS

Atividades:

- criar helpers privados necessarios;
- habilitar RLS antes de conceder acesso;
- criar policies e grants de identidade;
- impedir mutacoes diretas de membership/workspace pelo Data API;
- validar isolamento entre workspaces.

Dependencias: Etapa 3 e `RLS_STRATEGY.md`.

Criterios de aceite:

- `anon` nao le/escreve tabelas internas;
- Editor acessa somente o proprio perfil, workspace e membership permitidos;
- Admin acessa membros/perfis apenas do proprio workspace;
- usuario suspenso nao acessa dados do workspace;
- Admin de outro workspace nao acessa dados;
- policies nao dependem de `user_metadata`.

### Etapa 5 - Provisionar e semear identidades

Atividades:

- executar seed local/teste deterministico;
- provisionar Admin inicial em staging/production por procedimento controlado;
- provisionar Editor inicial se aprovado;
- confirmar membership e status;
- registrar evidencias operacionais sem segredos.

Dependencias: Etapas 3 e 4, `SEED_STRATEGY.md`.

Criterios de aceite:

- Admin inicial acessa somente o workspace esperado;
- Editor inicial possui role correta;
- nenhum usuario publico e criado;
- ambientes remotos nao recebem senhas/usuarios de fixture;
- bootstrap pode ser auditado operacionalmente.

### Etapa 6 - Executar matriz de testes e hardening

Atividades:

- executar testes de Auth, RLS, grants e isolamento;
- testar anon/Public Visitor;
- testar usuario suspenso e outro workspace;
- verificar comportamento de update com policy de select;
- revisar advisors e configuracao Data API;
- registrar riscos residuais.

Dependencias: Etapas 2 a 5, `PHASE_1_TEST_MATRIX.md`.

Criterios de aceite:

- matriz obrigatoria passa integralmente;
- nenhuma chave privilegiada aparece no browser/logs;
- nenhum contexto acessa outro workspace;
- nenhuma tabela interna e acessivel por `anon`;
- reset local aplica migrations e seed sem intervencao manual.

### Etapa 7 - Gate de encerramento

Atividades:

- revisar criterios de aceite;
- revisar migration history;
- confirmar rollback/recovery;
- aprovar passagem para Fase 2.

Dependencias: todas as etapas anteriores.

Criterios de aceite:

- modelo de identidade e RLS aprovados;
- setup local reproduzivel;
- staging validado;
- riscos criticos sem mitigacao: zero;
- pendencias nao bloqueadoras registradas.

## Dependencias resumidas

```text
Parametros operacionais
  -> Ambientes isolados
    -> Modelo de identidade
      -> Helpers + RLS
        -> Seeds/provisionamento
          -> Testes e hardening
            -> Gate Fase 2
```

## Criterios de aceite da Fase 1

- Nao existe cadastro publico.
- RBAC contem somente Admin e Editor.
- Public Visitor/anon nao acessa o backoffice nem tabelas internas.
- Admin e Editor autenticam e recuperam senha.
- Membership ativa e a fonte de autorizacao.
- Usuario suspenso perde acesso ao workspace imediatamente por RLS.
- Outro workspace permanece isolado.
- Migrations sao versionadas e reproduziveis.
- Seed local/teste e idempotente.
- Production nao usa usuarios ou senhas de fixture.
- Testes obrigatorios passam.

## Riscos

| Risco | Mitigacao |
|---|---|
| RLS recursiva ou permissiva | Helpers privados pequenos e matriz automatizada |
| Perfil ausente apos criacao Auth | Sincronizacao transacional/trigger validado |
| Membership criada no workspace errado | Bootstrap com IDs explicitos e verificacao |
| Service key exposta | Cliente privilegiado server-only e revisao de bundle/env |
| Usuario suspenso mantem acesso | Policies consultam status no banco em toda operacao |
| Rollback destrutivo remove usuarios Auth | Forward-fix em ambientes compartilhados |
| Configuracao Data API diverge entre ambientes | Checklist e teste por ambiente |
| Parametros operacionais divergentes entre documentos e ambientes | Registrar fonte unica antes da implementacao |
| Mensagem de suspensao depender de dado bloqueado por RLS | Decidir acesso minimo antes de escrever policies |

## Duvidas encontradas

1. Quem e o owner nominal dos projetos Supabase/Vercel e do billing?
2. Quais sao as URLs/callbacks definitivas de staging e production?
3. Qual secret store sera usado e quem tera acesso?
4. Qual e o email/display name do Admin inicial por ambiente?
5. O Editor inicial deve existir em staging/production desde a Fase 1?
6. Qual e o slug definitivo do workspace inicial?
7. Membership convidada deve ficar `invited` ate o primeiro login ou ser ativada
   no provisionamento?
8. Usuario suspenso pode ler a propria membership suspensa para receber bloqueio
   amigavel?
9. Qual ferramenta/ambiente executara os testes automatizados de RLS?
10. Quem aprovara o gate de seguranca da Fase 1?

## Gate atual

**NOT_READY_FOR_IMPLEMENTATION**

Motivo: a arquitetura esta especificada, mas os parametros operacionais e
identidades iniciais listados nas precondicoes ainda nao estao registrados na
fonte da verdade.
