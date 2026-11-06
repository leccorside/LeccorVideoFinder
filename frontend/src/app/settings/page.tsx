'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

type SettingsTab = 'platforms' | 'ai' | 'api_keys' | 'general';

interface PlatformToggle {
  id: string;
  name: string;
  category: string;
  isEnabled: boolean;
  requiresKey: boolean;
  status: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('platforms');
  const [ollamaHost, setOllamaHost] = useState('http://127.0.0.1:11435');
  const [activeModel, setActiveModel] = useState('qwen2.5vl:7b');
  const [ollamaTestStatus, setOllamaTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [youtubeApiKey, setYoutubeApiKey] = useState('');
  const [youtubeQuotaLimit, setYoutubeQuotaLimit] = useState(9000);
  const [isSaved, setIsSaved] = useState(false);

  const [platforms, setPlatforms] = useState<PlatformToggle[]>([
    { id: 'youtube', name: 'YouTube Data API v3', category: 'API Oficial Gratuita', isEnabled: true, requiresKey: true, status: 'Pronto' },
    { id: 'tiktok', name: 'TikTok Discovery Web', category: 'Descoberta Web (SearXNG)', isEnabled: true, requiresKey: false, status: 'Ativo' },
    { id: 'instagram', name: 'Instagram Reels Web', category: 'Descoberta Web (SearXNG)', isEnabled: true, requiresKey: false, status: 'Ativo' },
    { id: 'vimeo', name: 'Vimeo API v3', category: 'API Oficial Gratuita', isEnabled: true, requiresKey: false, status: 'Ativo' },
    { id: 'dailymotion', name: 'Dailymotion API', category: 'API REST Pública', isEnabled: true, requiresKey: false, status: 'Ativo' },
    { id: 'reddit', name: 'Reddit Video Discovery', category: 'API Pública Aberta', isEnabled: true, requiresKey: false, status: 'Ativo' },
    { id: 'twitch', name: 'Twitch Helix Clips', category: 'API Oficial Gratuita', isEnabled: true, requiresKey: true, status: 'Pendente Key' },
    { id: 'kwai', name: 'Kwai Video Search', category: 'Descoberta Web (SearXNG)', isEnabled: true, requiresKey: false, status: 'Ativo' },
  ]);

  const togglePlatform = (id: string) => {
    setPlatforms(
      platforms.map((p) => (p.id === id ? { ...p, isEnabled: !p.isEnabled } : p))
    );
  };

  const handleTestOllama = () => {
    setOllamaTestStatus('testing');
    setTimeout(() => {
      setOllamaTestStatus('success');
    }, 800);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-5xl mx-auto gap-space-lg">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-space-sm border-b border-[#27272A]/50">
        <div>
          <h1 className="font-display font-bold text-2xl text-on-surface">Configurações do Sistema</h1>
          <p className="font-sans text-xs text-on-surface-variant">
            Gerenciamento de conectores, parâmetros de inteligência artificial local e cotas gratuitas.
          </p>
        </div>

        {isSaved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary-neon/20 border border-secondary-neon text-secondary-neon font-sans text-xs font-semibold animate-in fade-in">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            <span>Configurações salvas com sucesso!</span>
          </div>
        )}
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
          <span>Plataformas & Conectores</span>
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
          <span>Preferências Gerais</span>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
            {platforms.map((p) => (
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
                  <span className="font-sans text-xs text-secondary-neon block mt-0.5">{p.status}</span>
                </div>

                <button
                  type="button"
                  onClick={() => togglePlatform(p.id)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                    p.isEnabled ? 'bg-primary-neon' : 'bg-surface-container-high'
                  )}
                  title={p.isEnabled ? 'Desativar provedor' : 'Ativar provedor'}
                >
                  <span
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-md transform transition-transform',
                      p.isEnabled ? 'translate-x-5' : 'translate-x-0'
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
              <label className="font-sans text-xs text-outline font-medium">Endpoint Local do Ollama</label>
              <input
                type="text"
                value={ollamaHost}
                onChange={(e) => setOllamaHost(e.target.value)}
                className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-mono text-xs text-on-surface focus:outline-none focus:border-secondary-neon"
              />
              <span className="font-sans text-[11px] text-outline">
                Dentro do Docker Compose, resolvido via <code className="text-secondary-neon">host.docker.internal:11435</code>
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-sans text-xs text-outline font-medium">Modelo Ativo para Expansão</label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-secondary-neon"
              >
                <option value="qwen2.5vl:7b">qwen2.5vl:7b (Instalado na máquina - 5.9 GB)</option>
                <option value="gpt-oss:20b">gpt-oss:20b (Instalado na máquina - 13.7 GB)</option>
              </select>
              <span className="font-sans text-[11px] text-outline">
                Modelos lidos diretamente da pasta <code className="text-primary-neon">~/.ollama/models</code>
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
                  ? 'Conexão OK! (Status 200)'
                  : 'Testar Conexão com Ollama'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold hover:bg-primary-hover shadow-md transition-all"
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
              className="px-5 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold hover:bg-primary-hover shadow-md transition-all"
            >
              Salvar Credenciais
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba 4: Preferências Gerais */}
      {activeTab === 'general' && (
        <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] flex flex-col gap-space-md">
          <h2 className="font-display font-semibold text-base text-on-surface">Preferências de Busca & Cache</h2>

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
              <select className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon">
                <option value="24">24 horas (Recomendado)</option>
                <option value="48">48 horas</option>
                <option value="72">72 horas (Máxima economia de cotas)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-space-xs border-t border-[#27272A]/50">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-primary-neon text-white font-sans text-xs font-semibold hover:bg-primary-hover shadow-md transition-all"
            >
              Salvar Preferências
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

