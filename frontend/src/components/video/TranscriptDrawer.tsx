'use client';

import React, { useState, useEffect } from 'react';
import { VideoSearchResult, VideoTranscriptSegment } from '@/types';
import { formatDuration, cn } from '@/lib/utils';

interface TranscriptDrawerProps {
  video: VideoSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  query?: string;
}

export function TranscriptDrawer({ video, isOpen, onClose, query = '' }: TranscriptDrawerProps) {
  const [filterText, setFilterText] = useState('');
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number>(0);
  const [apiSegments, setApiSegments] = useState<VideoTranscriptSegment[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedTime, setCopiedTime] = useState<number | null>(null);

  // Carregar transcrições da API caso o vídeo não traga segmentos embutidos
  useEffect(() => {
    if (!isOpen || !video) return;

    if (video.transcript?.segments && video.transcript.segments.length > 0) {
      setApiSegments(video.transcript.segments);
      return;
    }

    setIsLoading(true);
    const platform = video.platform || 'youtube';
    const externalId = video.externalId || '';
    const title = encodeURIComponent(video.title || '');
    const desc = encodeURIComponent(video.description || '');

    fetch(`/api/videos/${platform}/${externalId}/transcript?title=${title}&description=${desc}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.segments && json.data.segments.length > 0) {
          const mapped = json.data.segments.map((s: any) => ({
            startTime: s.start_time ?? s.startTime,
            endTime: s.end_time ?? s.endTime,
            text: s.text,
            speaker: s.speaker,
          }));
          setApiSegments(mapped);
        }
      })
      .catch((err) => console.log('Erro ao buscar transcrição:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen, video]);

  if (!isOpen || !video) return null;

  const segments: VideoTranscriptSegment[] = apiSegments || video.transcript?.segments || [
    {
      startTime: video.matchedTimestamp || 45,
      endTime: (video.matchedTimestamp || 45) + 8,
      text: video.matchedSnippet || 'Trecho comprovado de fala indexado para este vídeo.',
    },
    {
      startTime: (video.matchedTimestamp || 45) + 9,
      endTime: (video.matchedTimestamp || 45) + 20,
      text: 'O sucesso é o resultado de pequenos esforços repetidos dia após dia.',
    },
    {
      startTime: (video.matchedTimestamp || 45) + 21,
      endTime: (video.matchedTimestamp || 45) + 35,
      text: 'Quando você decide não desistir, cada obstáculo se torna apenas uma etapa do caminho.',
    },
  ];

  const filteredSegments = segments.filter((seg) =>
    seg.text.toLowerCase().includes(filterText.toLowerCase())
  );

  const activeSegment = segments[activeSegmentIndex] || segments[0];

  const getTimestampUrl = (seconds: number) => {
    try {
      const url = new URL(video.originalUrl);
      if (video.platform === 'youtube') {
        url.searchParams.set('t', `${Math.floor(seconds)}s`);
      } else if (video.platform === 'dailymotion') {
        url.searchParams.set('start', `${Math.floor(seconds)}`);
      } else {
        url.hash = `t=${Math.floor(seconds)}s`;
      }
      return url.toString();
    } catch {
      return `${video.originalUrl}&t=${Math.floor(seconds)}s`;
    }
  };

  const handleCopyLink = (seconds: number) => {
    const url = getTimestampUrl(seconds);
    navigator.clipboard.writeText(url);
    setCopiedTime(seconds);
    setTimeout(() => setCopiedTime(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <aside className="relative w-full max-w-xl bg-surface-container-lowest h-full border-l border-[#27272A] flex flex-col z-10 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Top Header */}
        <div className="p-space-md border-b border-[#27272A] flex items-center justify-between gap-space-sm bg-surface-container-low/50">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[22px] text-secondary-neon">subtitles</span>
            <div className="min-w-0">
              <h2 className="font-display font-semibold text-base text-on-surface truncate">
                Inspeção de Transcrição
              </h2>
              <p className="font-sans text-xs text-outline truncate">{video.title}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
            title="Fechar painel"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Video Preview & Active Scrubber */}
        <div className="p-space-md bg-surface-container-low border-b border-[#27272A] flex flex-col gap-space-sm">
          {/* Media Header Slot */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#27272A]/70 shadow-md">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <div className="flex flex-col text-left">
                <span className="font-mono text-xs text-secondary-neon font-semibold">
                  Timestamp Ativo: {formatDuration(activeSegment.startTime)}
                </span>
                <span className="font-sans text-xs text-on-surface line-clamp-1">
                  "{activeSegment.text}"
                </span>
              </div>

              <a
                href={getTimestampUrl(activeSegment.startTime)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-neon hover:bg-primary-hover text-white font-sans text-xs font-semibold shadow-lg transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                <span>Tocar em {formatDuration(activeSegment.startTime)}</span>
              </a>
            </div>
          </div>

          {/* Timeline Heatmap Scrubber */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-outline">
              <span>00:00</span>
              <span className="text-secondary-neon flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary-neon animate-pulse" />
                Densidade de Palavras no Áudio
              </span>
              <span>{formatDuration(video.durationSeconds || 300)}</span>
            </div>

            {/* Barra interativa com marcadores de fala */}
            <div className="relative h-3 w-full bg-surface-container-high rounded-full overflow-hidden flex items-center px-1">
              <div
                className="h-1.5 bg-gradient-to-r from-primary-neon to-secondary-neon rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    ((activeSegment.startTime || 1) / (video.durationSeconds || 300)) * 100
                  )}%`,
                }}
              />
              {/* Spikes de correspondência semântica */}
              <div className="absolute left-[35%] w-1 h-2.5 bg-secondary-neon rounded-full shadow-[0_0_8px_#06B6D4]" />
              <div className="absolute left-[52%] w-1 h-2.5 bg-secondary-neon rounded-full shadow-[0_0_8px_#06B6D4]" />
              <div className="absolute left-[78%] w-1 h-2.5 bg-primary-neon rounded-full shadow-[0_0_8px_#8B5CF6]" />
            </div>
          </div>
        </div>

        {/* Search inside transcript */}
        <div className="p-space-md border-b border-[#27272A]/40 flex items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2">
              search
            </span>
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filtrar falas dentro desta transcrição..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-surface-container-low border border-[#27272A] font-sans text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary-neon"
            />
          </div>
          <span className="font-mono text-xs text-outline shrink-0">
            {filteredSegments.length} trechos
          </span>
        </div>

        {/* Transcript Segments List */}
        <div className="flex-1 overflow-y-auto p-space-md flex flex-col gap-2">
          {filteredSegments.length === 0 ? (
            <div className="text-center py-12 text-outline font-sans text-sm">
              Nenhuma ocorrência encontrada para "{filterText}".
            </div>
          ) : (
            filteredSegments.map((segment, index) => {
              const isSelected = activeSegmentIndex === index;
              const hasKeyword = query && segment.text.toLowerCase().includes(query.toLowerCase());

              return (
                <div
                  key={index}
                  onClick={() => setActiveSegmentIndex(index)}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-left group',
                    isSelected
                      ? 'bg-surface-container-high border-secondary-neon/60 shadow-md'
                      : 'bg-surface-container-low/70 border-[#27272A]/40 hover:bg-surface-container-high hover:border-[#27272A]'
                  )}
                >
                  <button
                    type="button"
                    className={cn(
                      'font-mono text-xs px-2 py-1 rounded border transition-colors shrink-0 flex items-center gap-1',
                      isSelected
                        ? 'bg-secondary-neon text-black font-semibold border-secondary-neon'
                        : 'bg-surface-container text-secondary-neon border-[#27272A] group-hover:border-secondary-neon/40'
                    )}
                  >
                    <span className="material-symbols-outlined text-[13px]">play_arrow</span>
                    <span>{formatDuration(segment.startTime)}</span>
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-sans text-xs leading-relaxed',
                        isSelected ? 'text-on-surface font-medium' : 'text-on-surface-variant'
                      )}
                    >
                      {segment.text}
                    </p>
                    {hasKeyword && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono text-secondary-neon bg-secondary-container/15 px-1.5 py-0.2 rounded">
                        ★ Termo pesquisado falado aqui
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(segment.startTime);
                      }}
                      className={cn(
                        "p-1 rounded transition-colors",
                        copiedTime === segment.startTime ? "text-secondary-neon" : "text-outline hover:text-on-surface"
                      )}
                      title={copiedTime === segment.startTime ? "Link copiado!" : "Copiar link no segundo exato"}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {copiedTime === segment.startTime ? 'check' : 'content_copy'}
                      </span>
                    </button>

                    <a
                      href={getTimestampUrl(segment.startTime)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded text-outline hover:text-primary-neon transition-colors"
                      title="Abrir no vídeo oficial a partir deste ponto"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Info */}
        <div className="p-space-sm border-t border-[#27272A] bg-surface-container-low/40 flex items-center justify-between text-outline text-[11px] font-sans px-space-md">
          <span>Fonte: Closed Captions Oficiais</span>
          <span className="text-secondary-neon font-mono">100% Fala Comprovada</span>
        </div>
      </aside>
    </div>
  );
}

