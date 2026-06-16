# Visao do produto e fluxos

## Norte de experiencia

O Radar de Ofertas e uma central editorial orientada a acao. A pergunta
principal da interface nao e "o que aconteceu?", mas sim "qual e a proxima
melhor acao?".

### Principios

1. **Acao antes de metrica:** a primeira dobra destaca ofertas prontas, fila
   pendente e publicacoes que exigem atencao.
2. **Decisao com contexto:** score, preco historico, desconto, cupom, frete e
   comissao ficam juntos da acao.
3. **Progressive disclosure:** filtros avancados, logs tecnicos e detalhes de
   score aparecem sob demanda.
4. **Confianca operacional:** toda automacao informa status, ultima execucao,
   impacto e proxima tentativa.
5. **Permissao evidente:** a interface esconde acoes impossiveis e explica
   restricoes entre Admin e Editor quando um link direto e acessado.

## Arquitetura de informacao

### Navegacao principal

- Inicio
- Ofertas
  - Capturadas
  - Historico de precos
  - Cupons
- Publicacao
  - Fila de aprovacao
  - Agendamentos
  - Canais
- Analises
  - Cliques e conversoes
- Administracao
  - Categorias e tags
  - Integracoes
  - Usuarios e permissoes
  - Logs da automacao

### Navegacao por papel

| Area | Admin | Editor |
|---|---:|---:|
| Inicio, ofertas, detalhes, relatorios | Total | Total |
| Editar post, aprovar, rejeitar, agendar | Total | Total |
| Canais | Configurar | Visualizar status |
| Categorias e tags | Gerenciar | Usar |
| Integracoes, usuarios e logs tecnicos | Total | Oculto |

### Public Visitor

O consumidor final nao acessa o backoffice, nao autentica e nao pertence a
workspace. No MVP, interage com ofertas publicadas em canais como Telegram e com
o redirect publico `/r/{shortCode}`. Uma area publica de ofertas fica pÃ³s-MVP.

## Shell da aplicacao

### Desktop, 1280px ou mais

- Sidebar fixa de `256px`, recolhivel para `72px`.
- Header de `64px` com busca global, status da automacao, notificacoes,
  alternancia de tema e menu do usuario.
- Conteudo com largura maxima de `1600px`, padding lateral de `32px`.
- Drawer contextual de preview com `420px`, sem trocar a rota de trabalho.

### Tablet, 768px a 1279px

- Sidebar recolhida por padrao; abre como drawer.
- Header preserva busca, notificacoes e menu.
- Grids passam para duas colunas.
- Preview abre como drawer de `min(480px, 88vw)`.

### Mobile, ate 767px

- Header de `56px`, busca em tela dedicada.
- Bottom navigation: Inicio, Ofertas, Aprovar, Agenda, Mais.
- CTA principal fica em barra fixa inferior quando existe uma decisao.
- Tabelas viram listas de linhas expansivas; nunca cards soltos em excesso.
- Preview e editor usam pagina inteira.

## Fluxos obrigatorios

### 1. Melhores ofertas do dia

`Login > Inicio > Curadoria de hoje > Selecionar oferta > Preview lateral`

- Inicio abre com "Requer sua atencao" e a curadoria em tres estagios.
- Cada item mostra score, preco, sinais de valor e proxima acao.
- Editor/Admin ve "Revisar" ou "Aprovar".

### 2. Filtrar ofertas

`Ofertas > Barra de filtros > Aplicar > Salvar visualizacao opcional`

- Filtros rapidos: marketplace, categoria, score, desconto e data.
- "Mais filtros" abre drawer com cupom, frete, comissao e status.
- Chips ativos ficam removiveis acima dos resultados.

### 3. Abrir detalhe e historico

`Oferta > Detalhe > Aba Historico de preco`

- Hero apresenta produto, score e destaques.
- Coluna principal explica o score e mostra grafico.
- Coluna lateral exibe preview e acoes permitidas.

### 4. Editar, aprovar e agendar

`Fila > Revisar > Editor > Preview por canal > Aprovar e agendar > Confirmar`

- Autosave visivel: "Alteracoes salvas agora".
- Preview alterna WhatsApp, Telegram e Social.
- Confirmacao resume canais, data, horario e fuso.

### 5. Investigar falha

`Notificacao de falha > Publicacao > Ver logs > Reprocessar`

- Erro e traduzido em linguagem humana primeiro.
- Detalhes tecnicos ficam em acordeao.
- Admin pode reprocessar; Editor ve status e solicita ajuda.

### 6. Configurar canais

`Canais > Adicionar canal > Selecionar tipo > Credenciais > Testar > Ativar`

- Stepper de quatro etapas.
- Segredos nunca reaparecem completos.
- Teste e obrigatorio antes de ativar.

### 7. Bloqueio amigavel entre papeis internos

`Link restrito > Tela de acesso limitado > Voltar ao inicio`

- Mensagem: "Esta area e reservada para administradores."
- Editor recebe alternativa util ao tentar acessar uma area exclusiva de Admin.
