'use client';

import React, { useState } from 'react';
import { VideoSearchResult, Platform } from '@/types';
import { formatDuration, formatViews, cn } from '@/lib/utils';

interface VideoCardProps {
  video: VideoSearchResult;
  layout?: 'grid' | 'list';
  onInspectTranscript?: (video: VideoSearchResult) => void;
  onToggleFavorite?: (video: VideoSearchResult) => void;
  isFavorited?: boolean;
}

const platformMeta: Record<Platform, { name: string; bg: string; text: string; icon: string }> = {
  youtube: { name: 'YouTube', bg: 'bg-[#FF0000]/15', text: 'text-[#FF4D4D]', icon: 'smart_display' },
  tiktok: { name: 'TikTok', bg: 'bg-[#00F2FE]/15', text: 'text-[#00F2FE]', icon: 'music_note' },
  instagram: { name: 'Instagram', bg: 'bg-[#E1306C]/15', text: 'text-[#FF5B94]', icon: 'photo_camera' },
  vimeo: { name: 'Vimeo', bg: 'bg-[#1AB7EA]/15', text: 'text-[#1AB7EA]', icon: 'slideshow' },
  dailymotion: { name: 'Dailymotion', bg: 'bg-[#0066DC]/15', text: 'text-[#3E92FF]', icon: 'video_stable' },
  reddit: { name: 'Reddit', bg: 'bg-[#FF4500]/15', text: 'text-[#FF6633]', icon: 'forum' },
  twitch: { name: 'Twitch', bg: 'bg-[#9146FF]/15', text: 'text-[#B07BFF]', icon: 'live_tv' },
  kwai: { name: 'Kwai', bg: 'bg-[#FF8A00]/15', text: 'text-[#FFA133]', icon: 'videocam' },
  web: { name: 'Web Vídeo', bg: 'bg-secondary-neon/15', text: 'text-secondary-neon', icon: 'language' },
};

const matchTypeBadge: Record<VideoSearchResult['matchType'], { label: string; bg: string; text: string; icon: string }> = {
  exact_phrase: { label: 'Frase Exata', bg: 'bg-primary-neon/20', text: 'text-primary-neon', icon: 'verified' },
  transcript_match: { label: 'Fala Transcrita', bg: 'bg-secondary-neon/20', text: 'text-secondary-neon', icon: 'subtitles' },
  semantic: { label: 'IA Semântica', bg: 'bg-primary-container/30', text: 'text-primary', icon: 'psychology' },
  text_match: { label: 'Termo Textual', bg: 'bg-surface-container-high', text: 'text-on-surface-variant', icon: 'search' },
  unverified: { label: 'Web Descoberta', bg: 'bg-surface-container', text: 'text-outline', icon: 'travel_explore' },
};

export function VideoCard({
  video,
  layout = 'grid',
  onInspectTranscript,
  onToggleFavorite,
  isFavorited = false,
}: VideoCardProps) {
  const [copied, setCopied] = useState(false);
  const plat = platformMeta[video.platform] || platformMeta.web;
  const match = matchTypeBadge[video.matchType] || matchTypeBadge.text_match;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(video.originalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      className={cn(
        'group relative bg-surface-container-low hover:bg-surface-container rounded-xl border border-[#27272A]/70 hover:border-primary-neon/40 transition-all duration-300 overflow-hidden flex shadow-md hover:shadow-[0_4px_24px_-4px_rgba(139,92,246,0.2)]',
        layout === 'grid' ? 'flex-col' : 'flex-col md:flex-row'
      )}
    >
      {/* Media Slot (16:9) */}
      <div
        className={cn(
          'relative overflow-hidden bg-black shrink-0 aspect-video',
          layout === 'list' && 'md:w-72 lg:w-80'
        )}
      >
        <img
          src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80'}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay gradiente sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Badge da Plataforma (Canto Superior Esquerdo) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-lowest/90 backdrop-blur-md border border-[#27272A] shadow-sm">
          <span className={cn('material-symbols-outlined text-[14px]', plat.text)}>{plat.icon}</span>
          <span className={cn('font-mono text-[10px] font-semibold tracking-wider uppercase', plat.text)}>
            {plat.name}
          </span>
        </div>

        {/* Relevância Score (Canto Superior Direito) */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 backdrop-blur-md border border-[#27272A] shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary-neon animate-pulse" />
          <span className="font-mono text-[11px] font-semibold text-secondary-neon">
            {video.relevanceScore}%
          </span>
        </div>

        {/* Chip de Duração (Canto Inferior Direito) */}
        {video.durationSeconds && video.durationSeconds > 0 ? (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded bg-black/85 backdrop-blur-md font-mono text-[11px] font-medium text-white shadow-sm border border-white/10">
            {formatDuration(video.durationSeconds)}
          </div>
        ) : null}

        {/* Botão Flutuante de Play Rápido */}
        <a
          href={video.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]"
          title="Assistir na plataforma original"
        >
          <div className="w-12 h-12 rounded-full bg-primary-neon text-white flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.6)] transform scale-90 group-hover:scale-100 transition-transform">
            <span className="material-symbols-outlined text-[26px]">play_arrow</span>
          </div>
        </a>
      </div>

      {/* Bloco de Metadados & Ações */}
      <div className="p-space-md flex-1 flex flex-col justify-between gap-space-sm min-w-0">
        <div>
          {/* Header do Card: Tipo de Match & Timestamp se houver */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-sans text-[11px] font-semibold',
                match.bg,
                match.text
              )}
            >
              <span className="material-symbols-outlined text-[13px]">{match.icon}</span>
              <span>{match.label}</span>
            </span>

            {video.matchedTimestamp !== undefined && (
              <button
                type="button"
                onClick={() => onInspectTranscript?.(video)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-container/20 text-secondary-neon hover:bg-secondary-container/30 transition-colors font-mono text-[11px] font-semibold"
                title="Pular para o minuto exato no áudio"
              >
                <span className="material-symbols-outlined text-[13px]">timer</span>
                <span>Momento: {formatDuration(video.matchedTimestamp)}</span>
              </button>
            )}

            {video.publishedAt && (
              <span className="text-outline font-sans text-xs ml-auto">
                {video.publishedAt}
              </span>
            )}
          </div>

          {/* Título do Vídeo */}
          <h3 className="font-display font-semibold text-base text-on-surface line-clamp-2 group-hover:text-primary-neon transition-colors leading-snug mb-1">
            <a href={video.originalUrl} target="_blank" rel="noopener noreferrer">
              {video.title}
            </a>
          </h3>

          {/* Autor e Métricas */}
          <div className="flex items-center gap-2 text-outline font-sans text-xs mb-2.5">
            <span className="text-on-surface-variant font-medium truncate max-w-[180px]">
              {video.author || 'Canal Desconhecido'}
            </span>
            {video.viewsCount !== undefined && (
              <>
                <span>•</span>
                <span>{formatViews(video.viewsCount)}</span>
              </>
            )}
          </div>

          {/* Snippet Perplexity-Style de Trecho Correspondente */}
          {video.matchedSnippet && (
            <div className="p-2.5 rounded-lg bg-surface-container-lowest/80 border border-[#27272A]/50 text-xs font-sans text-on-surface-variant leading-relaxed">
              <span className="text-secondary-neon font-semibold mr-1.5 flex-shrink-0 inline-flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">format_quote</span>
                Trecho:
              </span>
              <span>"{video.matchedSnippet}"</span>
            </div>
          )}
        </div>

        {/* Rodapé de Ações Rápidas */}
        <div className="pt-space-xs border-t border-[#27272A]/40 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1">
            {video.transcript && (
              <button
                type="button"
                onClick={() => onInspectTranscript?.(video)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-sans font-medium transition-colors"
                title="Abrir transcrição completa com minutagem"
              >
                <span className="material-symbols-outlined text-[16px] text-secondary-neon">subtitles</span>
                <span>Transcrições</span>
              </button>
            )}

            <a
              href={video.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-sans font-medium transition-colors"
              title="Abrir na plataforma oficial"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span className="hidden sm:inline">Original</span>
            </a>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
              title={copied ? 'Link copiado!' : 'Copiar link'}
            >
              <span className={cn('material-symbols-outlined text-[18px]', copied && 'text-secondary-neon')}>
                {copied ? 'done' : 'content_copy'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite?.(video)}
              className={cn(
                'p-1.5 rounded-lg hover:bg-surface-container-high transition-colors',
                isFavorited ? 'text-primary-neon' : 'text-outline hover:text-on-surface'
              )}
              title={isFavorited ? 'Remover dos favoritos' : 'Salvar favorito'}
            >
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
              >
                bookmark
              </span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

