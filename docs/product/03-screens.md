# Catalogo de telas e responsividade

## Padrao de especificacao

- **Objetivo:** resultado que a tela ajuda a alcancar.
- **Desktop:** composicao a partir de 1280px.
- **Tablet:** adaptacao entre 768px e 1279px.
- **Mobile:** adaptacao ate 767px.
- **Acoes:** acoes principais e secundarias.
- **Estados:** variacoes obrigatorias.

## 1. Login

- Desktop: formulario central com largura `400px`; logo e mensagem
  "Entre para encontrar e publicar boas oportunidades."
- Campos: email, senha, checkbox "Lembrar de mim".
- Acoes: "Entrar", "Esqueci minha senha".
- Acesso restrito a Admin e Editor convidados ou provisionados.
- Erro: "Email ou senha incorretos. Confira os dados e tente novamente."
- Loading: botao "Entrando..." e campos preservados.

## 2. Recuperacao de senha

- Etapa 1: email e CTA "Enviar link de recuperacao".
- Etapa 2: confirmacao com email mascarado e "Reenviar em 45s".
- Etapa 3: nova senha, confirmacao e CTA "Atualizar senha".
- Mobile: uma etapa por pagina; desktop usa o mesmo container do login.

## 3. Dashboard geral

**Objetivo:** conduzir a proxima melhor acao.

- Topo: saudacao curta, seletor de periodo e status da automacao.
- Bloco prioritario "Requer sua atencao": falhas, aprovacoes urgentes e canais
  desconectados em lista compacta.
- Curadoria de hoje: tres colunas agrupadas, "Descobertas", "Prontas para
  aprovacao" e "Agendadas". Rows mostram produto, preco, score, destaques e CTA.
- Faixa inferior: desempenho por categoria, agenda do dia e saude dos canais.
- Metricas ficam em quatro valores inline, sem quatro cards dominantes.
- Desktop: curadoria em tres colunas; preview abre em drawer lateral.
- Tablet: duas colunas, "Agendadas" abaixo; preview em drawer.
- Mobile: tabs para cada estagio; CTA principal fixo; metricas em scroll.
- Estados: primeiro acesso, sem ofertas hoje, automacao pausada e erro parcial.

## 4. Lista de ofertas capturadas

- Header: titulo, contagem, "Exportar" e, para Admin, "Capturar agora".
- Filter bar sticky: busca, marketplace, categoria, score, desconto, data e
  "Mais filtros".
- Desktop: tabela com thumbnail, produto, marketplace, preco, desconto, score,
  sinais, capturada em e status.
- Tablet: oculta comissao e data; colunas configuraveis.
- Mobile: lista expansivel com score e preco sempre visiveis; filtros em drawer.
- Acoes de row: "Ver detalhes"; Editor/Admin tambem "Enviar para aprovacao".
- Empty filtrado: "Nenhuma oferta combina com estes filtros."

## 5. Detalhe da oferta

- Hero: imagem, titulo, marketplace, categoria, preco atual/anterior, desconto,
  score e highlights.
- Abas: Visao geral, Historico de preco, Conteudo gerado, Atividade.
- Visao geral explica score em quatro fatores e exibe dados do afiliado.
- Coluna lateral sticky: PostPreviewCard e ApprovalActions.
- Desktop: conteudo `8/4`; tablet `5/3`; mobile preview vira aba e acoes fixas.
- Erro parcial: dados atuais permanecem, grafico recebe estado de erro local.

## 6. Fila de aprovacao

- Toolbar: contagem pendente, SLA, filtros e ordenacao por score/urgencia.
- Desktop: lista principal `7/12` e preview persistente `5/12`.
- Selecionar item atualiza preview sem perder posicao da lista.
- Atalhos: `A` aprovar, `E` editar, `R` rejeitar, com ajuda acessivel.
- Acoes: "Aprovar e agendar", "Editar post", "Rejeitar".
- Tablet: preview em drawer; mobile: swipe nao e obrigatorio, botoes visiveis.
- Empty: "Fila em dia. Nenhuma oferta aguardando aprovacao."

## 7. Editor de post

- Header: breadcrumb, status de autosave, "Salvar rascunho" e
  "Aprovar e agendar".
- Desktop: editor `7/12`, preview sticky `5/12`.
- Campos: titulo interno, canal, texto, tags, link afiliado, imagem, CTA e notas.
- Assistencia: sugestoes de texto aparecem como opcoes aplicaveis, nunca
  sobrescrevem automaticamente.
- Preview alterna WhatsApp, Telegram e Social.
- Tablet: duas abas "Editar" e "Preview"; mobile: paginas empilhadas.
- Erros inline: link invalido, limite excedido e canal sem configuracao.

## 8. Agendamentos

- Alternancia: Calendario, Lista.
- Desktop: calendario semanal com rail lateral "Proximas publicacoes".
- Tablet: calendario de tres dias; mobile: agenda vertical por dia.
- Item informa canal, produto, horario, status e conflito.
- Acoes: "Novo agendamento", "Reagendar", "Publicar agora", "Cancelar".
- Editor/Admin podem alterar.
- Empty: "Nenhuma publicacao agendada para este periodo."

## 9. Canais de publicacao

- Resumo inline: conectados, com alerta, pausados.
- Lista agrupada por WhatsApp, Telegram e redes sociais.
- Row: nome, identificador, status, ultima publicacao, proxima publicacao.
- Admin: "Adicionar canal", "Testar conexao", "Editar", "Pausar".
- Editor: somente status e detalhes de publicacao.
- Configuracao usa modal/drawer com stepper: Tipo, Credenciais, Teste, Ativacao.
- Mobile: rows expansivas; configuracao em pagina cheia.

## 10. Categorias e tags

- Duas tabs: Categorias e Tags.
- Desktop: tabela com cor, nome, regras, ofertas e status.
- Admin gerencia; Editor seleciona em outros fluxos.
- Criacao em drawer com nome, cor acessivel, palavras-chave e regra automatica.
- Empty: "Crie categorias para organizar a curadoria."

## 11. Historico de precos

- Busca de produto e filtros de marketplace/categoria/periodo.
- Area principal: grafico acessivel, preco atual, menor preco e media.
- Abaixo: tabela de variacoes com data, preco, cupom e fonte.
- Desktop: grafico `8/12`, resumo `4/12`; mobile empilha.
- Tooltip de grafico tambem e acessivel via teclado.
- Empty: "Ainda nao ha historico suficiente para este produto."

## 12. Cupons

- Tabs: Ativos, Expirando, Expirados.
- Lista/tabela: codigo, marketplace, beneficio, regra, validade, uso e status.
- Acoes Admin: "Adicionar cupom", "Editar", "Desativar".
- Editor pode aplicar cupom ao post, mas nao gerenciar.
- Destaque sutil para validade menor que 24 horas.
- Empty: "Nenhum cupom ativo no momento."

## 13. Relatorios de cliques e conversoes

- Header com periodo, canal, marketplace e exportacao.
- Linha de metricas: cliques, conversoes, taxa, receita estimada.
- Graficos: tendencia, funil e distribuicao por canal/categoria.
- Tabela: publicacoes com desempenho e comparacao.
- Desktop: graficos em `7/5`; tablet/mobile empilham e simplificam legendas.
- Empty: "Os resultados aparecerao depois das primeiras publicacoes."

## 14. Configuracoes de integracoes

- Admin apenas.
- Grupos: Marketplaces, Afiliados, IA e Automacao.
- Cada integracao mostra status, ultima sincronizacao e escopo.
- Acoes: "Conectar", "Testar", "Reconectar", "Desconectar".
- Drawer de configuracao mascara segredos e informa permissoes solicitadas.
- Alerta antes de desconectar: impacto e dependencias.
- Empty: "Conecte um marketplace para iniciar a captura de ofertas."

## 15. Usuarios e permissoes

- Admin apenas.
- Tabela: usuario, email, papel, status, ultimo acesso.
- Acoes: "Convidar usuario", "Alterar papel", "Suspender acesso".
- Modal de convite: email, papel e resumo das permissoes.
- Confirmacao de alteracao mostra impacto antes de salvar.
- Empty: "Convide sua equipe para colaborar na curadoria."

## 16. Logs da automacao

- Admin: visao tecnica completa; Editor: apenas logs vinculados a publicacoes.
- Filter bar: severidade, fluxo, canal, periodo e busca por ID.
- Lista cronologica agrupada por execucao, com resumo humano.
- Detalhes tecnicos em acordeao: payload mascarado, tentativa e correlation ID.
- Acoes: "Reprocessar", "Copiar ID", "Ver publicacao".
- Mobile: resumo primeiro; detalhes tecnicos em tela separada.
- Empty: "Nenhum evento encontrado para este periodo."

## 17. Erro 404

- Ilustracao abstrata leve de radar, titulo "Esta pagina saiu do radar".
- Texto: "O endereco pode ter mudado ou nao estar mais disponivel."
- Acoes: "Voltar ao inicio" e "Ver ofertas".

## 18. Erro geral

- Titulo: "Nao foi possivel carregar esta area".
- Texto humano, ID de suporte recolhivel e status da ultima atualizacao.
- Acoes: "Tentar novamente" e "Voltar ao inicio".
- Se houver dados em cache, preserva conteudo e mostra alert local.

## 19. Empty state geral

- Componente reutilizavel com icone/ilustracao, titulo, explicacao e ate duas
  acoes.
- Tipos: primeiro uso, nenhum resultado, concluido e sem permissao.
- Nunca usar somente "Sem dados"; explicar por que e qual e o proximo passo.

## Public Visitor

- Nao possui tela de cadastro, login, dashboard ou qualquer rota de backoffice.
- No MVP, consome ofertas publicadas em canais externos e acessa somente o
  redirect publico `/r/{shortCode}`.
- Uma area publica/site de promocoes fica pÃ³s-MVP.

## PadrÃµes globais por breakpoint

| Elemento | Desktop | Tablet | Mobile |
|---|---|---|---|
| Sidebar | Fixa/recolhivel | Drawer | Menu "Mais" |
| Conteudo | 12 colunas | 8 colunas | 4 colunas |
| Preview | Rail/drawer | Drawer | Pagina inteira |
| Filtros | Barra + drawer | Chips + drawer | Drawer tela inteira |
| Tabelas | Completas | Colunas reduzidas | Rows expansivas |
| Acoes | Inline/sticky rail | Barra contextual | Barra inferior fixa |
| Modal | `480-720px` | `min(90vw)` | Bottom sheet/pagina |
