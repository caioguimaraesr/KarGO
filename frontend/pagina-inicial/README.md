# KarGO — Plataforma de Gestão e Marketplace de Fretes Inteligentes

O **KarGO** é uma plataforma moderna e responsiva voltada para conectar motoristas de cargas autônomos, PMEs de transporte e embarcadores corporativos. Este repositório contém a versão estática e de alta fidelidade visual (HTML5, CSS3, JavaScript e Tailwind CSS CDN) do frontend, pronta para apresentação ou deploy estático.

---

## 🚀 Recursos Principais do Design

* **Landing Page de Alto Impacto:** Apresentação premium, contadores estatísticos dinâmicos, seções sobre vantagens e público-alvo.
* **Portal de Autenticação Robusto:** Telas de login e fluxo de cadastro (*Wizard* multi-etapas com seleção de perfil de atuação).
* **Painel Operacional Completo:** Dashboard corporativo com visualização de métricas financeiras, gráficos operacionais e ações rápidas.
* **Marketplace de Cargas:** Feed de cargas dinâmico com buscas, filtros avançados por carroceria/veículo e modal de detalhamento.
* **Detalhe de Carga & Lógica Operacional:** Ficha completa de carregamento, timer de aceitação em tempo real, visualização de mapa simulado e candidaturas.
* **Minhas Viagens:** Fluxo de rotas em trânsito com barra de progresso, acompanhamento de propostas enviadas e avaliação de suporte via estrelas e comentários.
* **Chat Integrado:** Central de mensagens interativa com chips de respostas rápidas e compartilhamento de rota via mapa GPS.
* **Gestão Financeira & Pagamentos:** Interface de resgate via Pix com máscara monetária e validação de saldos, complementado por um extrato completo com filtros (Semanal, Mensal, Personalizado) e simulação de exportação de relatórios.
* **Perfil & Veículos:** Edição de dados cadastrais/bancários, painel de upload de documentos e gerenciamento de frota ativa com Drawer de solicitação.
* **Configurações:** Central de ajustes de alertas e preferências de sistema.

---

## 🛠️ Tecnologias Utilizadas

* **HTML5:** Estrutura semântica e acessível.
* **CSS3:** Estilização premium com glows neon, variáveis para reaproveitamento de cores e suporte à responsividade completa.
* **Vanilla JavaScript:** Lógica de interface local, manipulação do DOM e simulação de ações reativas rápidas no lado do cliente.
* **Tailwind CSS CDN:** Estilos auxiliares otimizados mantendo flexibilidade total no design original.
* **Google Fonts (Inter):** Tipografia limpa, corporativa e moderna.

---

## 📂 Estrutura de Pastas

```
pagina-inicial/
├── assets/             # Imagens e logotipos da plataforma
├── css/                # Folhas de estilo da aplicação (marketplace, auth, detalhe-carga, pagamentos, etc.)
├── js/                 # Scripts do cliente (controle de wizard, filtros, carregamento de arquivos, etc.)
├── index.html          # Landing page principal
├── login.html          # Entrada do portal
├── cadastro.html       # Fluxo de criação de conta
├── dashboard.html      # Painel administrativo
├── marketplace.html    # Feed de busca de fretes
├── detalhe-carga.html  # Ficha operacional de carregamento
├── minhas-viagens.html # Histórico e rotas em andamento
├── chat.html           # Central de atendimento e negociações
├── pagamentos.html     # Fluxo de resgate Pix e extrato financeiro
├── perfil.html         # Painel de dados e documentos do motorista
├── veiculos.html       # Frota cadastrada e drawer de nova inclusão
└── configuracoes.html  # Preferências de alertas do sistema
```

---

## 💻 Como Rodar o Projeto

Como este projeto é puramente estático, basta abrir qualquer um dos arquivos `.html` (recomendamos começar pelo `index.html` para a experiência de fluxo completo) diretamente em qualquer navegador moderno.

Alternativamente, se desejar rodar em um servidor web local simples:

### Usando Python
```bash
python -m http.server 8080
```

### Usando Node.js (http-server)
```bash
npx http-server -p 8080
```

Acesse **`http://localhost:8080`** no seu navegador de preferência.
