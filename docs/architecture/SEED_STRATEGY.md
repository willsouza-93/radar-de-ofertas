# Estrategia de seed da Fase 1

## Objetivo

Definir dados minimos para validar Auth, isolamento por workspace, roles e RLS.
Seeds de ofertas, canais, publicacoes e analytics pertencem a fases posteriores.

## Principios

- Public Visitor nao possui seed, conta, profile ou membership.
- Nenhuma senha, token ou service role key e versionada.
- Seeds locais e de teste devem ser deterministas e idempotentes.
- Staging e producao usam provisionamento controlado, nao identidades com senha
  fixa no repositorio.
- Dados de outro workspace existem apenas em testes para validar isolamento.

## Workspace inicial

| Campo | Valor proposto | Status |
|---|---|---|
| Nome | `Radar de Ofertas` | Aprovado conceitualmente |
| Slug | `radar-de-ofertas` | Necessita confirmacao |
| Timezone | `America/Sao_Paulo` | Necessita confirmacao operacional |
| Status | Ativo | Aprovado |

## Identidades minimas

### Local e teste automatizado

| Identidade | Workspace | Role/status | Finalidade |
|---|---|---|---|
| Admin A | Workspace A | `admin` ativo | Fluxos administrativos |
| Editor A | Workspace A | `editor` ativo | Fluxos operacionais |
| Usuario suspenso A | Workspace A | membership suspensa | Bloqueio por status |
| Admin B | Workspace B | `admin` ativo | Isolamento entre workspaces |
| Usuario sem membership | Nenhum | autenticado | Bloqueio sem workspace |

Os identificadores devem ser estaveis somente no ambiente de teste. Credenciais
locais devem ser documentadas fora de artefatos promovidos para producao.

### Staging

- criar workspace de staging;
- provisionar Admin inicial por operacao controlada;
- provisionar Editor apenas se necessario para aceite;
- armazenar credenciais no gerenciador de segredos aprovado;
- registrar responsavel e data do provisionamento.

### Producao

- criar exatamente um workspace inicial;
- provisionar pelo menos um Admin inicial;
- criar Editor somente com identidade nominal aprovada;
- exigir recuperacao/MFA conforme decisao operacional;
- nao executar seed destrutivo ou com contas genericas.

## Sequencia de provisionamento

1. Confirmar ambiente e parametros do workspace.
2. Criar workspace inicial.
3. Provisionar identidade Auth do Admin.
4. Verificar criacao do profile correspondente.
5. Criar membership Admin ativa.
6. Validar login e acesso do Admin.
7. Provisionar Editor, quando aprovado.
8. Validar isolamento e permissoes.

## Dados minimos por ambiente

| Dado | Local | Teste | Staging | Producao |
|---|---:|---:|---:|---:|
| Workspace A | Sim | Sim | Sim | Sim |
| Admin A | Sim | Sim | Sim | Sim |
| Editor A | Sim | Sim | Opcional | Opcional |
| Usuario suspenso A | Sim | Sim | Nao | Nao |
| Workspace/Admin B | Sim | Sim | Nao | Nao |
| Usuario sem membership | Sim | Sim | Nao | Nao |

## Idempotencia e limpeza

- executar novamente nao cria memberships ou workspaces duplicados;
- divergencias de role/status falham explicitamente em vez de sobrescrever;
- limpeza automatica e permitida somente em local/teste;
- staging e producao exigem procedimento administrativo auditado.

## Criterios de aceite

- Admin inicial autentica e acessa somente o workspace correto;
- Editor autentica e recebe somente permissoes operacionais;
- usuario suspenso e usuario sem membership nao acessam dados internos;
- Admin B nao acessa Workspace A;
- `anon` nao recebe qualquer dado interno;
- nenhum segredo esta presente nos arquivos versionados.

## Pendencias antes da execucao

- confirmar slug e timezone do workspace inicial;
- informar identidade nominal do Admin inicial por ambiente;
- decidir se um Editor inicial sera provisionado;
- aprovar armazenamento de credenciais e procedimento de recuperacao.
