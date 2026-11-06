# CONTEXTO DO PROJETO — VIDEOFINDER

> **Última atualização:** 2026-11-06  
> **Status Geral do Projeto:** Fase de Planejamento e Arquitetura Concluída — Aguardando autorização para início da ETAPA 1.

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

6. **Uso Nativo do Ollama Pré-instalado no Host:** Em conformidade estrita com a solicitação do usuário, não são baixados novos modelos ou contêineres duplicados de IA. O backend conecta-se diretamente à instância existente do Ollama na máquina via gateway Docker (`host.docker.internal:11435`), aproveitando os modelos já instalados (`gpt-oss:20b` e `qwen2.5vl:7b`), economizando banda e armazenamento em disco.
7. **Pipeline de Build do Frontend Verificado:** O Next.js 14+ com App Router e Tailwind CSS foi testado e compilado com 100% de sucesso, implementando os tokens de design do Obsidian Signal (`#131316`, `#8B5CF6`, `#06B6D4`, etc.).

---

## 7. Status do Projeto e Próximos Passos

- [x] Estrutura do repositório inspecionada.
- [x] Protótipo `uxui` e tokens de design catalogados.
- [x] Requisitos técnicos e arquiteturais do `PROMPT.md` consolidados.
- [x] Arquivos de governança criados (`CONTEXTO.md`, `DOCUMENTACAO.md`, `PASSOS.md`).
- [x] **Etapa 1 Concluída:**
  - Infraestrutura Docker Compose orquestrada (`nginx`, `frontend`, `backend`, `mysql`, `redis`, `searxng`).
  - Configuração do Ollama apontada para a instalação existente no host (`127.0.0.1:11435` / `host.docker.internal:11435`).
  - Frontend Next.js 14 inicializado com design system Obsidian Signal e build validado (`next build` concluído com sucesso).
  - Backend Laravel 11 estruturado com API REST, endpoint `/api/health` e conexões configuradas.
- [x] **Etapa 2 Concluída:**
  - Design System **Obsidian Signal** totalmente transposto para componentes React/Next.js 14+ com Tailwind CSS.
  - Criado o componente de card de vídeo [VideoCard.tsx](file:///d:/PROJETOS/cortes-youtube/frontend/src/components/video/VideoCard.tsx) (aspect ratio 16:9, zoom 1.03x, badges de evidência, duration chip em monospace e ações rápidas).
  - Criado o painel lateral [TranscriptDrawer.tsx](file:///d:/PROJETOS/cortes-youtube/frontend/src/components/video/TranscriptDrawer.tsx) com linha do tempo interativa, scrubber ticks em ciano e atalho para reprodução direta no timestamp.
  - Implementadas todas as rotas principais: `/` (Home com Omnibar), `/search` (Resultados de Busca com filtros, ordenação e switch Grid/List), `/ai-search` (Busca Semântica com modelos Ollama locais do host), `/favorites` (Favoritos e Coleções), `/history` (Histórico de Buscas), `/dashboard` (Telemetria ao Vivo) e `/settings` (Configurações completas).
  - Compilação estática `next build` testada com 10 rotas geradas com 100% de sucesso.
- [ ] **Etapa 3 (Próxima):** Universal Video Search Engine (Core do Mecanismo) — Criação dos contratos `VideoSearchProviderInterface`, DTOs imutáveis, orquestrador assíncrono de busca paralela, deduplicador canônico e endpoint Server-Sent Events (`/api/search/{id}/stream`).

