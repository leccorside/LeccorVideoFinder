'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const providersHealth = [
    { name: 'YouTube Data API v3', status: 'Operacional', latency: '210ms', quotaUsed: '1.200 / 10.000 pts', isHealthy: true },
    { name: 'TikTok Discovery Web', status: 'Operacional', latency: '340ms', quotaUsed: 'Ilimitado (Web)', isHealthy: true },
    { name: 'Instagram Reels Web', status: 'Operacional', latency: '410ms', quotaUsed: 'Ilimitado (Web)', isHealthy: true },
    { name: 'Vimeo API v3', status: 'Operacional', latency: '190ms', quotaUsed: 'Cota Livre', isHealthy: true },
    { name: 'SearXNG Local', status: 'Operacional', latency: '95ms', quotaUsed: 'Self-Hosted', isHealthy: true },
    { name: 'Ollama IA Local (Host)', status: 'Operacional', latency: '48ms', quotaUsed: '100% Local (CPU/GPU)', isHealthy: true },
  ];

  const trafficDistribution = [
    { name: 'YouTube', percentage: 48, count: '6.120 buscas', color: 'bg-[#FF0000]' },
    { name: 'TikTok', percentage: 24, count: '3.040 buscas', color: 'bg-[#00F2FE]' },
    { name: 'Instagram Reels', percentage: 14, count: '1.780 buscas', color: 'bg-[#E1306C]' },
    { name: 'Vimeo', percentage: 8, count: '1.020 buscas', color: 'bg-[#1AB7EA]' },
    { name: 'Outros (Reddit/Dailymotion/Web)', percentage: 6, count: '520 buscas', color: 'bg-secondary-neon' },
  ];

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-6xl mx-auto gap-space-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <h1 className="font-display font-bold text-2xl text-on-surface">Dashboard & Métricas</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Monitoramento de desempenho do mecanismo de pesquisa, saúde das conexões e consumo de limites gratuitos.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low border border-[#27272A]">
          <span className="h-2 w-2 rounded-full bg-secondary-neon animate-pulse" />
          <span className="font-mono text-xs text-secondary-neon font-semibold">Telemetria ao Vivo</span>
        </div>
      </div>

      {/* Grid de 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Buscas Totais</span>
            <span className="material-symbols-outlined text-[18px] text-primary-neon">search</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">12.480</span>
          <span className="text-secondary-neon font-sans text-xs flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[14px]">trending_up</span>
            +18% em relação à última semana
          </span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Tempo Médio Resposta</span>
            <span className="material-symbols-outlined text-[18px] text-secondary-neon">timer</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">0.34s</span>
          <span className="text-on-surface-variant font-sans text-xs">
            Varredura paralela otimizada
          </span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Cache Hit Rate</span>
            <span className="material-symbols-outlined text-[18px] text-primary">cached</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">78.2%</span>
          <span className="text-primary-neon font-sans text-xs">
            Economia de 9.600 requisições
          </span>
        </div>

        <div className="p-space-md rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-1">
          <div className="flex items-center justify-between text-outline">
            <span className="font-mono text-[11px] uppercase font-semibold">Vídeos Mapeados</span>
            <span className="material-symbols-outlined text-[18px] text-secondary-neon">video_library</span>
          </div>
          <span className="font-display font-bold text-2xl text-on-surface">8.4M</span>
          <span className="text-on-surface-variant font-sans text-xs">
            Metadados públicos sincronizados
          </span>
        </div>
      </div>

      {/* Seção Central: Distribuição por Provedor & Gráfico de Tendência */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg">
        {/* Distribuição por Plataforma */}
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-on-surface">
              Distribuição por Plataforma
            </h2>
            <span className="font-sans text-xs text-outline">Últimos 30 dias</span>
          </div>

          <div className="flex flex-col gap-4">
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

        {/* Volume de Consultas em Barras Obsidian */}
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col justify-between gap-space-md">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-on-surface">
              Volume Semanal de Consultas
            </h2>
            <span className="font-mono text-xs text-secondary-neon">Pico: 2.140/dia</span>
          </div>

          {/* Gráfico Simulado em CSS com Barras de Gradiente */}
          <div className="h-48 flex items-end justify-between gap-2 pt-6 px-2">
            {[45, 62, 80, 54, 95, 88, 70].map((val, idx) => {
              const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="font-mono text-[10px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">
                    {val * 22}
                  </div>
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-primary-neon to-secondary-neon group-hover:brightness-125 transition-all duration-300"
                    style={{ height: `${val}%` }}
                  />
                  <span className="font-sans text-[11px] text-outline">{days[idx]}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-space-xs border-t border-[#27272A]/50 flex items-center justify-between text-outline text-xs font-sans">
            <span>Média diária: 1.782 pesquisas</span>
            <span className="text-primary-neon font-semibold">Taxa de sucesso: 99.4%</span>
          </div>
        </div>
      </div>

      {/* Tabela de Saúde dos Provedores & Conectores */}
      <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-neon text-[20px]">hub</span>
            <h2 className="font-display font-semibold text-base text-on-surface">
              Status Operacional dos Provedores Conectados
            </h2>
          </div>
          <span className="font-sans text-xs text-outline">Atualizado a cada 30 segundos</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans text-xs">
            <thead>
              <tr className="border-b border-[#27272A] text-outline uppercase font-semibold text-[11px]">
                <th className="py-2.5 px-3">Provedor / Conector</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Latência Média</th>
                <th className="py-2.5 px-3">Uso de Cota Diária</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]/40 text-on-surface">
              {providersHealth.map((p, idx) => (
                <tr key={idx} className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-3 px-3 font-medium flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-secondary-neon" />
                    <span>{p.name}</span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary-neon font-mono text-[10px] font-semibold">
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-outline">{p.latency}</td>
                  <td className="py-3 px-3 font-mono text-outline">{p.quotaUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

