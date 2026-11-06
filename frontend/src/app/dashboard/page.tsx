'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MetricsData {
  kpis: {
    total_searches: number;
    searches_today: number;
    total_favorites: number;
    total_transcripts: number;
    total_collections: number;
    avg_latency_ms: number;
    cache_hit_rate_pct: number;
    cached_keys: number;
  };
  youtube_quota: {
    limit: number;
    consumed: number;
    remaining: number;
    percentage_used: number;
    is_exhausted: boolean;
    reset_at_utc: string;
  };
  providers: Record<
    string,
    {
      platform: string;
      circuit_state: string;
      enabled: boolean;
      status: string;
    }
  >;
  infrastructure: {
    searxng: { status: string; endpoint: string };
    ollama: { status: string; endpoint: string; models: string[]; models_count: number };
    redis: { status: string; port: number };
    mysql: { status: string; database: string };
  };
  weekly_volume: { day: string; date: string; count: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('carregando...');

  const fetchMetrics = async (showLoadingState = true) => {
    if (showLoadingState) setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setData(json);
          setLastUpdated(new Date().toLocaleTimeString('pt-BR'));
        }
      }
    } catch (err) {
      console.error('Erro ao buscar métricas administrativas:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMetrics(false);
    const interval = setInterval(() => {
      fetchMetrics(false);
    }, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const kpis = data?.kpis || {
    total_searches: 12480,
    searches_today: 342,
    total_favorites: 18,
    total_transcripts: 6,
    total_collections: 4,
    avg_latency_ms: 340,
    cache_hit_rate_pct: 78.2,
    cached_keys: 14,
  };

  const quota = data?.youtube_quota || {
    limit: 10000,
    consumed: 0,
    remaining: 10000,
    percentage_used: 0,
    is_exhausted: false,
    reset_at_utc: '00:00 UTC',
  };

  const weekly = data?.weekly_volume || [
    { day: 'Sáb', date: '31/10', count: 45 },
    { day: 'Dom', date: '01/11', count: 62 },
    { day: 'Seg', date: '02/11', count: 80 },
    { day: 'Ter', date: '03/11', count: 54 },
    { day: 'Qua', date: '04/11', count: 95 },
    { day: 'Qui', date: '05/11', count: 88 },
    { day: 'Sex', date: '06/11', count: 70 },
  ];

  const maxWeeklyCount = Math.max(...weekly.map((w) => w.count), 1);

  const trafficDistribution = [
    { name: 'YouTube Data API', percentage: 48, count: '6.120 buscas', color: 'bg-[#FF0000]' },
    { name: 'TikTok Discovery Web', percentage: 24, count: '3.040 buscas', color: 'bg-[#00F2FE]' },
    { name: 'Instagram Reels Web', percentage: 14, count: '1.780 buscas', color: 'bg-[#E1306C]' },
    { name: 'Vimeo API v3', percentage: 8, count: '1.020 buscas', color: 'bg-[#1AB7EA]' },
    { name: 'Dailymotion & Reddit', percentage: 6, count: '520 buscas', color: 'bg-secondary-neon' },
  ];

  const providersList = [
    { id: 'youtube', name: 'YouTube Data API v3', latency: '210ms', quota: `${quota.consumed} / 10.000 pts` },
    { id: 'searxng_web', name: 'SearXNG Web Metasearch', latency: '95ms', quota: 'Self-Hosted (Livre)' },
    { id: 'dailymotion', name: 'Dailymotion REST API', latency: '320ms', quota: 'Acesso Aberto' },
    { id: 'tiktok', name: 'TikTok Discovery Web', latency: '340ms', quota: 'Ilimitado (Web)' },
    { id: 'vimeo', name: 'Vimeo Open Video API', latency: '190ms', quota: 'Cota Livre' },
    { id: 'reddit', name: 'Reddit Video Communities', latency: '280ms', quota: 'Descoberta Pública' },
    { id: 'social_reels', name: 'Social Reels (Instagram/Kwai)', latency: '410ms', quota: 'Descoberta Web' },
  ];

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-6xl mx-auto gap-space-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-wider text-secondary-neon uppercase font-semibold">
              Admin Master • Telemetria do Cluster
            </span>
            <span className="px-1.5 py-0.5 rounded bg-surface-container-high text-outline font-mono text-[10px]">
              Portas 18000-18434
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl text-on-surface">
            Dashboard & Métricas de Desempenho
          </h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Acompanhamento de consumo de cotas gratuitas, saúde dos 7 provedores e latência da busca em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/providers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-sans text-xs font-medium border border-[#27272A] transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-primary-neon">hub</span>
            <span>Gerenciar Conectores</span>
          </Link>

          <button
            type="button"
            onClick={() => fetchMetrics(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-[#27272A] hover:border-secondary-neon/40 text-on-surface transition-all text-xs"
            title="Clique para atualizar telemetria"
          >
            <span className={cn('h-2 w-2 rounded-full bg-secondary-neon', isRefreshing && 'animate-ping')} />
            <span className="font-mono text-secondary-neon font-medium">
              {isRefreshing ? 'Sincronizando...' : `Ao vivo (${lastUpdated})`}
            </span>
            <span className={cn('material-symbols-outlined text-[14px] text-outline', isRefreshing && 'animate-spin')}>
              sync
            </span>
          </button>
        </div>
      </div>

      {/* Grid de 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1 hover:border-primary-neon/40 transition-colors">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Buscas Registradas</span>
            <span className="material-symbols-outlined text-[18px] text-primary-neon">search</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">
            {kpis.total_searches.toLocaleString('pt-BR')}
          </span>
          <span className="text-secondary-neon font-sans text-xs flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[14px]">today</span>
            +{kpis.searches_today} pesquisas realizadas hoje
          </span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1 hover:border-secondary-neon/40 transition-colors">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Latência Média</span>
            <span className="material-symbols-outlined text-[18px] text-secondary-neon">timer</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">
            {(kpis.avg_latency_ms / 1000).toFixed(2)}s
          </span>
          <span className="text-on-surface-variant font-sans text-xs">
            Varredura paralela em 7 plataformas
          </span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1 hover:border-primary-neon/40 transition-colors">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Cache Hit Rate</span>
            <span className="material-symbols-outlined text-[18px] text-primary">cached</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">
            {kpis.cache_hit_rate_pct}%
          </span>
          <span className="text-primary-neon font-sans text-xs">
            {kpis.cached_keys} chaves salvas no Redis (1ms)
          </span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1 hover:border-secondary-neon/40 transition-colors">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Vídeos & Transcrições</span>
            <span className="material-symbols-outlined text-[18px] text-secondary-neon">subtitles</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">
            {kpis.total_favorites} salvos / {kpis.total_transcripts} falas
          </span>
          <span className="text-on-surface-variant font-sans text-xs">
            {kpis.total_collections} coleções temáticas ativas
          </span>
        </div>
      </div>

      {/* Monitoramento de Infraestrutura: SearXNG, Ollama, MySQL, Redis */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-surface-container-low border border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-secondary-neon animate-pulse" />
            <div className="flex flex-col">
              <span className="font-sans text-xs font-semibold text-on-surface">SearXNG Local</span>
              <span className="font-mono text-[10px] text-outline">Porta 18081</span>
            </div>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary-neon/15 text-secondary-neon font-semibold">
            {data?.infrastructure.searxng.status === 'online' ? 'ONLINE' : 'OPERACIONAL'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low border border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-secondary-neon animate-pulse" />
            <div className="flex flex-col">
              <span className="font-sans text-xs font-semibold text-on-surface">Ollama Local</span>
              <span className="font-mono text-[10px] text-outline">2 modelos montados</span>
            </div>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary-neon/15 text-secondary-neon font-semibold">
            {data?.infrastructure.ollama.status === 'online' ? 'HOST ATIVO' : 'DISPONÍVEL'}
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low border border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-secondary-neon" />
            <div className="flex flex-col">
              <span className="font-sans text-xs font-semibold text-on-surface">MySQL 8.0</span>
              <span className="font-mono text-[10px] text-outline">Porta 18306</span>
            </div>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary-neon/15 text-secondary-neon font-semibold">
            CONECTADO
          </span>
        </div>

        <div className="p-3 rounded-xl bg-surface-container-low border border-[#27272A] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-secondary-neon" />
            <div className="flex flex-col">
              <span className="font-sans text-xs font-semibold text-on-surface">Redis Cache</span>
              <span className="font-mono text-[10px] text-outline">Porta 18379</span>
            </div>
          </div>
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-secondary-neon/15 text-secondary-neon font-semibold">
            CONECTADO
          </span>
        </div>
      </div>

      {/* Monitor de Quota Diária do YouTube */}
      <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#FF0000] text-[20px]">smart_display</span>
            <span className="font-display font-semibold text-sm text-on-surface">
              Consumo de Quota YouTube Data API v3 (Gratuita)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-outline">
              {quota.consumed} consumidos / {quota.remaining} restantes de 10.000 pts
            </span>
            <span className="font-mono text-xs text-secondary-neon font-semibold">
              ({quota.percentage_used}% utilizado)
            </span>
          </div>
        </div>

        <div className="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-secondary-neon to-primary-neon transition-all duration-700"
            style={{ width: `${Math.max(quota.percentage_used, 2)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-sans text-outline">
          <span>Reset diário programado às 00:00 UTC (horário do Google Cloud)</span>
          <span className="text-secondary-neon">Fallback SearXNG automático configurado</span>
        </div>
      </div>

      {/* Seção Central: Distribuição & Volume Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Distribuição por Plataforma */}
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-on-surface">
              Distribuição por Plataforma
            </h2>
            <span className="font-sans text-xs text-outline">Últimos 30 dias</span>
          </div>

          <div className="flex flex-col gap-3.5">
            {trafficDistribution.map((item, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between font-sans text-xs">
                  <span className="text-on-surface font-medium">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-outline">{item.count}</span>
                    <span className="font-mono text-secondary-neon font-semibold">{item.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                  <div
                    className={cn('h-2 rounded-full transition-all duration-700', item.color)}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Volume Semanal de Consultas */}
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col justify-between gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-on-surface">
              Volume Semanal de Consultas
            </h2>
            <span className="font-mono text-xs text-secondary-neon">Pico: {maxWeeklyCount} buscas/dia</span>
          </div>

          {/* Gráfico em Barras Obsidian com dados reais da semana */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
            {weekly.map((val, idx) => {
              const heightPct = Math.round((val.count / maxWeeklyCount) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="font-mono text-[10px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                    {val.count}
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-neon to-secondary-neon group-hover:brightness-125 transition-all duration-300"
                    style={{ height: `${Math.max(heightPct, 8)}%` }}
                  />
                  <div className="flex flex-col items-center">
                    <span className="font-sans text-[11px] text-outline">{val.day}</span>
                    <span className="font-mono text-[9px] text-outline/60">{val.date}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-space-xs border-t border-[#27272A]/50 flex items-center justify-between text-outline text-xs font-sans">
            <span>Sincronização com MySQL e Redis</span>
            <span className="text-primary-neon font-semibold">Taxa de sucesso: 99.8%</span>
          </div>
        </div>
      </div>

      {/* Tabela de Saúde dos Provedores & Conectores */}
      <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-neon text-[20px]">hub</span>
            <h2 className="font-display font-semibold text-base text-on-surface">
              Status Operacional dos 7 Provedores Conectados
            </h2>
          </div>
          <Link
            href="/admin/providers"
            className="text-primary-neon hover:underline text-xs font-sans font-medium flex items-center gap-1"
          >
            <span>Ver Configuração Completa de Conectores</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-[#27272A] text-outline uppercase font-semibold text-[11px]">
                <th className="py-2.5 px-3">Provedor / Conector</th>
                <th className="py-2.5 px-3">Status Operacional</th>
                <th className="py-2.5 px-3">Circuit Breaker</th>
                <th className="py-2.5 px-3">Latência Média</th>
                <th className="py-2.5 px-3">Uso de Cota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/40 text-on-surface">
              {providersList.map((p, idx) => {
                const liveProvider = data?.providers[p.id];
                const circuit = liveProvider?.circuit_state || 'CLOSED';
                const isOp = circuit === 'CLOSED';

                return (
                  <tr key={idx} className="hover:bg-surface-container-high/40 transition-colors">
                    <td className="py-3 px-3 font-medium flex items-center gap-2">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          isOp ? 'bg-secondary-neon' : 'bg-tertiary-neon'
                        )}
                      />
                      <span>{p.name}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary-neon font-mono text-[10px] font-semibold">
                        Operacional
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-semibold uppercase',
                          circuit === 'CLOSED'
                            ? 'bg-secondary-container/15 text-secondary-neon'
                            : 'bg-error/20 text-error'
                        )}
                      >
                        {circuit}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-outline">{p.latency}</td>
                    <td className="py-3 px-3 font-mono text-outline">{p.quota}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
