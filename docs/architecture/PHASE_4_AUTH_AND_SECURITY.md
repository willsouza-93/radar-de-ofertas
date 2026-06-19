# Auth e Seguranca da UI na Fase 4

Status: estrategia de seguranca frontend para Fase 4B.

## Principios

- UI nao e fronteira de seguranca.
- Toda permissao sensivel deve ser validada no servidor e protegida por RLS.
- `service_role` nunca entra no browser.
- `workspaceId` nunca vem do cliente.
- Public Visitor nao cria conta e nao acessa backoffice.

## Atores

### Admin

- Acessa dashboard, ofertas e curadoria.
- Pode aprovar e rejeitar.
- Na Fase 4B, nao e necessario expor administracao de usuarios, canais ou
  integracoes.

### Editor

- Acessa dashboard, ofertas e curadoria.
- Pode aprovar e rejeitar.
- Nao gerencia integracoes, canais, usuarios ou configuracoes.

### Public Visitor / anon

- Sem backoffice.
- Sem dashboard.
- Sem ofertas internas.
- Sem relatorios.
- Sem curadoria.
- Qualquer tentativa de rota interna deve ir para login sem carregar dados.

## Guardas

### Middleware ou layout server-side

Recomendado:

1. Ler sessao Supabase via cookies server-side.
2. Se nao houver usuario, redirecionar para `/login`.
3. Resolver membership ativa.
4. Se membership ausente/suspensa, renderizar `AccessLimitedState`.
5. Se houver mais de uma membership ativa, renderizar estado controlado de
   multi-workspace nao suportado.
6. Expor papel e workspace ao shell como dados serializados minimos.

Mensagem para multi-workspace:

```text
Sua conta esta vinculada a mais de um workspace. A selecao de workspace ainda
nao faz parte do MVP.
```

Comportamento:

- bloquear carregamento de dados internos;
- nao escolher workspace automaticamente;
- oferecer "Sair" e orientacao para falar com o administrador;
- registrar erro server-side sem expor detalhes de outros workspaces.

### Server Actions

Cada action segue:

1. obter usuario autenticado;
2. resolver workspace via membership ativa;
3. validar papel Admin/Editor quando necessario;
4. validar input com Zod;
5. chamar service existente;
6. mapear erro para envelope estavel.

## Protecao contra workspace injection

Contratos da UI nao contem `workspaceId`.

Testes obrigatorios:

- payload com `workspaceId` extra em actions de curadoria deve ser rejeitado por
  schema estrito ou ignorado pelo adapter server-side.
- Admin de outro workspace recebe not found/empty.
- Usuario sem membership recebe forbidden.
- Usuario com multiplos workspaces recebe
  `MULTIPLE_WORKSPACES_NOT_SUPPORTED` mapeado para estado controlado.

## Protecao de approval/reject

Regras:

- UI envia sempre `expectedStatus: "pending"`.
- Botao aprovar/rejeitar so aparece para `queue.status === "pending"`.
- Backend permanece autoridade.
- `VERSION_CONFLICT` deve recarregar o detalhe antes de nova tentativa.
- Nunca alterar `approval_queue.status` diretamente pelo cliente.
- Nunca inserir `approval_decisions` diretamente pelo cliente.

## Review notes

Regras:

- Criacao permitida para Admin/Editor apenas em `pending`.
- Sem editar nota.
- Sem excluir nota.
- UI deve comunicar: "Observacoes sao permanentes no historico."

## Dados sensiveis

Nao exibir:

- keys Supabase;
- service role;
- cookies;
- segredos Vercel;
- qualquer token futuro.

Links de afiliado:

- podem aparecer no detalhe como dado operacional;
- devem ter acao "Abrir link" com `rel="noreferrer"` quando abrir nova aba;
- nao devem ser registrados integralmente em logs de erro do cliente.

## Estados de erro seguros

Mensagens nao devem indicar se um ID existe em outro workspace.

Usar:

```text
Este item nao foi encontrado ou nao pertence ao seu workspace.
```

Evitar:

```text
Esta oferta pertence ao workspace X.
```

## CSP e headers futuros

Recomendado para Fase 4B ou logo apos:

- `frame-ancestors 'none'`
- `object-src 'none'`
- `base-uri 'self'`
- allowlist de imagens externas apenas se necessario para imagens de produtos

Como a Fase 4B pode renderizar `imageUrl` externa, a allowlist deve ser
restritiva ou usar `next/image` com dominios revisados.

## Acessibilidade e seguranca

- Erros de permissao usam `role="alert"` apenas quando bloqueantes.
- Modais de aprovacao/rejeicao prendem foco.
- Confirmacoes destrutivas nao dependem somente de cor.
- Loading de action usa `aria-busy` e bloqueia duplo clique.

## Checklist de seguranca da Fase 4B

- [ ] Sem `SUPABASE_SERVICE_ROLE_KEY` em codigo cliente.
- [ ] Sem `workspaceId` em forms/URLs/actions.
- [ ] Rotas internas exigem sessao.
- [ ] Membership ativa verificada no servidor.
- [ ] Multi-workspace mapeado para estado controlado.
- [ ] Admin/Editor testados.
- [ ] Suspenso bloqueado.
- [ ] Public Visitor/anon bloqueado.
- [ ] Aprovacao/rejeicao passam por action oficial.
- [ ] Notas sao append-only na UI.
- [ ] Erros nao vazam SQL, workspace ou secrets.
