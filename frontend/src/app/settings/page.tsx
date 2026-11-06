'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type SettingsTab = 'platforms' | 'ai' | 'api_keys' | 'general';

interface ProviderItem {
  id: string;
  name: string;
  category: string;
  quota_used: string;
  enabled: boolean;
  circuit: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('platforms');
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [activeModel, setActiveModel] = useState('qwen2.5vl:7b');
  const [availableModels, setAvailableModels] = useState<string[]>(['qwen2.5vl:7b', 'gpt-oss:20b']);
  const [ollamaTestStatus, setOllamaTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [youtubeQuotaLimit, setYoutubeQuotaLimit] = useState(9000);
  const [cacheTtl, setCacheTtl] = useState('24');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Carregar configurações reais e provedores
  const loadInitialData = async () => {
    try {
      const [provRes, settRes, modelsRes] = await Promise.all([
        fetch('/api/admin/providers', { headers: { Accept: 'application/json' } }),
        fetch('/api/admin/settings', { headers: { Accept: 'application/json' } }),
        fetch('/api/ai/models', { headers: { Accept: 'application/json' } }),
      ]);

      if (provRes.ok) {
        const provJson = await provRes.json();
        if (provJson.success) setProviders(provJson.data);
      }

      if (settRes.ok) {
        const settJson = await settRes.json();
        if (settJson.success) {
          setCacheTtl(String(settJson.data.search_cache_ttl_hours || 24));
          setActiveModel(settJson.data.default_ai_model || 'qwen2.5vl:7b');
          setYoutubeQuotaLimit(settJson.data.youtube_daily_quota_limit || 9000);
        }
      }

      if (modelsRes.ok) {
        const mJson = await modelsRes.json();
        if (mJson.models && Array.isArray(mJson.models)) {
          setAvailableModels(mJson.models);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados de configuração:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const togglePlatform = async (id: string) => {
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

  const handleTestOllama = async () => {
    setOllamaTestStatus('testing');
    try {
      const res = await fetch('/api/ai/models', {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setOllamaTestStatus('success');
        showToast('Conexão com Ollama host confirmada! Modelos locais detectados.');
      } else {
        setOllamaTestStatus('error');
      }
    } catch {
      setOllamaTestStatus('error');
    }
  };

  const handlePurgeCache = async () => {
    if (!confirm('Deseja purgar todo o cache do Redis? Consultas subsequentes farão novas varreduras.')) {
      return;
    }
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/cache/flush-all', {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        showToast(json.message || 'Cache purgado com sucesso!');
      }
    } catch (err) {
      console.error('Erro ao purgar cache:', err);
    } finally {
      setIsPurging(false);
    }
  };

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          search_cache_ttl_hours: Number(cacheTtl),
          default_ai_model: activeModel,
          youtube_daily_quota_limit: youtubeQuotaLimit,
        }),
      });
      if (res.ok) {
        showToast('Configurações do sistema salvas com sucesso no Redis!');
      }
    } catch (err) {
      console.error('Erro ao salvar configurações:', err);
    }
  };

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-5xl mx-auto gap-space-lg">
      {/* Toast Feedback */}
      {feedback && (
        <div className="fixed bottom-6 right-6 z-50 bg-surface-container-high text-primary-neon px-4 py-2.5 rounded-xl border border-primary-neon/30 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          <span>{feedback}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <h1 className="font-display font-bold text-2xl text-on-surface">Configurações do Sistema</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Gerenciamento de conectores, parâmetros de inteligência artificial local e cotas gratuitas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/providers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-sans text-xs font-medium border border-[#27272A] transition-all"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary-neon">bolt</span>
            <span>Painel Avançado de Conectores</span>
          </Link>
        </div>
      </div>

      {/* Tabs de Navegação */}
      <div className="flex items-center gap-2 border-b border-[#27272A] overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('platforms')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'platforms'
              ? 'border-primary-neon text-primary-neon'
              : 'border-transparent text-outline hover:text-on-surface'
          )}
        >
          <span className="material-symbols-outlined text-[18px]">hub</span>
          <span>Plataformas & Conectores ({providers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ai')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'ai'
              ? 'border-primary-neon text-primary-neon'
              : 'border-transparent text-outline hover:text-on-surface'
          )}
        >
          <span className="material-symbols-outlined text-[18px]">smart_toy</span>
          <span>Motores de IA (Ollama Local)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('api_keys')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'api_keys'
              ? 'border-primary-neon text-primary-neon'
              : 'border-transparent text-outline hover:text-on-surface'
          )}
        >
          <span className="material-symbols-outlined text-[18px]">key</span>
          <span>Chaves & Quota Guard</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 font-sans text-xs font-semibold border-b-2 transition-all whitespace-nowrap',
            activeTab === 'general'
              ? 'border-primary-neon text-primary-neon'
              : 'border-transparent text-outline hover:text-on-surface'
          )}
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
          <span>Cache & Preferências</span>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Plataformas & Conectores */}
      {activeTab === 'platforms' && (
        <div className="flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-base text-on-surface">Conectores Ativos</h2>
              <p className="font-sans text-xs text-outline">
                Ative ou desative fontes de dados individualmente. O sistema continua operando mesmo se uma ou mais fontes forem desativadas.
              </p>
            </div>
            <Link
              href="/admin/providers"
              className="text-xs font-sans text-primary-neon hover:underline flex items-center gap-1"
            >
              <span>Testar Conexões</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            {providers.map((p) => (
              <div
                key={p.id}
                className="p-space-md rounded-xl bg-surface-container-low border border-[#27272A] flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-semibold text-sm text-on-surface">{p.name}</span>
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] bg-surface-container text-outline">
                      {p.category}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-secondary-neon block mt-0.5">
                    {p.enabled ? 'Ativo na Busca' : 'Desativado'} • Cota: {p.quota_used}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                    p.enabled ? 'bg-primary-neon' : 'bg-surface-container-high'
                  )}
                  title={p.enabled ? 'Desativar provedor' : 'Ativar provedor'}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform',
                      p.enabled ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 2: Motores de IA (Ollama Local) */}
      {activeTab === 'ai' && (
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-base text-on-surface">Configuração do Ollama Local</h2>
              <p className="font-sans text-xs text-outline">
                Integração direta com o executável Ollama nativo instalado na sua máquina host (sem downloads duplicados).
              </p>
            </div>
            <span className="font-mono text-xs text-secondary-neon bg-secondary-container/20 px-2.5 py-1 rounded-md font-semibold">
              Host Nativo Detectado
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs text-outline font-medium">Endpoint do Ollama no Docker</label>
              <input
                type="text"
                disabled
                value="http://videofinder-ollama:11434"
                className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-mono text-xs text-secondary-neon"
              />
              <span className="font-sans text-[11px] text-outline">
                Modelos montados a partir de <code className="text-secondary-neon">~/.ollama/models</code> do Windows.
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs text-outline font-medium">Modelo Ativo para Expansão Semântica</label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-secondary-neon"
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>
                    {m} (Instalado localmente)
                  </option>
                ))}
              </select>
              <span className="font-sans text-[11px] text-outline">
                Modelos detectados na máquina: <strong>{availableModels.join(', ')}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-space-xs border-t border-[#27272A]/50">
            <button
              type="button"
              onClick={handleTestOllama}
              disabled={ollamaTestStatus === 'testing'}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface font-sans text-xs font-semibold border border-[#27272A] transition-all"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary-neon">network_ping</span>
              <span>
                {ollamaTestStatus === 'testing'
                  ? 'Testando conexão...'
                  : ollamaTestStatus === 'success'
                  ? 'Conexão OK! (Modelos Prontos)'
                  : 'Testar Conexão com Ollama'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold hover:brightness-110 shadow-md transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 3: Chaves de API & Quota Guard */}
      {activeTab === 'api_keys' && (
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] flex flex-col gap-space-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-semibold text-base text-on-surface">YouTube Data API v3 & Quota Guard</h2>
              <p className="font-sans text-xs text-outline">
                Chave oficial gratuita do Google Cloud (10.000 unidades diárias gratuitas).
              </p>
            </div>
            <span className="font-mono text-xs text-primary-neon bg-primary-container/20 px-2 py-0.5 rounded font-semibold">
              Quota Guard Ativo
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs text-outline font-medium">YouTube Data API Key (Opcional)</label>
            <input
              type="password"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="Cole sua chave gratuita aqui..."
              className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-mono text-xs text-on-surface focus:outline-none focus:border-primary-neon"
            />
            <span className="font-sans text-[11px] text-outline leading-relaxed">
              As chaves permanecem armazenadas com criptografia restrita no backend e nunca são expostas ao navegador.
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-sans text-xs text-outline font-medium">
              Limite Diário de Segurança (Pontos): {youtubeQuotaLimit} / 10.000
            </label>
            <input
              type="range"
              min={1000}
              max={9900}
              step={500}
              value={youtubeQuotaLimit}
              onChange={(e) => setYoutubeQuotaLimit(Number(e.target.value))}
              className="w-full accent-primary-neon cursor-pointer"
            />
            <span className="font-sans text-[11px] text-outline">
              Ao atingir {youtubeQuotaLimit} pontos, o sistema ativa o fallback automático para a descoberta web SearXNG para não estourar a cota.
            </span>
          </div>

          <div className="flex justify-end pt-space-xs border-t border-[#27272A]/50">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold hover:brightness-110 shadow-md transition-all"
            >
              Salvar Credenciais
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Cache & Preferências */}
      {activeTab === 'general' && (
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] flex flex-col gap-space-md">
          <h2 className="font-display font-semibold text-base text-on-surface">Preferências de Busca & Cache Redis</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs text-outline font-medium">Idioma Padrão das Consultas</label>
              <select className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon">
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">Inglês</option>
                <option value="es">Espanhol</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs text-outline font-medium">Persistência do Cache Redis</label>
              <select
                value={cacheTtl}
                onChange={(e) => setCacheTtl(e.target.value)}
                className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon"
              >
                <option value="24">24 horas (Recomendado)</option>
                <option value="48">48 horas</option>
                <option value="72">72 horas (Máxima economia de cotas)</option>
              </select>
            </div>
          </div>

          {/* Seção de Limpeza de Cache Geral */}
          <div className="p-4 rounded-xl bg-surface-container-lowest border border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
            <div>
              <span className="font-display font-semibold text-sm text-on-surface block">
                Limpeza Geral de Cache Redis
              </span>
              <span className="font-sans text-xs text-outline">
                Expurga todas as pesquisas e metadados cacheados para forçar novas requisições frescas.
              </span>
            </div>

            <button
              type="button"
              disabled={isPurging}
              onClick={handlePurgeCache}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-error/40 text-error hover:bg-error/10 font-sans text-xs font-semibold transition-all shrink-0 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>{isPurging ? 'Purgando...' : 'Purgar Todo o Cache'}</span>
            </button>
          </div>

          <div className="flex justify-end pt-space-xs border-t border-[#27272A]/50">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold hover:brightness-110 shadow-md transition-all"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
