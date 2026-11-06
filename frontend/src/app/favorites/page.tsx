'use client';

import React, { useState, useEffect } from 'react';
import { VideoSearchResult } from '@/types';
import { VideoCard } from '@/components/video/VideoCard';
import { TranscriptDrawer } from '@/components/video/TranscriptDrawer';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
  count: number;
  icon: string;
}

const mockCollections: Collection[] = [
  { id: 'all', name: 'Todos os Salvos', count: 12, icon: 'bookmarks' },
  { id: 'col-1', name: 'Motivação & Discursos', count: 6, icon: 'psychology' },
  { id: 'col-2', name: 'Cortes para Edição', count: 4, icon: 'content_cut' },
  { id: 'col-3', name: 'Shorts & Reels Virais', count: 2, icon: 'bolt' },
];

const mockSavedVideos: VideoSearchResult[] = [
  {
    id: 'fav-1',
    platform: 'youtube',
    externalId: 'dQw4w9WgXcQ',
    title: 'Disciplina é mais importante que motivação — O Poder do Hábito Diário',
    description: 'Neste discurso inspirador, exploramos como a constância e o comprometimento superam qualquer pico de motivação.',
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
        { startTime: 94, endTime: 112, text: 'A disciplina é a única ponte que conecta os seus objetivos com a realização prática diária.' },
      ],
    },
  },
  {
    id: 'fav-2',
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
];

export default function FavoritesPage() {
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [collections, setCollections] = useState(mockCollections);
  const [savedVideos, setSavedVideos] = useState(mockSavedVideos);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedTranscriptVideo, setSelectedTranscriptVideo] = useState<VideoSearchResult | null>(null);

  // Carregar coleções e favoritos reais da API MySQL
  useEffect(() => {
    // 1. Coleções
    fetch('/api/collections')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const apiCols: Collection[] = [
            { id: 'all', name: 'Todos os Salvos', count: json.data.reduce((acc: number, c: any) => acc + (c.videos_count || 0), 0), icon: 'bookmarks' },
            ...json.data.map((c: any) => ({
              id: String(c.id),
              name: c.title,
              count: c.videos_count || 0,
              icon: c.icon || 'folder',
            })),
          ];
          setCollections(apiCols);
        }
      })
      .catch((err) => console.log('Erro ao buscar coleções:', err));

    // 2. Favoritos
    fetch('/api/favorites')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSavedVideos(json.data);
        }
      })
      .catch((err) => console.log('Erro ao buscar favoritos:', err));
  }, []);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newCollectionName.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        const newCol: Collection = {
          id: String(json.data.id),
          name: json.data.title,
          count: 0,
          icon: json.data.icon || 'folder',
        };
        setCollections([...collections, newCol]);
      }
    } catch (err) {
      console.log('Erro ao criar coleção:', err);
    }

    setNewCollectionName('');
    setIsModalOpen(false);
  };

  const handleRemoveFavorite = async (video: VideoSearchResult) => {
    try {
      await fetch(`/api/favorites/${video.id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Erro ao remover favorito:', err);
    }
    setSavedVideos(savedVideos.filter((v) => v.id !== video.id));
  };

  const filtered = savedVideos.filter((v) =>
    v.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    v.author.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg gap-space-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <h1 className="font-display font-bold text-2xl text-on-surface">Favoritos & Coleções</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Gerencie vídeos salvos, organize pastas temáticas e exporte referências de cortes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold shadow-md hover:bg-primary-hover transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
          <span>Nova Coleção</span>
        </button>
      </div>

      {/* Navegação por Coleções & Filtro Rápido */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Chips de Coleções */}
        <div className="flex flex-wrap items-center gap-2">
          {collections.map((col) => {
            const isSelected = selectedCollection === col.id;
            return (
              <button
                key={col.id}
                type="button"
                onClick={() => setSelectedCollection(col.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-sans text-xs transition-all border',
                  isSelected
                    ? 'bg-primary-neon/20 border-primary-neon text-on-surface font-semibold shadow-[0_0_12px_rgba(139,92,246,0.2)]'
                    : 'bg-surface-container-low border-[#27272A] text-outline hover:text-on-surface hover:bg-surface-container-high'
                )}
              >
                <span className="material-symbols-outlined text-[16px] text-secondary-neon">{col.icon}</span>
                <span>{col.name}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-surface-container-high font-mono text-[10px] text-outline">
                  {col.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campo de Busca nos Favoritos */}
        <div className="relative w-full md:w-72">
          <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filtrar vídeos salvos..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-container-low border border-[#27272A] font-sans text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-neon"
          />
        </div>
      </div>

      {/* Feed de Vídeos Salvos */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center justify-center bg-surface-container-low/30 rounded-2xl border border-dashed border-[#27272A]">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">bookmark_border</span>
          <h3 className="font-display font-semibold text-base text-on-surface mb-1">
            Nenhum vídeo salvo nesta coleção
          </h3>
          <p className="font-sans text-xs text-outline max-w-sm">
            Clique no ícone de marcador nos cards de pesquisa para salvar conteúdos aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-space-md">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              layout="grid"
              isFavorited={true}
              onToggleFavorite={() => handleRemoveFavorite(video)}
              onInspectTranscript={(v) => setSelectedTranscriptVideo(v)}
            />
          ))}
        </div>
      )}

      {/* Modal de Criação de Coleção */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleCreateCollection}
            className="w-full max-w-md bg-surface-container-lowest border border-[#27272A] rounded-2xl p-space-lg shadow-2xl flex flex-col gap-space-md animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg text-on-surface">Nova Coleção</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-outline hover:text-on-surface p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs text-outline font-medium">Nome da Pasta</label>
              <input
                type="text"
                autoFocus
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Ex: Cortes Motivacionais para Reels..."
                className="w-full p-2.5 rounded-xl bg-surface-container-low border border-[#27272A] font-sans text-sm text-on-surface focus:outline-none focus:border-primary-neon"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-space-xs">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-outline hover:bg-surface-container-high font-sans text-xs font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold hover:bg-primary-hover shadow-md transition-colors"
              >
                Criar Coleção
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transcript Drawer */}
      <TranscriptDrawer
        video={selectedTranscriptVideo}
        isOpen={Boolean(selectedTranscriptVideo)}
        onClose={() => setSelectedTranscriptVideo(null)}
      />
    </div>
  );
}

