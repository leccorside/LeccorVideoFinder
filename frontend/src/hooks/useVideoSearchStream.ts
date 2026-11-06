'use client';

import { useState, useEffect, useCallback } from 'react';
import { VideoSearchResult, Platform } from '@/types';

interface SearchStreamOptions {
  query: string;
  isAiEnabled?: boolean;
  platforms?: Platform[];
  enabled?: boolean;
}

interface ProviderProgress {
  providerId: string;
  count: number;
  status: string;
  durationMs: number;
}

export function useVideoSearchStream({
  query,
  isAiEnabled = false,
  platforms = [],
  enabled = true,
}: SearchStreamOptions) {
  const [results, setResults] = useState<VideoSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providersProgress, setProvidersProgress] = useState<Record<string, ProviderProgress>>({});
  const [totalFound, setTotalFound] = useState(0);

  const startStream = useCallback(() => {
    if (!query.trim() || !enabled) return;

    setIsLoading(true);
    setIsCompleted(false);
    setError(null);
    setResults([]);
    setProvidersProgress({});

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:18080/api';

    const params = new URLSearchParams({
      q: query,
      ai: isAiEnabled ? '1' : '0',
    });
    if (platforms.length > 0) {
      params.set('platforms', platforms.join(','));
    }

    const eventSource = new EventSource(`${apiUrl}/search/${sessionId}/stream?${params.toString()}`);

    eventSource.addEventListener('session_start', (e: MessageEvent) => {
      // Sessão iniciada
    });

    eventSource.addEventListener('provider_result', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        const { provider_id, count, stats, sample_items } = payload;

        setProvidersProgress((prev) => ({
          ...prev,
          [provider_id]: {
            providerId: provider_id,
            count,
            status: stats?.status || 'success',
            durationMs: stats?.duration_ms || 0,
          },
        }));

        if (sample_items && sample_items.length > 0) {
          setResults((prev) => {
            const map = new Map(prev.map((i) => [i.id, i]));
            for (const item of sample_items) {
              map.set(item.id, item);
            }
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.error('Erro ao processar provider_result SSE:', err);
      }
    });

    eventSource.addEventListener('session_complete', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.results) {
          setResults(payload.results);
          setTotalFound(payload.total || payload.results.length);
        }
        setIsLoading(false);
        setIsCompleted(true);
        eventSource.close();
      } catch (err) {
        console.error('Erro ao processar session_complete SSE:', err);
        setIsLoading(false);
        eventSource.close();
      }
    });

    eventSource.onerror = (err) => {
      // Se a API ainda estiver inicializando ou offline, fallback silencioso
      setIsLoading(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [query, isAiEnabled, platforms, enabled]);

  useEffect(() => {
    const cleanup = startStream();
    return () => {
      cleanup?.();
    };
  }, [startStream]);

  return {
    results,
    isLoading,
    isCompleted,
    error,
    providersProgress,
    totalFound,
    refetch: startStream,
  };
}

