'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  platforms: string[];
  resultsCount: number;
  durationMs: number;
}

const mockHistory: HistoryItem[] = [
  {
    id: 'h-1',
    query: 'Nunca desista dos seus sonhos',
    timestamp: 'há 15 minutos',
    platforms: ['YouTube', 'TikTok', 'Vimeo', 'Reddit'],
    resultsCount: 1428,
    durationMs: 340,
  },
  {
    id: 'h-2',
    query: 'Disciplina é mais importante que motivação',
    timestamp: 'hoje às 10:45',
    platforms: ['YouTube', 'Instagram', 'Kwai'],
    resultsCount: 890,
    durationMs: 290,
  },
  {
    id: 'h-3',
    query: 'Steve Jobs discurso Stanford 2005 íntegra',
    timestamp: 'ontem às 18:30',
    platforms: ['YouTube', 'Vimeo', 'Dailymotion'],
    resultsCount: 420,
    durationMs: 410,
  },
  {
    id: 'h-4',
    query: 'Como montar um estúdio de gravação para podcast',
    timestamp: 'há 3 dias',
    platforms: ['YouTube', 'Web'],
    resultsCount: 310,
    durationMs: 520,
  },
];

export default function HistoryPage() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(mockHistory);
  const [isRecordingHistory, setIsRecordingHistory] = useState(true);

  const handleDeleteItem = (id: string) => {
    setHistoryItems(historyItems.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    if (confirm('Deseja realmente limpar todo o histórico de pesquisas?')) {
      setHistoryItems([]);
    }
  };

  const handleRepeatSearch = (query: string) => {
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-5xl mx-auto gap-space-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <h1 className="font-display font-bold text-2xl text-on-surface">Histórico de Pesquisas</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Registro das suas varreduras passadas com latência, filtros aplicados e atalho de repetição.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#27272A] hover:bg-surface-container-high text-outline hover:text-error text-xs font-sans font-medium transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Limpar Tudo</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsRecordingHistory(!isRecordingHistory)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-sans font-medium transition-all',
              isRecordingHistory
                ? 'bg-surface-container-low border-[#27272A] text-secondary-neon'
                : 'bg-surface-container-high border-tertiary-neon/40 text-tertiary-neon'
            )}
            title="Pausar gravação de pesquisas no banco local"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isRecordingHistory ? 'history' : 'history_toggle_off'}
            </span>
            <span>{isRecordingHistory ? 'Histórico Ativo' : 'Pausado'}</span>
          </button>
        </div>
      </div>

      {/* Lista Cronológica de Consultas */}
      {historyItems.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center justify-center bg-surface-container-low/20 rounded-2xl border border-dashed border-[#27272A]">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">history</span>
          <h3 className="font-display font-semibold text-base text-on-surface mb-1">
            Nenhuma pesquisa gravada no histórico
          </h3>
          <p className="font-sans text-xs text-outline max-w-sm">
            As pesquisas executadas no Omnibar aparecerão aqui para repetição rápida.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {historyItems.map((item) => (
            <div
              key={item.id}
              className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-[#27272A] hover:border-primary-neon/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-secondary-neon shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">search</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-semibold text-sm text-on-surface group-hover:text-primary-neon transition-colors truncate">
                      "{item.query}"
                    </span>
                    <span className="font-sans text-[11px] text-outline">• {item.timestamp}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-secondary-neon bg-secondary-container/15 px-2 py-0.5 rounded font-medium">
                      {item.resultsCount} vídeos encontrados
                    </span>
                    <span className="font-mono text-[11px] text-outline">
                      Latência: {(item.durationMs / 1000).toFixed(2)}s
                    </span>
                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-sans text-outline">
                      <span>Fontes:</span>
                      {item.platforms.join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 shrink-0 sm:self-center">
                <button
                  type="button"
                  onClick={() => handleRepeatSearch(item.query)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-neon/15 hover:bg-primary-neon/25 text-primary-neon font-sans text-xs font-semibold border border-primary-neon/30 transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">replay</span>
                  <span>Repetir</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-surface-container-high transition-colors"
                  title="Excluir do histórico"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

