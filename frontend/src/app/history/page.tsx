'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: number | string;
  query: string;
  platform_filters?: string[];
  duration_filter?: string;
  mode?: string;
  results_count: number;
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecordingHistory, setIsRecordingHistory] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Carregar status do gravação do localStorage
  useEffect(() => {
    const savedPref = localStorage.getItem('videofinder_record_history');
    if (savedPref !== null) {
      setIsRecordingHistory(savedPref === 'true');
    }
  }, []);

  const toggleRecording = () => {
    const nextState = !isRecordingHistory;
    setIsRecordingHistory(nextState);
    localStorage.setItem('videofinder_record_history', String(nextState));
    showFeedback(nextState ? 'Gravação de histórico ativada' : 'Gravação de histórico pausada');
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setHistoryItems(json.data);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteItem = async (id: number | string) => {
    try {
      const res = await fetch(`/api/history/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setHistoryItems((prev) => prev.filter((item) => item.id !== id));
        showFeedback('Item removido do histórico');
      }
    } catch (err) {
      console.error('Erro ao excluir item do histórico:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Deseja realmente limpar todo o seu histórico de pesquisas?')) {
      return;
    }

    try {
      const res = await fetch('/api/history', {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setHistoryItems([]);
        showFeedback('Todo o histórico foi limpo');
      }
    } catch (err) {
      console.error('Erro ao limpar histórico:', err);
    }
  };

  const handleRepeatSearch = (item: HistoryItem) => {
    if (item.mode === 'ai_semantic') {
      router.push(`/ai-search?q=${encodeURIComponent(item.query)}`);
    } else {
      router.push(`/search?q=${encodeURIComponent(item.query)}`);
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMin < 2) return 'agora há pouco';
      if (diffMin < 60) return `há ${diffMin} min`;
      if (diffHours < 24) return `há ${diffHours} h`;
      if (diffDays === 1) return 'ontem';
      if (diffDays < 7) return `há ${diffDays} dias`;
      return date.toLocaleDateString('pt-BR');
    } catch {
      return 'recente';
    }
  };

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-5xl mx-auto gap-space-lg">
      {/* Mensagem Flutuante de Feedback */}
      {feedbackMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high text-primary-neon px-4 py-2.5 rounded-xl border border-primary-neon/30 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px]">info</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <h1 className="font-display font-bold text-2xl text-on-surface">Histórico de Pesquisas</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Registro de varreduras em tempo real, filtros aplicados e atalhos rápidos de repetição.
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
            onClick={toggleRecording}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-sans font-medium transition-all',
              isRecordingHistory
                ? 'bg-surface-container-low border-[#27272A] text-secondary-neon hover:border-secondary-neon/50'
                : 'bg-surface-container-high border-tertiary-neon/40 text-tertiary-neon'
            )}
            title="Alternar gravação de pesquisas no banco de dados local"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isRecordingHistory ? 'history' : 'history_toggle_off'}
            </span>
            <span>{isRecordingHistory ? 'Histórico Ativo' : 'Gravação Pausada'}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-neon/20 border-t-primary-neon animate-spin" />
          <span className="font-mono text-xs text-outline">Carregando histórico do banco de dados...</span>
        </div>
      ) : historyItems.length === 0 ? (
        /* Empty State */
        <div className="py-24 text-center flex flex-col items-center justify-center bg-surface-container-low/20 rounded-2xl border border-dashed border-[#27272A]">
          <span className="material-symbols-outlined text-4xl text-outline mb-2">history</span>
          <h3 className="font-display font-semibold text-base text-on-surface mb-1">
            Nenhuma pesquisa gravada no histórico
          </h3>
          <p className="font-sans text-xs text-outline max-w-sm mb-4">
            As pesquisas que você executar no Omnibar aparecerão aqui para repetição e auditoria rápida.
          </p>
          <button
            type="button"
            onClick={() => router.push('/search')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-neon text-surface font-sans font-semibold text-xs shadow-md shadow-primary-neon/20 hover:brightness-110 transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span>Realizar Primeira Pesquisa</span>
          </button>
        </div>
      ) : (
        /* Lista Cronológica de Consultas */
        <div className="flex flex-col gap-3">
          {historyItems.map((item) => {
            const isAi = item.mode === 'ai_semantic';
            const platforms = item.platform_filters && item.platform_filters.length > 0 
              ? item.platform_filters 
              : ['Todas as redes'];

            return (
              <div
                key={item.id}
                className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-[#27272A] hover:border-primary-neon/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                      isAi
                        ? 'bg-secondary-container/20 text-secondary-neon border border-secondary-neon/30'
                        : 'bg-surface-container-high text-primary-neon'
                    )}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {isAi ? 'psychology' : 'search'}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display font-semibold text-sm text-on-surface group-hover:text-primary-neon transition-colors truncate">
                        &quot;{item.query}&quot;
                      </span>
                      <span className="font-sans text-[11px] text-outline">
                        • {formatRelativeTime(item.created_at)}
                      </span>
                      {isAi && (
                        <span className="font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-secondary-neon/15 text-secondary-neon border border-secondary-neon/30 font-semibold">
                          IA Semântica
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] text-secondary-neon bg-secondary-container/15 px-2 py-0.5 rounded font-medium">
                        {item.results_count} vídeos encontrados
                      </span>
                      {item.duration_filter && item.duration_filter !== 'all' && (
                        <span className="font-mono text-[11px] text-tertiary-neon bg-tertiary-container/15 px-2 py-0.5 rounded">
                          Filtro: {item.duration_filter}
                        </span>
                      )}
                      <div className="hidden sm:flex items-center gap-1 text-[11px] font-sans text-outline">
                        <span>Fontes:</span>
                        <span className="text-on-surface-variant capitalize">
                          {platforms.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleRepeatSearch(item)}
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
            );
          })}
        </div>
      )}
    </div>
  );
}
