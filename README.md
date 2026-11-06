 
<div align="center">

# 🎬 VideoFinder

### Universal Video Search Engine

**Encontre vídeos, descubra conteúdos e localize falas exatas em diferentes plataformas da internet com o poder da Inteligência Artificial.**

Uma plataforma open-source de busca universal de vídeos, com pesquisa inteligente, análise semântica local, indexação de transcrições e resultados reais — sem depender de APIs pagas.

![Status](https://img.shields.io/badge/STATUS-PLANEJAMENTO-8B5CF6?style=for-the-badge)
![Open Source](https://img.shields.io/badge/OPEN_SOURCE-YES-06B6D4?style=for-the-badge)
![Docker](https://img.shields.io/badge/DOCKER-READY-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![AI](https://img.shields.io/badge/LOCAL_AI-OLLAMA-8B5CF6?style=for-the-badge)

**[Visão Geral](#-sobre-o-projeto) • [Funcionalidades](#-principais-funcionalidades) • [Tecnologias](#-stack-tecnológica) • [Instalação](#-instalação-e-execução) • [Documentação](#-documentação)**

---

</div>

## 🌌 Sobre o Projeto

O **VideoFinder** nasceu com um objetivo: simplificar a maneira como encontramos vídeos na internet.

Atualmente, localizar um vídeo específico pode exigir pesquisas individuais em diversas plataformas, especialmente quando conhecemos apenas uma frase, uma fala, um assunto ou parte do conteúdo.

O VideoFinder propõe unificar essa experiência em um único mecanismo de pesquisa.

Com uma arquitetura modular, motores de busca gratuitos e inteligência artificial executada localmente, a plataforma foi projetada para oferecer resultados relevantes, verificáveis e organizados.

### 🎯 O que você poderá pesquisar?

- 🔎 **Palavras-chave:** encontre vídeos relacionados a um termo ou expressão.
- 💬 **Frases específicas:** pesquise trechos de falas presentes em transcrições disponíveis.
- 🧠 **Linguagem natural:** descreva o vídeo que deseja encontrar.
- ⏱️ **Timestamps:** identifique o momento exato de determinada fala, quando houver transcrição acessível.
- 🌐 **Múltiplas plataformas:** pesquise vídeos provenientes de diferentes fontes.
- 👤 **Criadores e canais:** descubra conteúdos por autor ou contexto.
- 🎯 **Busca semântica:** encontre resultados relacionados ao significado da pesquisa, não apenas às palavras digitadas.

> **Princípio fundamental:** o VideoFinder não inventa vídeos, links ou transcrições. A IA auxilia na interpretação, classificação e relevância de conteúdos reais.

---

## ✨ Principais Funcionalidades

### 🔍 Universal Video Search

Um mecanismo de pesquisa que consulta diferentes provedores por meio de adaptadores independentes.

**Recursos previstos:**

- Pesquisa textual unificada.
- Busca por correspondência exata.
- Consultas simultâneas a múltiplos provedores.
- Deduplicação automática de resultados.
- Normalização de metadados.
- Filtros e ordenação por relevância.
- Cache inteligente para otimização de consultas.
- Resultados progressivos utilizando Server-Sent Events (SSE).

### 🧠 AI-Powered Semantic Search

Integração com **Ollama**, permitindo executar modelos de inteligência artificial diretamente na infraestrutura local.

A IA será utilizada para:

- Interpretar pesquisas em linguagem natural.
- Expandir consultas com termos semanticamente relacionados.
- Identificar sinônimos e conceitos semelhantes.
- Calcular similaridade por embeddings.
- Melhorar o ranqueamento dos resultados.

**Modelos previstos:**

| Modelo | Finalidade |
|---|---|
| `nomic-embed-text` | Geração de embeddings |
| `llama3.2:1b` | Interpretação e expansão de consultas |
| `qwen2.5:0.5b` | Alternativa compacta de modelo de linguagem |

A busca textual continuará disponível mesmo quando a IA local estiver desabilitada.

### 🎙️ Transcript Intelligence

Mecanismo de consulta e exploração de legendas e transcrições públicas acessíveis.

**Funcionalidades previstas:**

- Pesquisa por frases dentro das transcrições.
- Exibição de segmentos de texto com minutagem.
- Destaque visual das palavras encontradas.
- Navegação diretamente ao momento correspondente do vídeo.
- Inspeção das legendas em painel lateral.

A disponibilidade das transcrições depende das permissões e dos recursos oferecidos por cada plataforma.

### ⚡ Real-Time Search Experience

Os resultados poderão ser apresentados progressivamente, sem necessidade de aguardar a conclusão de todas as fontes.

Tecnologias utilizadas no planejamento:

- Server-Sent Events (SSE).
- Redis Cache.
- Processamento concorrente de provedores.
- Circuit Breaker.
- Timeouts individuais.
- Fallback automático entre mecanismos de descoberta.

### 📂 Organização de Conteúdos

Ferramentas planejadas para usuários autenticados:

- Favoritos.
- Coleções personalizadas.
- Histórico de pesquisas.
- Organização de vídeos por temas.
- Consulta de vídeos relacionados.

### 📊 Dashboard Administrativo

Interface para gerenciamento e monitoramento da plataforma.

- Status dos conectores.
- Consumo de cotas gratuitas.
- Estatísticas de pesquisas.
- Taxa de acertos do cache.
- Latência dos provedores.
- Diagnóstico de integrações.
- Configurações de mecanismos de busca.

---

## 🌍 Plataformas de Busca

A arquitetura foi planejada para descobrir vídeos públicos nas seguintes plataformas:

| Plataforma | Estratégia prevista | Integração |
|---|---|---|
| YouTube | YouTube Data API v3 + SearXNG | API gratuita / Web |
| TikTok | Descoberta por páginas públicas indexadas | SearXNG |
| Instagram Reels | Descoberta por páginas públicas indexadas | SearXNG |
| Vimeo | API de desenvolvedores + busca web | API / Web |
| Dailymotion | API REST pública | API |
| Twitch | Twitch Helix API | API |
| Reddit | API / Endpoints JSON públicos | API / Web |
| Facebook Videos | Descoberta web | SearXNG |
| Kwai | Descoberta web | SearXNG |
| Outros sites | Pesquisa web indexada | SearXNG |

> **Nota:** suporte planejado não significa cobertura garantida. Algumas plataformas restringem APIs, indexação e acesso a metadados. O VideoFinder respeitará essas limitações.

---

## 🛠️ Stack Tecnológica

O projeto utiliza uma arquitetura **Full Stack moderna, modular e conteinerizada**.

### Frontend

![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

- Next.js 14+ com App Router.
- React e TypeScript.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query.
- Zustand.
- Server-Side Rendering (SSR).

### Backend

![PHP](https://img.shields.io/badge/PHP_