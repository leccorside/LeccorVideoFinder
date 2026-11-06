# PLANO DE IMPLEMENTAÇÃO POR ETAPAS — VIDEOFINDER

> **Status Geral:** Pronto para início. Aguardando o comando de gatilho do usuário: `"INICIE O PASSO 1"`.  
> **Convenção de Status:** `PENDENTE` | `EM_ANDAMENTO` | `CONCLUIDO` | `BLOQUEADO`

---

## Sumário das Etapas

| Etapa | Descrição | Status | Dependências |
| :---: | :--- | :---: | :--- |
| **1** | **Estrutura Inicial e Infraestrutura Conteinerizada** | `CONCLUIDO` | Nenhuma |
| **2** | **Interface e Design System Obsidian Signal** | `PENDENTE` | Etapa 1 |
| **3** | **Universal Video Search Engine (Core do Mecanismo)** | `PENDENTE` | Etapa 1, 2 |
| **4** | **Primeiras Fontes Reais (YouTube API v3 & SearXNG)** | `PENDENTE` | Etapa 3 |
| **5** | **Expansão de Plataformas (Vimeo, Dailymotion, Reddit, Twitch, TikTok, etc.)** | `PENDENTE` | Etapa 4 |
| **6** | **Inteligência Artificial Local e Busca Semântica (Ollama)** | `PENDENTE` | Etapa 3, 5 |
| **7** | **Pesquisa em Transcrições e Timestamps ("Encontrar Trecho")** | `PENDENTE` | Etapa 4, 6 |
| **8** | **Autenticação, Favoritos, Coleções e Histórico** | `PENDENTE` | Etapa 1, 3 |
| **9** | **Painel Admin Master e Telemetria de Quotas** | `PENDENTE` | Etapa 4, 8 |
| **10** | **Garantia de Qualidade, Testes Automatizados e Auditoria de Segurança** | `PENDENTE` | Todas as anteriores |

---

## Detalhamento das Etapas

### ETAPA 1 — Estrutura Inicial e Infraestrutura Conteinerizada
- **Objetivo:** Estabelecer a base do monorepo e da infraestrutura Docker com todos os contêineres funcionais, garantindo comunicação bidirecional entre Frontend (Next.js) e Backend (Laravel) através do Proxy Nginx.
- **Atividades:**
  1. Configuração do `docker-compose.yml` integrando `frontend`, `backend`, `mysql`, `redis`, `searxng`, `ollama` e `nginx`.
  2. Setup inicial do projeto Next.js 14+ com TypeScript, App Router e Tailwind CSS no diretório `frontend/`.
  3. Setup inicial do Laravel 11 com PHP 8.3 e extensões no diretório `backend/`.
  4. Configuração das variáveis de ambiente e arquivos `.env.example`.
  5. Criação do endpoint de saúde `/api/health` no backend e verificação de conectividade no frontend.
  6. Configuração dos volumes persistentes para MySQL, Redis, SearXNG e Ollama.
- **Arquivos Envolvidos:**
  - `docker-compose.yml`
  - `.env.example`
  - `infrastructure/nginx/default.conf`
  - `infrastructure/searxng/settings.yml`
  - `backend/Dockerfile`, `backend/composer.json`, `backend/routes/api.php`
  - `frontend/Dockerfile`, `frontend/package.json`, `frontend/src/app/page.tsx`
- **Critérios de Aceitação:**
  - O comando `docker compose up -d --build` sobe todos os serviços sem erros.
  - Acesso a `http://localhost:8080/` carrega a aplicação web.
  - Acesso a `http://localhost:8080/api/health` retorna status 200 JSON com estado dos serviços conectados (DB e Redis).
- **Status:** `CONCLUIDO`

---

### ETAPA 2 — Interface e Design System Obsidian Signal
- **Objetivo:** Transpor o protótipo visual de alta fidelidade presente em `uxui/` para a arquitetura de componentes do Next.js, mantendo fidelidade estrita ao `DESIGN.md`.
- **Atividades:**
  1. Configuração dos tokens de tema no `tailwind.config.ts` (paleta zinc, acentos `#8B5CF6`, `#06B6D4`, `#F43F5E`, fontes Plus Jakarta Sans, Inter, JetBrains Mono).
  2. Construção do layout base (`App Shell`): Sidebar de navegação fixa, Topbar com indicador de telemetria e atalhos (`⌘K`).
  3. Implementação do Omnibar Raycast-Style na tela inicial (`/`) com alternador de busca semântica e sugestões.
  4. Construção dos cards de vídeo (aspect ratio 16:9, zoom hover 1.03x, chips de duração, badges de plataforma e relevância).
  5. Criação do drawer lateral de inspeção de transcrições com timestamps (`Transcript Inspector Drawer`).
  6. Criação de layouts responsivos para Desktop, Tablet e Mobile.
  7. Configuração de estados visuais de carregamento (Skeletons pulsantes em tom zinco) e empty states.
- **Arquivos Envolvidos:**
  - `frontend/tailwind.config.ts`
  - `frontend/src/app/layout.tsx`
  - `frontend/src/app/page.tsx`
  - `frontend/src/app/search/page.tsx`
  - `frontend/src/components/layout/Sidebar.tsx`
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/components/search/Omnibar.tsx`
  - `frontend/src/components/video/VideoCard.tsx`
  - `frontend/src/components/video/TranscriptDrawer.tsx`
- **Critérios de Aceitação:**
  - Navegação fluida entre telas sem recarregar a página.
  - Fidelidade visual comprovada com os templates HTML de `uxui/in_cio_busca_universal_de_v_deos` e `uxui/resultados_de_busca_videofinder`.
  - Design totalmente dark-mode nativo com responsividade completa.
- **Status:** `PENDENTE`
- **Dependências:** Etapa 1

---

### ETAPA 3 — Universal Video Search Engine (Core do Mecanismo)
- **Objetivo:** Desenvolver o núcleo orquestrador de busca desacoplado em PHP/Laravel, capaz de consultar provedores concorrentemente, normalizar dados, deduplicar conteúdos e transmitir via SSE.
- **Atividades:**
  1. Criação da interface contratual `VideoSearchProviderInterface`.
  2. Criação dos DTOs imutáveis `SearchQueryDTO` e `VideoSearchResultDTO`.
  3. Desenvolvimento do `UniversalSearchOrchestrator` com execução assíncrona ou em lote paralelo.
  4. Implementação do serviço de normalização de URLs e deduplicação canônica (`CanonicalDeduplicator`).
  5. Implementação do algoritmo de ranqueamento ponderado (Score 0-100).
  6. Criação dos endpoints da API de pesquisa e do endpoint de streaming Server-Sent Events (`/api/search/{id}/stream`).
  7. Integração do TanStack Query e EventSource no frontend para recepção progressiva dos dados.
- **Arquivos Envolvidos:**
  - `backend/app/Contracts/VideoSearchProviderInterface.php`
  - `backend/app/DTOs/SearchQueryDTO.php`
  - `backend/app/DTOs/VideoSearchResultDTO.php`
  - `backend/app/Services/Search/UniversalSearchOrchestrator.php`
  - `backend/app/Services/Search/CanonicalDeduplicator.php`
  - `backend/app/Services/Search/RelevanceScorer.php`
  - `backend/app/Http/Controllers/SearchController.php`
  - `frontend/src/hooks/useVideoSearchStream.ts`
- **Critérios de Aceitação:**
  - O orquestrador processa buscas simuladas em múltiplos adaptadores retornando lista deduplicada e ranqueada.
  - Resultados chegam à interface progressivamente via SSE sem travamento da UI.
- **Status:** `PENDENTE`
- **Dependências:** Etapa 1, 2

---

### ETAPA 4 — Primeiras Fontes Reais (YouTube API v3 & SearXNG)
- **Objetivo:** Conectar as primeiras fontes de dados reais sem simulações fictícias, respeitando cotas gratuitas e políticas de acesso.
- **Atividades:**
  1. Implementação do `YouTubeProvider` consumindo a YouTube Data API v3 gratuita.
  2. Implementação do `YouTubeQuotaGuard` no Redis para controle rígido do limite diário de 10.000 pontos.
  3. Implementação do `SearXNGWebVideoProvider` integrando a instância interna do SearXNG para descoberta web de vídeos.
  4. Desenvolvimento de extração de metadados reais (título, autor, thumbnail oficial, duração formatada e link direto).
  5. Cache agressivo no Redis de consultas idênticas e metadados de vídeos.
  6. Ativação de fallback automático para SearXNG quando a quota do YouTube expirar.
- **Arquivos Envolvidos:**
  - `backend/app/Services/Providers/YouTubeProvider.php`
  - `backend/app/Services/Providers/YouTubeQuotaGuard.php`
  - `backend/app/Services/Providers/SearXNGWebVideoProvider.php`
  - `backend/app/Services/Cache/VideoSearchCache.php`
- **Critérios de Aceitação:**
  - Uma pesquisa real (ex: "Nunca desista dos seus sonhos") retorna vídeos autênticos do YouTube com links funcionais.
  - Em caso de ausência ou esgotamento de chave do YouTube, a descoberta SearXNG continua localizando vídeos públicos reais.
- **Status:** `PENDENTE`
- **Dependências:** Etapa 3

---

### ETAPA 5 — Expansão de Plataformas (Vimeo, Dailymotion, Reddit, Twitch, TikTok, etc.)
- **Objetivo:** Adicionar adaptadores para múltiplas plataformas públicas utilizando APIs abertas e descoberta web autorizada.
- **Atividades:**
  1. Criação do `VimeoProvider` (API oficial pública gratuita).
  2. Criação do `DailymotionProvider` (API REST pública).
  3. Criação do `RedditProvider` (extração de postagens com embeds de vídeo da API pública do Reddit).
  4. Criação do `TwitchProvider` (Clipes e VODs via Twitch Developer API).
  5. Criação do `TikTokDiscoveryProvider` (Descoberta web via SearXNG com extração de URLs públicas).
  6. Criação do `SocialReelsDiscoveryProvider` (Instagram Reels, Kwai, Facebook Watch).
  7. Configuração do Circuit Breaker individual por provedor para isolar falhas de rede.
- **Arquivos Envolvidos:**
  - `backend/app/Services/Providers/VimeoProvider.php`
  - `backend/app/Services/Providers/DailymotionProvider.php`
  - `backend/app/Services/Providers/RedditProvider.php`
  - `backend/app/Services/Providers/TwitchProvider.php`
  - `backend/app/Services/Providers/TikTokDiscoveryProvider.php`
  - `backend/app/Services/Providers/SocialReelsDiscoveryProvider.php`
  - `backend/app/Services/CircuitBreaker/CircuitBreaker.php`
- **Critérios de Aceitação:**
  - O usuário pode selecionar/desmarcar provedores específicos nos filtros da interface.
  - Se uma plataforma estiver instável, os demais provedores retornam seus resultados normalmente sem gerar erro 500.
- **Status:** `PENDENTE`
- **Dependências:** Etapa 4

---

### ETAPA 6 — Inteligência Artificial Local e Busca Semântica (Ollama)
- **Objetivo:** Habilitar recursos de busca vetorial, expansão de consultas e sumarização semântica usando modelos de IA 100% locais e gratuitos via Ollama.
- **Atividades:**
  1. Integração do backend com o endpoint local do Ollama (`videofinder-ollama:11434`).
  2. Implementação do serviço de geração de embeddings com modelo multilíngue compacto (`nomic-embed-text`).
  3. Cálculo de similaridade por cosseno entre o vetor da pesquisa e os vetores de títulos/descrições em cache.
  4. Implementação do recurso de "Expansão de Query" (geração de variações semânticas para enriquecer a busca nas fontes).
  5. Criação de fallback gracioso automático: se o contêiner do Ollama estiver indisponível, a busca opera em modo puramente léxico.
- **Arquivos Envolvidos:**
  - `backend/app/Services/AI/OllamaService.php`
  - `backend/app/Services/AI/EmbeddingService.php`
  - `backend/app/Services/AI/QueryExpander.php`
  - `backend/app/Services/AI/CosineSimilarity.php`
  - `frontend/src/components/search/AISemanticPill.tsx`
- **Critérios de Aceitação:**
  - Buscas complexas em linguagem natural (ex: "vídeos motivacionais sobre superar fracassos") ativam termos sinônimos automaticamente.
  - A desativação intencional do Ollama não quebra a busca da aplicação.
- **Status:** `PENDENTE`
- **Dependências:** Etapa 3, 5

---

### ETAPA 7 — Pesquisa em Transcrições e Timestamps ("Encontrar Trecho")
- **Objetivo:** Localizar falas e expressões exatas dentro do conteúdo falado do vídeo, exibindo o momento exato (minutagem) e link direto sincronizado.
- **Atividades:**
  1. Criação das tabelas e modelos de transcrição (`video_transcripts`, `video_transcript_segments`).
  2. Integração com fontes de legendas públicas autorizadas (Closed Captions oficiais do YouTube e metadados de provedores).
  3. Implementação do motor de busca textual em trechos de fala com realce de termos e cálculo de offset temporal.
  4. Construção da funcionalidade de link com timestamp (ex: `https://youtube.com/watch?v=...&t=222s`).
  5. Sincronização do player/modal da interface com a lista de transcrições interativas.
- **Arquivos Envolvidos:**
  - `backend/app/Services/Transcript/TranscriptSearchService.php`
  - `backend/app/Models/VideoTranscript.php`
  - `backend/app/Models/VideoTranscriptSegment.php`
  - `frontend/src/components/video/TranscriptViewer.tsx`
- **Critérios de Aceitação:**
  - Ao pesquisar uma frase existente na transcrição autorizada de um vídeo, o card exibe o momento exato em formato `MM:SS`.
  - Clicar em "Assistir a partir de MM:SS" abre o vídeo no ponto correto.
  - Vídeos sem legendas públicas exibem a mensagem clara: "Não foi possível verificar falas dentro deste vídeo".
- **Status:** `PENDENTE`
- **Dependências:** Etapa 4, 6

---

### ETAPA 8 — Autenticação, Favoritos, Coleções e Histórico
- **Objetivo:** Implementar o gerenciamento de contas de usuários, persistência de vídeos favoritados, organização em coleções temáticas e histórico pessoal de pesquisas.
- **Atividades:**
  1. Configuração do Laravel Sanctum para autenticação SPA via tokens e cookies seguros.
  2. Implementação dos fluxos de cadastro, login, logout, verificação de e-mail e recuperação de senha.
  3. Criação dos CRUDs de Favoritos e Coleções com persistência relacional no MySQL.
  4. Implementação do Histórico de Pesquisas com suporte a repetição de consultas, remoção de itens e opção de pausar histórico.
  5. Interface no Next.js para gerenciamento de coleções e histórico baseada nos protótipos de `uxui`.
- **Arquivos Envolvidos:**
  - `backend/app/Http/Controllers/AuthController.php`
  - `backend/app/Http/Controllers/FavoriteController.php`
  - `backend/app/Http/Controllers/CollectionController.php`
  - `backend/app/Http/Controllers/SearchHistoryController.php`
  - `frontend/src/app/favorites/page.tsx`
  - `frontend/src/app/history/page.tsx`
  - `frontend/src/stores/authStore.ts`
- **Critérios de Aceitação:**
  - Visitantes anônimos conseguem pesquisar normalmente;
  - Usuários logados conseguem salvar vídeos, criar coleções nomeadas e revistar pesquisas passadas.
- **Status:** `PENDENTE`
- **Dependências:** Etapa 1, 3

---

### ETAPA 9 — Painel Admin Master e Telemetria de Quotas
- **Objetivo:** Disponibilizar uma interface administrativa completa para monitoramento da infraestrutura, cotas de APIs gratuitas, saúde dos provedores e gestão de parâmetros do sistema.
- **Atividades:**
  1. Criação do papel `ADMIN_MASTER` com middleware de proteção.
  2. Dashboard administrativo com métricas consolidadas (buscas totais, latência média, cache hit rate, erros por plataforma).
  3. Painel de gerenciamento de conectores (ativar/desativar provedores, testar conectividade, monitorar quotas do YouTube).
  4. Painel de monitoramento do Ollama (status do serviço, modelos instalados, teste de inferência).
  5. Interface Next.js no padrão Obsidian Signal baseada em `uxui/dashboard_m_tricas_videofinder` e telas de configurações.
- **Arquivos Envolvidos:**
  - `backend/app/Http/Controllers/Admin/DashboardController.php`
  - `backend/app/Http/Controllers/Admin/ProviderController.php`
  - `backend/app/Http/Controllers/Admin/SystemSettingsController.php`
  - `frontend/src/app/admin/dashboard/page.tsx`
  - `frontend/src/app/admin/providers/page.tsx`
- **Critérios de Aceitação:**
  - Administrador consegue testar um conector em tempo real e visualizar o status verde/vermelho.
  - Estatísticas de pesquisas e consumo de cotas exibidas com gráficos funcionais.
- **Status:** `PENDENTE`
- **Dependências:** Etapa 4, 8

---

### ETAPA 10 — Garantia de Qualidade, Testes Automatizados e Auditoria de Segurança
- **Objetivo:** Validar exaustivamente a resiliência do sistema, cobertura de testes e cumprimento de todas as diretrizes de segurança e conformidade.
- **Atividades:**
  1. Desenvolvimento de testes unitários para o orquestrador, deduplicador e cálculo de relevância.
  2. Testes de integração para os adaptadores de provedores e fallbacks de erro/quota.
  3. Testes de ponta a ponta (E2E) simulando fluxo de pesquisa e filtros na interface.
  4. Auditoria de proteção contra SSRF (validação de IPs de intranet e esquemas de URL).
  5. Auditoria de sanitização de strings de terceiros contra XSS e SQL Injection.
  6. Revisão final da documentação e checklist dos critérios de aceitação.
- **Arquivos Envolvidos:**
  - `backend/tests/Unit/SearchOrchestratorTest.php`
  - `backend/tests/Unit/CanonicalDeduplicatorTest.php`
  - `backend/tests/Feature/SearchApiTest.php`
  - `backend/tests/Feature/SecurityValidationTest.php`
  - `frontend/src/__tests__/VideoCard.test.tsx`
- **Critérios de Aceitação:**
  - Todos os testes automatizados executam e passam no CI/CD ou localmente com 100% de sucesso.
  - Zero vulnerabilidades conhecidas de injeção ou SSRF.
  - Cumprimento rigoroso de todos os 20 critérios de aceitação descritos na Seção 31 do `PROMPT.md`.
- **Status:** `PENDENTE`
- **Dependências:** Todas as etapas anteriores

