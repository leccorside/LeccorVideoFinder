'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { VideoSearchResult, Platform } from '@/types';
import { VideoCard } from '@/components/video/VideoCard';
import { TranscriptDrawer } from '@/components/video/TranscriptDrawer';
import { cn } from '@/lib/utils';

// Lista de plataformas com badges e contadores simulados
const platformsFilterList: { id: Platform | 'all'; label: string; count?: string }[] = [
  { id: 'all', label: 'Todas as Redes' },
  { id: 'youtube', label: 'YouTube', count: '890' },
  { id: 'tiktok', label: 'TikTok', count: '312' },
  { id: 'instagram', label: 'Instagram', count: '145' },
  { id: 'vimeo', label: 'Vimeo', count: '54' },
  { id: 'dailymotion', label: 'Dailymotion', count: '18' },
  { id: 'reddit', label: 'Reddit', count: '9' },
];

// Dados iniciais de demonstração baseados no protótipo Obsidian Signal
const demoResults: VideoSearchResult[] = [
  {
    id: 'demo-1',
    platform: 'youtube',
    externalId: 'dQw4w9WgXcQ',
    title: 'Disciplina é mais importante que motivação — O Poder do Hábito Diário',
    description: 'Neste discurso inspirador, exploramos como a constância e o comprometimento superam qualquer pico de motivação passageira para alcançar grandes conquistas.',
    originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
    author: 'Cortes de Sabedoria',
    durationSeconds: 258,
    publishedAt: 'há 3 dias',
    viewsCount: 142000,
    relevanceScore: 98,
    matchType: 'transcript_match',
    matchedSnippet: 'A disciplina é a única ponte que conecta os seus objetivos com a realização prática diária.',
    matchedTimestamp: 94,
    transcript: {
      language: 'pt-BR',
      isVerified: true,
      segments: [
        { startTime: 32, endTime: 48, text: 'Muitas pessoas esperam se sentir motivadas para começar a agir.' },
        { startTime: 94, endTime: 112, text: 'A disciplina é a única ponte que conecta os seus objetivos com a realização prática diária.' },
        { startTime: 145, endTime: 168, text: 'Se você fizer apenas nos dias em que estiver com vontade, você nunca construirá nada duradouro.' },
      ],
    },
  },
  {
    id: 'demo-2',
    platform: 'tiktok',
    externalId: 'tt-82918',
    title: 'Nunca desista dos seus sonhos, mesmo quando ninguém mais acreditar em você',
    description: 'Um trecho emocionante sobre persistência após repetidos fracassos e rejeições no início da jornada profissional.',
    originalUrl: 'https://www.tiktok.com/@motivacao/video/82918291',
    thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
    author: '@motivacao_diaria',
    durationSeconds: 58,
    publishedAt: 'há 1 semana',
    viewsCount: 890000,
    relevanceScore: 94,
    matchType: 'exact_phrase',
    matchedSnippet: 'Nunca desista dos seus sonhos, porque o fracasso de ontem é apenas o aprendizado de amanhã.',
    matchedTimestamp: 12,
  },
  {
    id: 'demo-3',
    platform: 'vimeo',
    externalId: 'vm-9021',
    title: 'Persistência Criativa: Superando o Bloqueio e o Fracasso',
    description: 'Documentário cinematográfico analisando a trajetória de artistas renomados que foram rejeitados dezenas de vezes antes de publicarem suas obras-primas.',
    originalUrl: 'https://vimeo.com/90219021',
    thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
    author: 'Cinema & Vida',
    durationSeconds: 720,
    publishedAt: 'há 2 meses',
    viewsCount: 32000,
    relevanceScore: 89,
    matchType: 'semantic',
    matchedSnippet: 'O fracasso não é o oposto do sucesso; ele é parte integrante do aprendizado de quem ousa construir.',
    matchedTimestamp: 184,
  },
  {
    id: 'demo-4',
    platform: 'instagram',
    externalId: 'ig-reel-44',
    title: 'Por que o fracasso repetido molda os melhores líderes do mundo',
    description: 'Entrevista curta demonstrando a importância de não desistir diante das adversidades do mercado corporativo.',
    originalUrl: 'https://www.instagram.com/reel/Cx90821/',
    thumbnailUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
    author: 'Liderança Moderna',
    durationSeconds: 45,
    publishedAt: 'há 4 dias',
    viewsCount: 64000,
    relevanceScore: 86,
    matchType: 'text_match',
    matchedSnippet: 'Líderes não desistem quando tudo parece dar errado.',
  },
  {
    id: 'demo-5',
    platform: 'dailymotion',
    externalId: 'dm-x81',
    title: 'Discurso de Formatura: A Arte de Continuar Tentando',
    description: 'Cerimônia universitária completa com discurso motivacional sobre disciplina e sonhos.',
    originalUrl: 'https://www.dailymotion.com/video/x81928',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
    author: 'Universidade Aberta',
    durationSeconds: 1140,
    publishedAt: 'há 1 ano',
    viewsCount: 15400,
    relevanceScore: 81,
    matchType: 'semantic',
  },
  {
    id: 'demo-6',
    platform: 'reddit',
    externalId: 'rd-post-9',
    title: 'Relato real: Como mudei de vida depois de fracassar em 3 negócios',
    description: 'Vídeo relato de usuário no Reddit explicando sua jornada de consistência e superação emocional.',
    originalUrl: 'https://www.reddit.com/r/desabafos/comments/video99',
    thumbnailUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&auto=format&fit=crop&q=80',
    author: 'u/empreendedor_resiliente',
    durationSeconds: 180,
    publishedAt: 'há 5 dias',
    viewsCount: 8200,
    relevanceScore: 78,
    matchType: 'unverified',
  },
];

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || 'Nunca desista dos seus sonhos';
  const isAiInitial = searchParams.get('ai') === '1';

  const [query, setQuery] = useState(initialQuery);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [selectedDuration, setSelectedDuration] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('relevance');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [selectedTranscriptVideo, setSelectedTranscriptVideo] = useState<VideoSearchResult | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(['demo-1']));
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // Sincronizar favoritos existentes do MySQL
  useEffect(() => {
    fetch('/api/favorites')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          const ids = new Set<string>();
          json.data.forEach((fav: any) => {
            if (fav.id) ids.add(String(fav.id));
            if (fav.externalId) ids.add(String(fav.externalId));
            if (fav.canonicalUrl) ids.add(String(fav.canonicalUrl));
          });
          setFavoriteIds(ids);
        }
      })
      .catch(() => {});
  }, []);

  // Estados de dados reais da API
  const [videos, setVideos] = useState<VideoSearchResult[]>(demoResults);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ duration_ms: 340, total_providers: 2, from_cache: false });
  const [totalCount, setTotalCount] = useState(demoResults.length);

  // Função para executar busca na API real
  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          q: searchTerm,
          platforms: selectedPlatform === 'all' ? [] : [selectedPlatform],
          duration: selectedDuration,
          sort: sortBy,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data && Array.isArray(json.data.results)) {
          if (json.data.results.length > 0) {
            setVideos(json.data.results);
            setTotalCount(json.data.total || json.data.results.length);
            if (json.data.stats) {
              setStats(json.data.stats);
            }
          } else {
            // Se não encontrou, mantém vazio para mostrar empty state
            setVideos([]);
            setTotalCount(0);
          }

          // Gravação automática no histórico do usuário se habilitado
          if (typeof window !== 'undefined' && localStorage.getItem('videofinder_record_history') !== 'false') {
            fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({
                query: searchTerm,
                platform_filters: selectedPlatform === 'all' ? [] : [selectedPlatform],
                duration_filter: selectedDuration,
                mode: searchParams.get('ai') === '1' ? 'ai_semantic' : 'simple',
                results_count: json.data?.total || json.data?.results?.length || 0,
              }),
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('Erro ao buscar vídeos reais:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      executeSearch(q);
    } else {
      executeSearch(initialQuery);
    }
  }, [searchParams, selectedPlatform, selectedDuration, sortBy]);

  const toggleFavorite = async (video: VideoSearchResult) => {
    const isFav = favoriteIds.has(video.id) || (video.externalId ? favoriteIds.has(video.externalId) : false);

    if (isFav) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(video.id);
        if (video.externalId) next.delete(video.externalId);
        return next;
      });
      fetch(`/api/favorites/${video.externalId || video.id}`, { method: 'DELETE' }).catch(() => {});
    } else {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.add(video.id);
        if (video.externalId) next.add(video.externalId);
        return next;
      });
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          platform: video.platform,
          externalId: video.externalId || video.id,
          title: video.title,
          description: video.description || '',
          originalUrl: video.originalUrl,
          thumbnailUrl: video.thumbnailUrl || '',
          author: video.author || '',
          durationSeconds: video.durationSeconds || 0,
          viewsCount: video.viewsCount || 0,
          matchedTimestamp: video.matchedTimestamp || null,
          matchedSnippet: video.matchedSnippet || null,
        }),
      }).catch(() => {});
    }
  };

  return (
    <div className="flex flex-col w-full pb-16">
      {/* SEÇÃO 1: CABEÇALHO DE COMANDO & QUERY ATIVA */}
      <div className="px-space-md lg:px-margin pt-space-lg pb-space-md flex flex-col gap-space-md border-b border-[#27272A]/40 bg-surface-container-lowest/50">
        {/* Barra Omnibar de Busca Sintética & Estatísticas */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl shadow-md border border-[#27272A]/60">
          {/* Input com Termo Atual */}
          <div className="flex-1 flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-2.5 rounded-lg border border-[#27272A]/50 shadow-inner">
            <span className="material-symbols-outlined text-secondary-neon text-[22px]">smart_toy</span>
            <div className="flex-1 flex items-center gap-space-xs min-w-0">
              <span className="font-mono text-[10px] text-secondary-neon bg-surface-container-high px-2 py-0.5 rounded uppercase font-semibold">
                Query
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    executeSearch(query);
                  }
                }}
                className="w-full bg-transparent font-display font-semibold text-base text-on-surface outline-none border-0 p-0 focus:ring-0 truncate"
              />
            </div>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-outline hover:text-on-surface p-1 rounded transition-colors"
                title="Limpar pesquisa"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
            <kbd className="hidden sm:inline-block font-mono text-xs bg-surface-container-high text-on-surface-variant px-2 py-1 rounded shadow-sm border border-[#27272A]">
              ⌘K
            </kbd>
          </div>

          {/* Métricas em Tempo Real & Velocidade de Varredura */}
          <div className="flex items-center gap-space-md px-space-sm">
            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", isLoading ? "bg-primary-neon animate-ping" : "bg-secondary-neon animate-pulse")} />
                <span className="font-display font-bold text-lg text-on-surface">
                  {totalCount}
                </span>
                <span className="font-sans text-[11px] text-outline uppercase tracking-wider font-semibold">
                  Resultados Reais
                </span>
              </div>
              <span className="font-sans text-xs text-on-surface-variant">
                {stats.total_providers} provedores consultados {stats.from_cache ? '(Cache Redis)' : 'ao vivo'} em{' '}
                <strong className="text-secondary-neon font-mono">{(stats.duration_ms / 1000).toFixed(2)}s</strong>
              </span>
            </div>

            <div className="h-8 w-[1px] bg-surface-variant hidden sm:block" />

            {/* Botão de Resumo Semântico IA */}
            <button
              type="button"
              onClick={() => setIsSynthesizing(!isSynthesizing)}
              className={cn(
                'flex items-center gap-2 font-sans text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition-all border',
                isSynthesizing
                  ? 'bg-secondary-neon text-black border-secondary-neon shadow-[0_0_16px_rgba(6,182,212,0.3)]'
                  : 'bg-primary-neon text-white border-primary-neon hover:brightness-110'
              )}
            >
              <span className="material-symbols-outlined text-[18px]">psychology</span>
              <span className="hidden md:inline">
                {isSynthesizing ? 'Resumo Ativo' : 'Resumo Semântico'}
              </span>
            </button>
          </div>
        </div>

        {/* Card de Síntese Semântica por IA (Expansível) */}
        {isSynthesizing && (
          <div className="p-4 rounded-xl bg-surface-container-low border border-secondary-neon/40 shadow-lg flex flex-col gap-2 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary-neon text-[18px]">auto_awesome</span>
                <span className="font-display font-semibold text-sm text-on-surface">
                  Síntese Semântica Local (Ollama - qwen2.5vl:7b)
                </span>
              </div>
              <span className="font-mono text-[10px] bg-secondary-container/20 text-secondary-neon px-2 py-0.5 rounded font-semibold">
                100% LOCAL NO HOST
              </span>
            </div>
            <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
              A intenção da sua busca foi mapeada em torno do conceito de <strong>resiliência e persistência frente à rejeição ou falha</strong>. Os vídeos abaixo foram priorizados com base em evidências textuais encontradas em falas e transcrições sincronizadas, eliminando conteúdos que abordam o tema apenas superficialmente.
            </p>
          </div>
        )}

        {/* Barra de Controles: Chips de Plataformas, Duração & Switch Grade/Lista */}
        <div className="flex flex-wrap items-center justify-between gap-space-md pt-space-xs">
          {/* Chips de Plataformas */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-xs text-outline uppercase tracking-wider font-semibold mr-1">
              Plataformas:
            </span>
            {platformsFilterList.map((plat) => {
              const isSelected = selectedPlatform === plat.id;
              return (
                <button
                  key={plat.id}
                  type="button"
                  onClick={() => setSelectedPlatform(plat.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans text-xs transition-all border',
                    isSelected
                      ? 'bg-primary-neon/20 border-primary-neon text-on-surface font-semibold shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                      : 'bg-surface-container-low border-[#27272A] text-outline hover:text-on-surface hover:bg-surface-container-high'
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isSelected ? 'bg-primary-neon' : 'bg-outline/50'
                    )}
                  />
                  <span>{plat.label}</span>
                  {plat.count && (
                    <span className="font-mono text-[10px] text-outline ml-0.5">{plat.count}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Duração, Ordenação e Visualização */}
          <div className="flex items-center gap-space-sm ml-auto">
            {/* Duração */}
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              className="bg-surface-container-low border border-[#27272A] rounded-lg px-2.5 py-1.5 font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon"
            >
              <option value="all">Todas as durações</option>
              <option value="short">Curtos (&lt; 1 min)</option>
              <option value="medium">Médios (1 a 5 min)</option>
              <option value="long">Longos (&gt; 5 min)</option>
            </select>

            {/* Ordenação */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-surface-container-low border border-[#27272A] rounded-lg px-2.5 py-1.5 font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon"
            >
              <option value="relevance">Mais Relevantes</option>
              <option value="recent">Mais Recentes</option>
              <option value="views">Mais Vistos</option>
              <option value="exact">Frase Exata</option>
            </select>

            {/* Alternador de Visualização Grade / Lista */}
            <div className="flex items-center bg-surface-container-low p-0.5 rounded-lg border border-[#27272A]">
              <button
                type="button"
                onClick={() => setLayoutMode('grid')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  layoutMode === 'grid'
                    ? 'bg-surface-container-high text-secondary-neon'
                    : 'text-outline hover:text-on-surface'
                )}
                title="Visualização em Grade"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('list')}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  layoutMode === 'list'
                    ? 'bg-surface-container-high text-secondary-neon'
                    : 'text-outline hover:text-on-surface'
                )}
                title="Visualização em Lista"
              >
                <span className="material-symbols-outlined text-[18px]">view_agenda</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 2: FEED DE RESULTADOS */}
      <div className="px-space-md lg:px-margin pt-space-md">
        {isLoading ? (
          <div className="grid gap-space-md grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex flex-col rounded-xl overflow-hidden bg-surface-container-low border border-[#27272A]/50 animate-pulse">
                <div className="aspect-video w-full bg-surface-container-high relative" />
                <div className="p-4 flex flex-col gap-3">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-full" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-outline mb-2">videocam_off</span>
            <h3 className="font-display font-semibold text-lg text-on-surface mb-1">
              Nenhum vídeo localizado para os filtros selecionados
            </h3>
            <p className="font-sans text-xs text-outline max-w-md">
              Tente redefinir a plataforma ou o filtro de duração para ampliar a busca universal.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'grid gap-space-md transition-all',
              layoutMode === 'grid'
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1'
            )}
          >
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                layout={layoutMode}
                onInspectTranscript={(v) => setSelectedTranscriptVideo(v)}
                onToggleFavorite={toggleFavorite}
                isFavorited={favoriteIds.has(video.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Drawer de Inspeção de Transcrições */}
      <TranscriptDrawer
        video={selectedTranscriptVideo}
        isOpen={Boolean(selectedTranscriptVideo)}
        onClose={() => setSelectedTranscriptVideo(null)}
        query={query}
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-space-lg text-center font-sans text-sm text-outline">
          Carregando resultados da busca universal...
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}

