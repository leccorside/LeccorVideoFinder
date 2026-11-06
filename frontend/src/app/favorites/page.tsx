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

const initialCollections: Collection[] = [
  { id: 'all', name: 'Todos os Salvos', count: 0, icon: 'bookmarks' },
];

export default function FavoritesPage() {
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [collections, setCollections] = useState<Collection[]>(initialCollections);
  const [savedVideos, setSavedVideos] = useState<VideoSearchResult[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedTranscriptVideo, setSelectedTranscriptVideo] = useState<VideoSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar coleções da API
  const loadCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const apiCols: Collection[] = [
            {
              id: 'all',
              name: 'Todos os Salvos',
              count: json.data.reduce((acc: number, c: any) => acc + (c.videos_count || 0), 0),
              icon: 'bookmarks',
            },
            ...json.data.map((c: any) => ({
              id: String(c.id),
              name: c.title,
              count: c.videos_count || 0,
              icon: c.icon || 'folder',
            })),
          ];
          setCollections(apiCols);
        }
      }
    } catch (err) {
      console.log('Erro ao buscar coleções:', err);
    }
  };

  // Carregar favoritos da coleção selecionada
  const loadFavorites = async (colId: string) => {
    setIsLoading(true);
    try {
      const url = colId === 'all' ? '/api/favorites' : `/api/favorites?collection_id=${colId}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSavedVideos(json.data);
        }
      }
    } catch (err) {
      console.log('Erro ao buscar favoritos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  useEffect(() => {
    loadFavorites(selectedCollection);
  }, [selectedCollection]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
        setSelectedCollection(String(json.data.id));
      }
    } catch (err) {
      console.log('Erro ao criar coleção:', err);
    }

    setNewCollectionName('');
    setIsModalOpen(false);
  };

  const handleDeleteCollection = async (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    if (!confirm('Deseja excluir esta coleção? Os vídeos permanecerão salvos na biblioteca geral.')) {
      return;
    }
    try {
      const res = await fetch(`/api/collections/${colId}`, { method: 'DELETE' });
      if (res.ok) {
        setCollections((prev) => prev.filter((c) => c.id !== colId));
        if (selectedCollection === colId) {
          setSelectedCollection('all');
        }
      }
    } catch (err) {
      console.log('Erro ao excluir coleção:', err);
    }
  };

  const handleRemoveFavorite = async (video: VideoSearchResult) => {
    try {
      await fetch(`/api/favorites/${video.externalId || video.id}`, { method: 'DELETE' });
    } catch (err) {
      console.log('Erro ao remover favorito:', err);
    }
    setSavedVideos((prev) => prev.filter((v) => v.id !== video.id && v.externalId !== video.externalId));
    loadCollections();
  };

  const filtered = savedVideos.filter(
    (v) =>
      v.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (v.author && v.author.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg gap-space-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <h1 className="font-display font-bold text-2xl text-on-surface">Favoritos & Coleções</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Gerencie vídeos salvos no MySQL, organize pastas temáticas e exporte referências de cortes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-neon text-surface font-sans text-xs font-semibold shadow-md shadow-primary-neon/20 hover:brightness-110 transition-all"
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
              <div
                key={col.id}
                onClick={() => setSelectedCollection(col.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-sans text-xs transition-all border cursor-pointer group',
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

                {col.id !== 'all' && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteCollection(e, col.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-error transition-all"
                    title="Excluir coleção"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                )}
              </div>
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
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-neon/20 border-t-primary-neon animate-spin" />
          <span className="font-mono text-xs text-outline">Carregando favoritos do banco...</span>
        </div>
      ) : filtered.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {filtered.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              isFavorited={true}
              onToggleFavorite={() => handleRemoveFavorite(video)}
              onInspectTranscript={(v) => setSelectedTranscriptVideo(v)}
            />
          ))}
        </div>
      )}

      {/* Modal Criar Nova Coleção */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-surface-container-low border border-[#27272A] shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-on-surface">Nova Coleção Temática</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-sans text-xs text-outline font-medium">Nome da Pasta</label>
                <input
                  type="text"
                  required
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Ex: Discursos de Liderança"
                  className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-sans font-medium text-outline"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-neon text-surface text-xs font-sans font-semibold hover:brightness-110"
                >
                  Criar Coleção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drawer de Transcrição */}
      {selectedTranscriptVideo && (
        <TranscriptDrawer
          video={selectedTranscriptVideo}
          isOpen={!!selectedTranscriptVideo}
          onClose={() => setSelectedTranscriptVideo(null)}
        />
      )}
    </div>
  );
}
