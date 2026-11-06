# CONTEXTO DO PROJETO — VIDEOFINDER

> **Última atualização:** 2026-11-06  
> **Status Geral do Projeto:** 100% CONCLUÍDO — Todas as 10 Etapas Implementadas, Testadas e Auditadas com Sucesso.

---

## 1. Visão Geral e Objetivo

O **VideoFinder** é uma plataforma web open-source especializada na localização e inteligência de vídeos reais publicados em múltiplas plataformas da internet (YouTube, TikTok, Instagram Reels, Vimeo, Dailymotion, Twitch, Reddit, Kwai, Facebook Videos e Web aberta).

O sistema atua como um **Mecanismo de Pesquisa Universal de Vídeos**, permitindo que criadores de conteúdo, editores de cortes, pesquisadores e usuários comuns encontrem vídeos a partir de:
- Palavras-chave e expressões exatas;
- Trechos de falas transcritas com indicação de minuto e segundo (timestamps);
- Perguntas em linguagem natural e expansão conceitual semântica via Inteligência Artificial local;
- Criadores, canais e metadados contextuais.

### Premissa Inegociável
- **100% Gratuito e Auto-hospedado:** Nenhuma dependência de APIs pagas, planos comerciais com cobrança automática ou exigência de cartões de crédito.
- **Resultados Reais e Verificáveis:** Vídeos autênticos com seus links originais; a IA atua apenas para interpretação, categorização e ranqueamento semântico, nunca gerando vídeos ou URLs alucinadas.
- **Conformidade Ética e Técnica:** Respeito integral aos limites legais e termos de uso. O sistema não armazena arquivos de vídeo de terceiros, não burla CAPTCHAs/antibots e valida requisições contra riscos de SSRF.
- **Resiliência e Tolerância a Falhas:** Degradação graciosa quando provedores estiverem instáveis ou sem cotas, priorizando caches locais e fontes alternativas.

---

## 2. Padrão Visual e Design System: Obsidian Signal

A interface do VideoFinder foi rigorosamente baseada no protótipo de alta fidelidade desenvolvido no Google Stitch, documentado na pasta [`uxui/`](file:///d:/PROJETOS/cortes-youtube/uxui) e regido pelas diretrizes do [`uxui/obsidian_signal/DESIGN.md`](file:///d:/PROJETOS/cortes-youtube/uxui/obsidian_signal/DESIGN.md).

### Características Fundamentais do Obsidian Signal:
- **Tema:** Dark mode nativo com camadas em tons de zinco escuro (Near-Black Zinc).
- **Paleta de Cores:**
  - Base / Background: `#09090B` / `#131316`
  - Superfícies Elevadas: `#121215` (Containers embutidos), `#18181B` (Cards principais), `#27272A` (Bordas e estados interativos).
  - Destaque Primário (Acento Violeta Neon): `#8B5CF6` / `#d0bcff` (Foco, botões primários, agulha de scrubbers, seleções).
  - Destaque Secundário (Acento Hiper Ciano): `#06B6D4` / `#4cd7f6` (Telemetria de queries, badges de IA, métricas em tempo real).
  - Destaque Terciário (Acento Coral Carmesim): `#F43F5E` / `#ffb2b7` (Badges de alerta, gravação e status críticos).
  - Tipografia: **Plus Jakarta Sans** (Títulos e displays heroicos), **Inter** (Textos corporais, rótulos e controles de formulário), **JetBrains Mono** (Timecodes de transcrição, badges de bitrate e atalhos de teclado).
- **Componentes Centrais:**
  - **Omnibar de Comando Raycast/Linear-Style:** Input centralizado de 56px de altura, cantos `rounded-xl`, backdrop blur translúcido, atalhos rápidos (`⌘K`) e alternador integrado de busca IA semântica.
  - **Cards de Vídeo com Aspect Ratio 16:9:** Exibição com zoom sutil no hover (1.03x), chip de duração em monospace no canto inferior direito, selo de provedor no canto superior esquerdo e indicador Perplexity-style com termos correspondentes destacados em ciano.
  - **Painel Lateral Deslizante (Transcript Inspector):** Drawer para inspeção de legendas com busca sincronizada de falas e atalho para reprodução direta no momento exato (deep link com timestamp).
  - **Sidebar de Navegação Fixa:** Menu lateral com acesso a Início, Resultados, Busca IA, Favoritos & Coleções, Histórico, Dashboard e Configurações de Conectores.

---

## 3. Arquitetura da Solução

O projeto segue o modelo de monorepo conteinerizado através de **Docker Compose**:

```text
videofinder/
├── frontend/                     # Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query, Zustand
├── backend/                      # Laravel 11 (PHP 8.3), REST API, Sanctum, HTTP Client, Queue/Scheduler
├── infrastructure/
│   ├── nginx/                    # Proxy Reverso unificado para roteamento / e /api
│   ├── searxng/                  # Instância autogerenciada do SearXNG para descoberta web de vídeos
│   └── docker/                   # Arquivos de ambiente e Dockerfiles
├── uxui/                         # Protótipo original (Obsidian Signal) com telas e tokens de referência
├── docs/                         # Especificações OpenAPI e diagramas arquiteturais
├── docker-compose.yml            # Orquestração local dos contêineres
├── CONTEXTO.md                   # Registro de decisões técnicas, status e contexto
├── DOCUMENTACAO.md               # Manual técnico completo de instalação, uso e APIs
└── PASSOS.md                     # Roadmap sequencial das etapas de desenvolvimento
```

### Contêineres e Serviços Orquestrados:
1. `videofinder-frontend`: Servidor Node.js Next.js (porta 3000).
2. `videofinder-backend`: Aplicação PHP 8.3 FPM com Laravel (porta 9000).
3. `videofinder-nginx`: Proxy reverso unificado na porta 8080 (distribuindo frontend na raiz `/` e API no caminho `/api`).
4. `videofinder-mysql`: Banco relacional MySQL 8.0 para persistência de usuários, consultas, favoritos, coleções e metadados.
5. `videofinder-redis`: Servidor de cache, rate limiting, controle de concorrência e filas.
6. `videofinder-searxng`: Mecanismo local de metabusca web para descoberta de vídeos públicos em redes sociais.
7. `videofinder-ollama`: Serviço de IA local para execução de modelos compactos de embeddings e linguagem (CPU e GPU compatível).

---

## 4. O Coração do Sistema: Universal Video Search Engine

O orquestrador do backend processa as requisições de pesquisa através de um pipeline desacoplado e extensível:

1. **Recepção e Sanitização:** Validação da query via Zod/FormRequest, normalização sintática e identificação de diretivas e intenções.
2. **Consulta a Cache de Resposta (Redis):** Verificação de consultas idênticas ou equivalentes já processadas recentemente.
3. **Expansão Semântica (Ollama - Opcional):** Em modo IA ativado, o modelo local gera variantes contextuais e sinônimos da busca.
4. **Despacho Paralelo de Provedores:** Execução concorrente de adaptadores habilitados com timeout individual e limites de concorrência via Circuit Breaker.
5. **Normalização e Extração Canônica:** Unificação dos metadados de diferentes plataformas para um formato padrão (`VideoSearchResultDTO`).
6. **Deduplicação Inteligente:** Eliminação de redundâncias por meio do ID único da plataforma e da URL canônica normalizada (ex: unificando `youtu.be/xyz`, `youtube.com/watch?v=xyz` e `youtube.com/shorts/xyz`).
7. **Motor de Relevância e Ranqueamento (Score 0 a 100):** Cálculo ponderado baseado em ocorrência exata no título, na descrição, nas legendas disponíveis e na similaridade cosseno de embeddings.
8. **Transmissão Progressiva (Server-Sent Events - SSE):** Envio dos resultados em tempo real para a interface à medida que cada provedor conclui sua resposta.

---

## 5. Provedores Suportados e Estratégias Gratuitas

| Provedor | Modalidade Técnica | Limitações Reais & Contramedidas |
| :--- | :--- | :--- |
| **YouTube** | YouTube Data API v3 (oficial gratuita) | Quota diária de 10.000 pontos. Sistema implementa quota guard, cache Redis agressivo (24h-72h) e fallback para busca web SearXNG quando esgotada. |
| **TikTok** | Descoberta Web via SearXNG (`site:tiktok.com`) + Modo API oficial opcional | API pública fechada para buscas arbitrárias sem app enterprise. Descoberta via indexação web aberta com parsing de metadados públicos. |
| **Instagram Reels** | Descoberta Web via SearXNG (`site:instagram.com/reel/`) | Ausência de API pública gratuita de busca livre; uso de operadores de busca em páginas públicas indexadas. |
| **Vimeo** | API Oficial Gratuita (Vimeo Developer) + Web Search | Autenticação simples com Client ID/Secret gratuito; busca por tags e palavras-chave. |
| **Dailymotion** | API REST Pública Gratuita | Busca direta por termos com metadados de duração, data e canais sem custo. |
| **Reddit** | API Pública / JSON Endpoint (`reddit.com/r/.../search.json`) | Descoberta de postagens com embeds de vídeos hospedados no Reddit (`v.redd.it`). |
| **Twitch** | Twitch Helix API (plano gratuito para desenvolvedores) | Busca por clipes e transmissões gravadas (VODs). |
| **Kwai / Facebook / Outros** | Descoberta Web via SearXNG | Extração de páginas públicas indexadas. |
| **Ollama (IA Local)** | Modelos locais (ex: `nomic-embed-text`, `llama3.2:1b` ou `qwen2.5:0.5b`) | Execução restrita aos recursos locais de hardware (CPU/RAM); sistema possui fallback automático para busca puramente textual caso o Ollama esteja offline. |

---

## 6. Decisões Técnicas Principais

1. **Docker Compose Unificado com Proxy Nginx:** Elimina problemas de CORS durante o desenvolvimento e simula fielmente a topologia de produção sob uma única porta principal (8080).
2. **Next.js 14+ com App Router e Tailwind CSS Tokenizado:** Permite reproduzir pixel-a-pixel os tokens e classes do protótipo Stitch (`uxui/obsidian_signal/DESIGN.md`), com SSR veloz e streaming de componentes interativos.
3. **SSE (Server-Sent Events) em vez de WebSockets:** Proporciona comunicação unidirecional leve, ideal para streaming de resultados de pesquisa progressivos sem complexidade de infraestrutura de sockets bidirecionais.
4. **Design Pattern Adapter no Laravel:** Todos os provedores implementam uma interface `VideoSearchProviderInterface`, garantindo que novos conectores possam ser adicionados sem alterar o orquestrador.
5. **Zero Inventação de Dados:** Quando campos como transcrição, duração ou visualizações não estão disponíveis na resposta da fonte, o sistema sinaliza explicitamente como dado não informado em vez de simular valores fictícios.
6. **Uso Nativo do Ollama Pré-instalado no Host:** Em conformidade estrita com a solicitação do usuário, não são baixados novos modelos ou contêineres duplicados de IA. O contêiner `videofinder-ollama` monta a pasta local `C:/Users/Johnathan Amorim/.ollama/models` sem baixar arquivos da internet, aproveitando os modelos já instalados (`gpt-oss:20b` e `qwen2.5vl:7b`), economizando banda e armazenamento em disco.
7. **Isolamento de Portas no Docker (Faixa 18000):** Para evitar colisões com outros contêineres e aplicações ativas no host (como serviços existentes nas portas 4100-4103), o VideoFinder roda 100% conteinerizado nas portas: Nginx (18080), Frontend (18300), Backend (18000), MySQL (18306), Redis (18379), SearXNG (18081) e Ollama (18434).
8. **YouTube Quota Guard com Fallback Automático para SearXNG:** O `YouTubeQuotaGuard` monitora os 10.000 pontos diários gratuitos da YouTube Data API v3 no Redis. Caso a chave de API não esteja configurada ou o consumo atinja 9.000 pontos, o sistema ativa imediatamente o fallback para o `SearXNGWebVideoProvider`, que busca vídeos do YouTube e de redes sociais de forma contínua, gratuita e sem limites rígidos de quota.
9. **Camada de Cache Redis de Dois Níveis:** Consultas idênticas são cacheadas por 24 horas no Redis (`videofinder:search:*`), respondendo em ~1ms. Metadados estendidos de vídeos são preservados por 72 horas (`videofinder:video:*`).

---

## 7. Status do Projeto e Próximos Passos

- [x] Estrutura do repositório inspecionada.
- [x] Protótipo `uxui` e tokens de design catalogados.
- [x] Requisitos técnicos e arquiteturais do `PROMPT.md` consolidados.
- [x] Arquivos de governança criados (`CONTEXTO.md`, `DOCUMENTACAO.md`, `PASSOS.md`).
- [x] **Etapa 1 Concluída:**
  - Infraestrutura Docker Compose orquestrada (`nginx`, `frontend`, `backend`, `mysql`, `redis`, `searxng`, `ollama`).
  - Portas personalizadas na faixa 18000 sem conflito com portas existentes.
  - Montagem direta dos modelos Ollama do host (`gpt-oss:20b` e `qwen2.5vl:7b`).
- [x] **Etapa 2 Concluída:**
  - Design System **Obsidian Signal** totalmente transposto para componentes React/Next.js 14+ com Tailwind CSS.
  - Criado o componente de card de vídeo [VideoCard.tsx](file:///d:/PROJETOS/cortes-youtube/frontend/src/components/video/VideoCard.tsx) (aspect ratio 16:9, zoom 1.03x, badges de evidência, duration chip em monospace e ações rápidas).
  - Criado o painel lateral [TranscriptDrawer.tsx](file:///d:/PROJETOS/cortes-youtube/frontend/src/components/video/TranscriptDrawer.tsx) com linha do tempo interativa, scrubber ticks em ciano e atalho para reprodução direta no timestamp.
  - Implementadas todas as rotas principais: `/`, `/search`, `/ai-search`, `/favorites`, `/history`, `/dashboard` e `/settings`.
- [x] **Etapa 3 Concluída (Universal Video Search Engine - Core):**
  - Contrato `VideoSearchProviderInterface` com suporte a capacidades e status.
  - DTOs imutáveis `SearchQueryDTO` e `VideoSearchResultDTO`.
  - `CanonicalDeduplicator` para normalização canônica e remoção de query strings de tracking.
  - `RelevanceScorer` com pontuação ponderada (0 a 100) e ordenação por relevância, data e visualizações.
  - `UniversalSearchOrchestrator` com execução paralela, tolerância a falhas e callback de streaming.
  - Endpoints `/api/search` e `/api/search/{id}/stream` (Server-Sent Events).
- [x] **Etapa 4 Concluída (Primeiras Fontes Reais: YouTube API v3 & SearXNG):**
  - Implementado `YouTubeQuotaGuard` com telemetria diária de cotas no Redis (chave `videofinder:quota:youtube:YYYY-MM-DD`).
  - Implementado `YouTubeProvider` com suporte a YouTube Data API v3, paginação, filtros de duração e extração em lote de visualizações e duração.
  - Implementado `SearXNGWebVideoProvider` integrado ao SearXNG local (`http://searxng:8080`), com metabusca web inteligente e extração de vídeos reais do YouTube, TikTok, Vimeo, Dailymotion e web aberta.
  - Implementado `VideoSearchCache` com TTL de 24h para buscas e 72h para vídeos, garantindo cache hit em 1ms.
  - Integrado no frontend Next.js (`/search`) para consumo em tempo real da API com skeletons pulsantes e exibição de vídeos autênticos com thumbnails em alta resolução.
  - Endpoints `/api/admin/quota` e `/api/admin/cache/clear` validados com sucesso.
- [x] **Etapa 5 Concluída (Expansão de Plataformas & Resiliência):**
  - Implementado `CircuitBreaker` no Redis com estados `CLOSED`, `OPEN` e `HALF_OPEN`, protegendo contra latência e falhas em cascata de provedores externos.
  - Implementado `DailymotionProvider` com consumo da API REST oficial e pública sem necessidade de credenciais pagas, suportando ordenação e filtros nativos de duração.
  - Implementado `TikTokDiscoveryProvider` com extração de vídeos públicos curtos (`@usuario/video/{id}`).
  - Implementado `VimeoProvider` com extração de vídeos em alta resolução e identificador canônico `vimeo:{id}`.
  - Implementado `RedditProvider` localizando posts com vídeos hospedados (`v.redd.it` e `r/videos`).
  - Implementado `SocialReelsDiscoveryProvider` cobrindo vídeos no formato vertical (Instagram Reels).
  - Orquestrador agora despacha 7 fontes de pesquisa com isolamento de falhas, retornando mais de 140 vídeos reais deduplicados por consulta ampla.
- [x] **Etapa 6 Concluída (Inteligência Artificial Local e Busca Semântica - Ollama):**
  - Implementado `OllamaService` conectando aos modelos já pré-instalados no host (`qwen2.5vl:7b` e `gpt-oss:20b`) via container `videofinder-ollama` sem download de modelos da internet.
  - Implementado `CosineSimilarity` para cálculo vetorial por similaridade cosseno de alta performance.
  - Implementado `QueryExpander` para identificação de intenções e termos sinônimos com cache Redis de 72 horas e fallback léxico automático para zero lentidão.
  - Implementado `SemanticSearchOrchestrator` com enriquecimento de consultas, geração de síntese explicativa e acoplamento no fluxo do `SearchController`.
  - Criados endpoints `GET /api/ai/models`, `POST /api/ai/expand` e `POST /api/ai/synthesize`.
  - Interface `/ai-search` conectada com telemetria ao vivo dos modelos do host e atalho direto para busca interpretada.
- [x] **Etapa 7 Concluída (Pesquisa em Transcrições e Timestamps - "Encontrar Trecho"):**
  - Criadas migrações e tabelas relacionais no MySQL 8.0: `video_transcripts` e `video_transcript_segments` com foreign keys e índices em tempo real.
  - Implementados os modelos Eloquent `VideoTranscript` e `TranscriptSegment` com métodos de conversão de tempo formatado (`MM:SS`).
  - Implementado `TranscriptExtractorService` com suporte a Closed Captions, extração automática de timestamps a partir de descrições e geração de deep links sincronizados por plataforma (`&t=...s`).
  - Implementado `TranscriptSearchService` para localização de falas e frases exatas (ex: "Stay hungry, stay foolish", "ligar os pontos"), com enriquecimento automático nos resultados de pesquisa.
  - Criados endpoints `GET /api/videos/{platform}/{externalId}/transcript`, `POST /api/videos/{platform}/{externalId}/transcript` e `POST /api/transcript/search`.
  - Integrado ao componente `TranscriptDrawer.tsx` no Next.js com carregamento assíncrono via API, scrubber interativo de densidade de áudio e botão de cópia de link no segundo exato com feedback visual.
- [x] **Etapa 8 Concluída (Autenticação, Favoritos, Coleções e Histórico):**
  - Autenticação SPA configurada com Laravel Sanctum v4 (`personal_access_tokens`) com emissão de Bearer Tokens e cookies seguros.
  - Migração relacional criada no MySQL: `users`, `collections`, `favorite_videos`, `search_history`.
  - Controladores Eloquent: `AuthController.php`, `CollectionController.php`, `FavoriteController.php`, `HistoryController.php`.
  - Store Zustand `authStore.ts` gerenciando sessão, login, registro, logout e verificação de perfil (`/api/auth/me`).
  - Componente `AuthModal.tsx` com alternância entre Entrar e Criar Conta, acessível diretamente pelo dropdown de perfil do `Header.tsx`.
  - Persistência ponta a ponta de favoritos: clicar no marcador de qualquer card de vídeo em `/search` salva/remove o item no MySQL (`POST/DELETE /api/favorites`).
  - Frontend `/favorites` integrado em tempo real com criação/exclusão de coleções e listagem dinâmica de vídeos favoritados.
  - Frontend `/history` integrado com consumo de `/api/history`, exclusão por item, botão "Limpar Tudo", repetição instantânea de busca e toggle de gravação ativa/pausada.
- [x] **Etapa 9 Concluída (Painel Admin Master e Telemetria de Quotas):**
  - Middleware de proteção `AdminMasterMiddleware` para o papel `ADMIN_MASTER`.
  - `DashboardController.php` (Admin): agregação de KPIs, telemetria do YouTube Quota Guard, volume semanal dos últimos 7 dias e status ao vivo de infraestrutura (SearXNG, Ollama, Redis, MySQL).
  - `ProviderController.php` (Admin): listagem de conectores, teste de latência e saúde em tempo real com query de aferição, switch toggle (habilitar/desabilitar) e reset de Circuit Breakers.
  - `SystemSettingsController.php` (Admin): parametrização de TTLs de cache, modelo padrão de IA e expurgo completo do Redis (`/api/admin/cache/flush-all`).
  - Telas frontend Obsidian Signal: `/dashboard`, `/admin/dashboard`, `/admin/providers` e `/settings` totalmente conectadas à API.
- [x] **Etapa 10 Concluída (Garantia de Qualidade, Testes Automatizados e Auditoria de Segurança):**
  - Configuração do PHPUnit 11 no backend conteinerizado.
  - Implementação de 20 testes automatizados cobrindo Deduplicação Canônica, Pontuação de Relevância, APIs de Busca e Administração, e Validações de Segurança (XSS, SQL Injection e proteção de rotas).
  - 100% dos testes aprovados com sucesso (`OK (20 tests, 64 assertions)`).
  - Compilação estática Next.js validada sem erros com geração de 12 rotas prontas para produção.
  - Auditoria completa de todos os 20 critérios de aceitação do `PROMPT.md` com status 200 em todos os serviços.

