# Checklist de prontidao da Fase 1

## Objetivo

Registrar as decisoes operacionais necessarias para iniciar a implementacao da
Fase 1: Fundacao, Auth, RLS e Banco.

Este documento nao contem codigo, migrations, SQL ou credenciais. Valores
secretos nunca devem ser registrados aqui.

Status usados:

- **Decidido:** pode ser aplicado na implementacao.
- **Aprovado pelo proprietario:** confirmado por Willian Cesar.

# 1. Ownership

Para o MVP, a responsabilidade primaria fica concentrada em Willian Cesar.

| Responsabilidade | Decisao final | Status |
|---|---|---|
| Owner Supabase | Willian Cesar | **Aprovado pelo proprietario** |
| Owner Vercel | Willian Cesar | **Aprovado pelo proprietario** |
| Billing owner | Willian Cesar | **Aprovado pelo proprietario** |
| Responsavel MFA | Willian Cesar | **Aprovado pelo proprietario** |
| Responsavel recuperacao de acesso | Willian Cesar | **Aprovado pelo proprietario** |

Decisao operacional:

- nenhuma conta compartilhada sera usada;
- owners utilizarao identidades nominais;
- o contato de contingencia nao recebe acesso permanente automaticamente.

# 2. Workspace inicial

| Campo | Decisao final |
|---|---|
| Nome | `Radar de Ofertas` |
| Slug | `radar-de-ofertas` |
| Timezone | `America/Sao_Paulo` |

**Status: Decidido.**

Justificativa:

- os valores ja aparecem como proposta coerente na estrategia de seed;
- o produto opera inicialmente no Brasil;
- um valor unico e deterministico reduz divergencias entre ambientes.

# 3. Admin inicial

| Campo | Decisao |
|---|---|
| Email | `willian.souza2007@hotmail.com` |
| Display name | `Willian Cesar` |
| Local | Aplicavel; fixture local deterministica pode representar o Admin |
| Staging | Aplicavel; identidade nominal provisionada por procedimento controlado |
| Production | Aplicavel; identidade nominal provisionada por procedimento controlado |

**Status: Aprovado pelo proprietario.**

Decisao operacional:

- local/teste pode usar identidade de fixture sem reutilizar senha real;
- staging e production nao usam senha ou usuario de fixture;
- o Admin inicial deve possuir membership `admin` ativa no workspace correto.

# 4. Editor inicial

| Ambiente | Decisao final | Justificativa |
|---|---|---|
| Local | Sim | Necessario para desenvolver e testar RBAC |
| Staging | Sim | Necessario para aceite dos fluxos e permissoes operacionais |
| Production | Nao no bootstrap inicial | Evita criar acesso sem identidade nominal e necessidade operacional confirmadas |

Email do Editor inicial em local e staging:
`souza.willian.93@outlook.com`.

Em producao, o primeiro Editor sera provisionado posteriormente pelo Admin,
somente quando houver uma pessoa nominal aprovada.

**Status: Aprovado pelo proprietario.**

# 5. Membership invited

Opcoes avaliadas:

| Opcao | Avaliacao MVP |
|---|---|
| A) Ativa imediatamente | Menor complexidade; acesso ainda exige autenticacao valida |
| B) Ativa apos primeiro login | Exige transicao adicional no primeiro acesso |
| C) Ativa apos aceite explicito | Adiciona fluxo de convite/aceite fora do escopo da Fase 1 |

## Decisao final

**Opcao A: membership ativa imediatamente apos provisionamento controlado.**

Justificativa:

- nao existe signup publico;
- somente Admin ou operacao server-side autorizada provisiona usuarios;
- o usuario ainda precisa autenticar para acessar qualquer dado;
- evita implementar fluxo adicional de aceite no MVP;
- simplifica Auth e testes sem reduzir o isolamento por RLS.

O status `invited` fica reservado para uma evolucao futura do fluxo completo de
convite e nao e necessario no bootstrap operacional da Fase 1.

**Status: Decidido.**

# 6. Usuario suspenso

## Decisao final

O usuario suspenso pode visualizar somente a propria membership suspensa, em
uma superficie minima, para receber mensagem amigavel de bloqueio.

O usuario suspenso:

- pode identificar que sua membership esta `suspended`;
- nao pode listar membros;
- nao pode ler dados ou configuracoes do workspace;
- nao pode executar operacoes internas;
- nao recupera acesso por possuir sessao Auth existente.

Justificativa:

- permite explicar o bloqueio sem expor dados internos;
- preserva o requisito de perda imediata de acesso ao workspace;
- diferencia suspensao de erro generico ou falha de rede.

**Status: Decidido.**

# 7. URLs e callbacks

## URLs aprovadas

| Ambiente | Base URL |
|---|---|
| Local | `http://localhost:3000` |
| Staging | `https://radar-de-ofertas-staging.vercel.app` |
| Production | `https://radar-de-ofertas.vercel.app` |

## Auth callback URLs

| Ambiente | Callback |
|---|---|
| Local | `http://localhost:3000/auth/callback` |
| Staging | `https://radar-de-ofertas-staging.vercel.app/auth/callback` |
| Production | `https://radar-de-ofertas.vercel.app/auth/callback` |

## Redirect URLs aprovadas

- apos autenticacao: `<base-url>/dashboard`;
- recuperacao de senha: `<base-url>/auth/update-password`;
- acesso sem permissao: `<base-url>/acesso-restrito`;
- redirect publico obrigatorio: `<base-url>/r/{shortCode}`.

Decisoes:

- local, staging e production usam as URLs aprovadas acima;
- URLs de preview da Vercel nao serao callbacks Auth liberados por padrao;
- somente URLs explicitamente autorizadas entram na allowlist.

**Status: Aprovado pelo proprietario.**

# 8. Secret Management

## Decisao por ambiente

| Ambiente | Localizacao aprovada |
|---|---|
| Local | Arquivo local ignorado pelo Git e configuracao local do Supabase |
| Staging | Environment Variables criptografadas da Vercel e Supabase Vault quando o Supabase Cron precisar do segredo |
| Production | Environment Variables criptografadas da Vercel e Supabase Vault quando o Supabase Cron precisar do segredo |

## Localizacao por segredo

| Segredo/configuracao | Local | Staging/Production |
|---|---|---|
| Supabase URL e chave publicavel | Configuracao local ignorada pelo Git | Vercel Environment Variables |
| Supabase chave privilegiada | Somente ambiente server-side local | Vercel Environment Variables server-only |
| Telegram token | Segredo local ignorado pelo Git | Vercel Environment Variables server-only |
| Cron secret | Segredo local ignorado pelo Git | Supabase Vault no chamador e Vercel Environment Variable server-only no receptor |

Politica de acesso:

- nenhuma chave privilegiada ou token entra no frontend, Git, documentacao ou
  logs;
- acesso de escrita a segredos fica limitado ao owner e responsavel tecnico
  nominal;
- desenvolvedores recebem apenas os segredos estritamente necessarios ao
  ambiente;
- staging e production usam segredos diferentes;
- acesso e alteracoes devem ser revisados apos mudanca de responsavel.

Apenas Willian Cesar possui acesso aos segredos neste momento. A decisao se
aplica a Supabase, Vercel, Telegram, Cron e qualquer segredo futuro do MVP.

**Status: Aprovado pelo proprietario.**

# 9. Seguranca

## MFA

| Papel | Decisao final |
|---|---|
| Admin | MFA obrigatorio em staging e production |
| Editor | MFA recomendado, mas nao obrigatorio no MVP |

Justificativa:

- Admin controla usuarios, integracoes e configuracoes sensiveis;
- tornar MFA obrigatorio para Editor agora adicionaria atrito operacional antes
  de validar o fluxo;
- obrigatoriedade para Editor deve ser reavaliada antes de ampliar equipe ou
  canais.

## Rotacao de secrets

- rotacao imediata em suspeita de exposicao, desligamento ou mudanca de
  responsabilidade;
- revisao trimestral de acessos e segredos privilegiados;
- rotacao programada a cada 90 dias para Telegram token e Cron secret;
- chaves privilegiadas do Supabase seguem procedimento controlado e teste de
  impacto antes da rotacao;
- cada rotacao deve validar staging antes de production.

## Recuperacao de acesso

- recuperacao usa Supabase Auth para identidade nominal;
- recuperacao de Admin exige verificacao pelo owner e validacao do MFA;
- nenhum operador pode elevar a propria role durante recuperacao;
- contas compartilhadas e envio de credenciais por mensagem sao proibidos;
- o contato de contingencia do MVP e o Gmail pessoal do proprietario.

Observacao:

"Antes da entrada em produÃ§Ã£o com usuÃ¡rios reais ou ampliaÃ§Ã£o da equipe,
reavaliar e definir uma segunda identidade independente para recuperaÃ§Ã£o de
acesso."

## Testes e aceite de seguranca

- testes automatizados de RLS executam contra Supabase local em ambiente
  descartavel;
- CI repete a matriz de RLS antes de merge;
- staging recebe smoke test de Auth, grants e isolamento;
- Willian Cesar, como responsavel tecnico, aprova a evidencia de seguranca e o
  gate operacional final.

**Status: Aprovado pelo proprietario.**

# 10. Gate

## Estado atual

**READY_FOR_IMPLEMENTATION**

## Pendencias resolvidas

1. Ownership de Supabase, Vercel e billing.
2. Responsaveis por MFA e recuperacao de acesso.
3. Identidades do Admin e Editor iniciais.
4. Dominios de staging e production.
5. Lista de acesso aos segredos.
6. Contato de contingencia para o MVP.
7. Responsavel tecnico pelo aceite de seguranca.

## Pendencias operacionais restantes

Nenhum bloqueador operacional restante para iniciar a implementacao.

A criacao de uma segunda identidade independente para recuperacao e uma acao
obrigatoria antes da entrada em producao com usuarios reais ou ampliacao da
equipe, mas nao bloqueia o inicio da Fase 1B.

## Recomendacao

Iniciar a Fase 1B conforme a arquitetura e os planos aprovados.
