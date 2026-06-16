# Matriz de testes da Fase 1

## Objetivo

Validar Auth, identidade, isolamento por workspace, roles e RLS antes de
qualquer modulo operacional do MVP.

## Atores de teste

| Ator | Estado |
|---|---|
| Admin A | Admin ativo do Workspace A |
| Editor A | Editor ativo do Workspace A |
| Public Visitor | `anon`, sem identidade |
| Suspenso A | Usuario autenticado com membership suspensa no Workspace A |
| Admin B | Admin ativo do Workspace B |
| Sem membership | Usuario autenticado sem workspace |

## Matriz de acesso a dados

Legenda: `P` permitido, `B` bloqueado, `D` decisao pendente.

| Cenario | Admin A | Editor A | Public Visitor | Suspenso A | Admin B | Sem membership |
|---|---:|---:|---:|---:|---:|---:|
| Ler proprio profile | P | P | B | P | P | P |
| Atualizar campos permitidos do proprio profile | P | P | B | P | P | P |
| Ler profile de membro do Workspace A | P | B | B | B | B | B |
| Ler Workspace A | P | P | B | B | B | B |
| Ler propria membership ativa | P | P | B | N/A | B | B |
| Ler propria membership suspensa | N/A | N/A | B | D | B | B |
| Listar memberships do Workspace A | P | B | B | B | B | B |
| Ler Workspace B | B | B | B | B | P | B |
| Alterar role/status diretamente pelo cliente | B | B | B | B | B | B |
| Criar workspace diretamente pelo cliente | B | B | B | B | B | B |

## Matriz de Auth e ciclo de vida

| Cenario | Resultado esperado |
|---|---|
| Admin ativo autentica | Sessao valida e acesso ao Workspace A |
| Editor ativo autentica | Sessao valida e acesso operacional ao Workspace A |
| Public Visitor tenta cadastro publico | Fluxo indisponivel no MVP |
| Public Visitor acessa backoffice | Redirecionado/bloqueado sem dados |
| Usuario sem membership autentica | Sessao pode existir, acesso interno bloqueado |
| Membership e suspensa com sessao existente | Proxima operacao interna e bloqueada |
| Admin B usa identificador do Workspace A | Bloqueado por RLS e servidor |
| Recuperacao de acesso aprovada | Usuario recupera sessao sem alterar role |
| Tentativa de role via metadata do cliente | Ignorada/bloqueada |

## Testes obrigatorios por tabela

### `profiles`

- usuario le e atualiza somente campos aprovados do proprio profile;
- Admin le profiles do proprio workspace;
- Editor nao enumera profiles;
- outro workspace e `anon` nao leem;
- nenhum ator altera campos de autorizacao.

### `workspaces`

- membro ativo le somente o proprio workspace;
- suspenso, sem membership, outro workspace e `anon` sao bloqueados;
- criacao, alteracao e exclusao diretas pelo cliente sao bloqueadas.

### `workspace_members`

- Admin lista memberships do proprio workspace;
- Editor le somente a propria membership ativa;
- nenhum cliente altera role/status diretamente;
- isolamento entre workspaces e obrigatorio;
- comportamento de leitura da propria membership suspensa deve ser decidido.

## Testes de helpers, grants e RLS

- helpers retornam falso sem identidade ou membership ativa;
- role nunca e inferida de metadata editavel pelo cliente;
- helpers nao causam recursao de policy;
- RLS permanece habilitada em todas as tabelas publicas;
- grants nao permitem contornar policies;
- chave anonima nao acessa tabelas internas;
- service role existe somente em execucao server-side controlada;
- acao administrativa sensivel registra auditabilidade quando o modulo existir.

## Testes de isolamento

1. Executar a mesma leitura com Admin A e Admin B.
2. Confirmar que cada ator recebe somente seu workspace.
3. Tentar acessar registros usando IDs conhecidos do outro workspace.
4. Confirmar resposta vazia ou bloqueio sem vazamento de metadados.
5. Repetir para profile, workspace e membership.

## Criterios de aceite

- zero acesso interno por Public Visitor/`anon`;
- zero vazamento entre workspaces;
- Editor nao ganha capacidade administrativa;
- usuario suspenso perde acesso ao workspace mesmo com sessao existente;
- nenhuma escrita sensivel ocorre diretamente pelo cliente;
- todos os cenarios `B` passam como bloqueados;
- todos os cenarios `P` passam como permitidos;
- cenarios `D` sao resolvidos antes da implementacao.

## Pendencias

- decidir se Suspenso A pode ler a propria membership suspensa para exibir
  bloqueio amigavel;
- confirmar ferramenta e ambiente que executarao os testes de RLS;
- definir responsavel pelo aceite de seguranca da Fase 1.

## Gate atual

**NOT_READY_FOR_IMPLEMENTATION**

A matriz esta definida, mas o cenario de membership suspensa e os parametros
operacionais precisam ser aprovados antes da execucao.
