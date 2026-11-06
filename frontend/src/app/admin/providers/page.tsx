'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Provider {
  id: string;
  name: string;
  category: string;
  quota_type: string;
  quota_used: string;
  capabilities: string[];
  enabled: boolean;
  circuit: string;
}

interface TestResult {
  provider: string;
  status: 'healthy' | 'unhealthy';
  latency_ms: number;
  results_count: number;
  sample?: { title: string; url: string } | null;
  message?: string;
  error?: string;
}

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadProviders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/providers', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setProviders(json.data);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar provedores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/providers/${id}/toggle`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, enabled: json.enabled } : p))
        );
        showToast(json.message);
      }
    } catch (err) {
      console.error('Erro ao alternar provedor:', err);
    }
  };

  const handleResetCircuit = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/providers/${id}/reset-circuit`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setProviders((prev) =>
          prev.map((p) => (p.id === id ? { ...p, circuit: 'CLOSED' } : p))
        );
        showToast(json.message);
      }
    } catch (err) {
      console.error('Erro ao resetar circuito:', err);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/admin/providers/${id}/test`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      const json = await res.json();
      setTestResults((prev) => ({
        ...prev,
        [id]: json,
      }));
      showToast(json.message || 'Teste concluído com sucesso');
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [id]: {
          provider: id,
          status: 'unhealthy',
          latency_ms: 0,
          results_count: 0,
          error: 'Falha na conexão com o servidor',
        },
      }));
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-6xl mx-auto gap-space-lg">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high text-primary-neon px-4 py-2.5 rounded-xl border border-primary-neon/30 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Header com Breadcrumb */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-wider text-outline uppercase">
              Admin Master
            </span>
            <span className="text-outline font-mono text-[10px]">/</span>
            <span className="font-mono text-[10px] tracking-wider text-primary-neon uppercase font-semibold">
              Integrações & Fontes de Dados
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high ml-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-neon" />
              <span className="font-mono text-[10px] text-secondary-neon font-semibold">
                {providers.filter((p) => p.enabled).length} de {providers.length} Ativos
              </span>
            </div>
          </div>
          <h1 className="font-display font-bold text-2xl text-on-surface">
            Configurações de Plataformas & Conectores
          </h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Gerencie adaptadores de busca, controle de cotas, teste de conectividade e circuit breakers de tolerância a falhas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-sans text-xs font-medium border border-[#27272A] transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">query_stats</span>
            <span>Ver Dashboard Geral</span>
          </Link>
          <button
            type="button"
            onClick={loadProviders}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-[#27272A] hover:border-secondary-neon/40 text-on-surface text-xs"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary-neon">sync</span>
            <span>Recarregar</span>
          </button>
        </div>
      </div>

      {/* Grid de 3 Cards de Telemetria */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline">
              Capacidade Operacional
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-primary-neon font-mono text-[10px]">
              Multi-Engine
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-display text-3xl font-bold text-on-surface">7</span>
            <span className="font-sans text-sm text-outline">/ 7 Provedores Integrados</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary-neon h-1.5 rounded-full w-full" />
          </div>
        </div>

        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline">
              Cota Diária YouTube
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary-neon font-mono text-[10px]">
              QuotaGuard Ativo
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-display text-3xl font-bold text-on-surface">10.000</span>
            <span className="font-sans text-sm text-outline">pontos diários gratuitos</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
            <div className="bg-secondary-neon h-1.5 rounded-full w-[2%]" />
          </div>
        </div>

        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-outline">
              Circuit Breakers
            </span>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-secondary-neon font-mono text-[10px]">
              100% Saudável
            </span>
          </div>
          <div className="flex items-baseline gap-2 my-2">
            <span className="font-display text-3xl font-bold text-secondary-neon">CLOSED</span>
            <span className="font-sans text-sm text-outline">zero falhas críticas</span>
          </div>
          <div className="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden">
            <div className="bg-secondary-neon h-1.5 rounded-full w-full" />
          </div>
        </div>
      </div>

      {/* Lista de Conectores com Controles de Teste e Toggle */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-neon/20 border-t-primary-neon animate-spin" />
          <span className="font-mono text-xs text-outline">Carregando adaptadores de conexão...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {providers.map((p) => {
            const isTesting = testingId === p.id;
            const testResult = testResults[p.id];
            const isHealthyCircuit = p.circuit === 'CLOSED';

            return (
              <div
                key={p.id}
                className={cn(
                  'p-space-lg rounded-2xl bg-surface-container-low border transition-all flex flex-col gap-4 shadow-sm',
                  p.enabled
                    ? 'border-[#27272A] hover:border-primary-neon/40'
                    : 'border-[#27272A]/40 opacity-70 bg-surface-container-lowest'
                )}
              >
                {/* Linha Superior: Nome, Categoria, Status, Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                        p.enabled ? 'bg-primary-neon/15 text-primary-neon' : 'bg-surface-container-high text-outline'
                      )}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {p.id === 'youtube'
                          ? 'smart_display'
                          : p.id === 'searxng_web'
                          ? 'travel_explore'
                          : p.id === 'dailymotion'
                          ? 'play_circle'
                          : p.id === 'tiktok'
                          ? 'music_note'
                          : p.id === 'vimeo'
                          ? 'video_library'
                          : p.id === 'reddit'
                          ? 'forum'
                          : 'movie'}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-display font-semibold text-base text-on-surface">
                          {p.name}
                        </h3>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-outline uppercase">
                          {p.category}
                        </span>
                        <span
                          className={cn(
                            'font-mono text-[10px] px-2 py-0.5 rounded font-semibold uppercase',
                            isHealthyCircuit
                              ? 'bg-secondary-container/15 text-secondary-neon'
                              : 'bg-error/20 text-error'
                          )}
                        >
                          Circuito: {p.circuit}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-sans text-outline">
                        <span>Cota: <strong className="text-on-surface-variant font-mono">{p.quota_used}</strong></span>
                        <span>•</span>
                        <span>Tipo: <span className="text-on-surface-variant">{p.quota_type}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Ações: Testar, Resetar Circuito, Toggle On/Off */}
                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {!isHealthyCircuit && (
                      <button
                        type="button"
                        onClick={() => handleResetCircuit(p.id)}
                        className="px-3 py-1.5 rounded-xl bg-tertiary-container/20 text-tertiary-neon hover:bg-tertiary-container/30 border border-tertiary-container/40 text-xs font-sans font-medium transition-all"
                      >
                        Resetar Circuito
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={isTesting}
                      onClick={() => handleTestConnection(p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-sans text-xs font-medium border border-[#27272A] transition-all disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-neon/20 border-t-primary-neon animate-spin" />
                          <span>Testando...</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px] text-secondary-neon">bolt</span>
                          <span>Testar Conexão</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggle(p.id)}
                      className={cn(
                        'w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none',
                        p.enabled ? 'bg-primary-neon' : 'bg-surface-container-highest'
                      )}
                      title={p.enabled ? 'Desativar conector' : 'Ativar conector'}
                    >
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full bg-surface shadow-md transform transition-transform',
                          p.enabled ? 'translate-x-6' : 'translate-x-0'
                        )}
                      />
                    </button>
                  </div>
                </div>

                {/* Capabilities Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#27272A]/40">
                  <span className="font-mono text-[10px] text-outline uppercase font-semibold mr-1">
                    Recursos Suportados:
                  </span>
                  {p.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant"
                    >
                      {cap}
                    </span>
                  ))}
                </div>

                {/* Resultado do Teste em Tempo Real (se executado) */}
                {testResult && (
                  <div
                    className={cn(
                      'p-3 rounded-xl border text-xs font-mono flex flex-col gap-1.5 animate-in fade-in',
                      testResult.status === 'healthy'
                        ? 'bg-secondary-container/10 border-secondary-neon/30 text-secondary-neon'
                        : 'bg-error/10 border-error/30 text-error'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px]">
                          {testResult.status === 'healthy' ? 'check_circle' : 'error'}
                        </span>
                        <strong className="uppercase">
                          {testResult.status === 'healthy' ? 'Operacional' : 'Falha'}
                        </strong>
                        <span>({testResult.latency_ms}ms)</span>
                      </div>
                      <span>{testResult.results_count} vídeos retornados</span>
                    </div>
                    {testResult.sample && (
                      <div className="text-[11px] text-on-surface-variant flex items-center gap-1">
                        <span>Amostra:</span>
                        <a
                          href={testResult.sample.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline text-primary-neon truncate"
                        >
                          &quot;{testResult.sample.title}&quot;
                        </a>
                      </div>
                    )}
                    {testResult.error && (
                      <span className="text-[11px] text-error font-sans">{testResult.error}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
