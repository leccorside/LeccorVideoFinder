'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SemanticVariant {
  title: string;
  category: string;
  icon: string;
}

export default function AISearchPage() {
  const router = useRouter();
  const [naturalPrompt, setNaturalPrompt] = useState(
    'Quero vídeos motivacionais falando sobre pessoas que fracassaram várias vezes antes de conquistar seus objetivos.'
  );
  const [selectedModel, setSelectedModel] = useState<'qwen2.5vl:7b' | 'gpt-oss:20b'>('qwen2.5vl:7b');
  const [semanticMode, setSemanticMode] = useState<'hybrid' | 'deep_semantic'>('hybrid');
  const [isOllamaReady, setIsOllamaReady] = useState(true);
  const [availableModels, setAvailableModels] = useState<string[]>(['qwen2.5vl:7b', 'gpt-oss:20b']);

  useEffect(() => {
    fetch('/api/ai/models')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsOllamaReady(data.is_available);
          if (Array.isArray(data.models) && data.models.length > 0) {
            setAvailableModels(data.models);
          }
        }
      })
      .catch((err) => console.log('Ollama status check:', err));
  }, []);

  const semanticVariants: SemanticVariant[] = [
    { title: 'Histórias reais de superação após falências e rejeições', category: 'Biografias', icon: 'auto_stories' },
    { title: 'Por que a disciplina e o erro moldam o sucesso a longo prazo', category: 'Mentalidade', icon: 'psychology' },
    { title: 'Discursos de formatura sobre não desistir dos seus sonhos', category: 'Palestras', icon: 'podium' },
    { title: 'Grandes inventores e atletas que superaram fracassos repetidos', category: 'Documentários', icon: 'movie' },
  ];

  const handleExecuteAISearch = (customQuery?: string) => {
    const q = customQuery || naturalPrompt;
    router.push(`/search?q=${encodeURIComponent(q)}&ai=1`);
  };

  return (
    <div className="flex flex-col w-full px-space-md lg:px-margin py-space-lg max-w-6xl mx-auto gap-space-lg">
      {/* Top Banner de IA Local */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-space-md rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-primary-neon/40 shadow-xl">
        <div className="flex items-center gap-space-sm">
          <div className="w-12 h-12 rounded-xl bg-primary-neon/20 flex items-center justify-center text-primary-neon border border-primary-neon/40 shadow-[0_0_16px_rgba(139,92,246,0.3)]">
            <span className="material-symbols-outlined text-[28px]">smart_toy</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-xl text-on-surface">
              Busca com Inteligência Artificial Local
            </h1>
            <p className="font-sans text-xs text-on-surface-variant">
              Expansão semântica de consultas e classificação vetorial executadas no seu próprio computador.
            </p>
          </div>
        </div>

        {/* Status do Modelo no Host */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-lowest border border-[#27272A] shrink-0">
          <span className={cn("h-2 w-2 rounded-full", isOllamaReady ? "bg-secondary-neon animate-pulse" : "bg-tertiary-neon")} />
          <div className="flex flex-col text-left">
            <span className="font-mono text-[10px] text-outline uppercase font-semibold">
              {isOllamaReady ? 'Ollama Host Ativo' : 'Ollama Offline (Modo Léxico)'}
            </span>
            <span className="font-mono text-xs text-secondary-neon font-semibold">Porta: 18434 / 11434</span>
          </div>
        </div>
      </div>

      {/* Card de Configuração do Prompt Semântico */}
      <div className="p-space-lg rounded-2xl bg-surface-container-low border border-[#27272A] shadow-md flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <span className="font-sans text-xs text-outline uppercase tracking-wider font-semibold">
            Prompt em Linguagem Natural
          </span>
          <span className="font-mono text-xs text-secondary-neon">Zero Alucinação de Vídeos</span>
        </div>

        <textarea
          rows={3}
          value={naturalPrompt}
          onChange={(e) => setNaturalPrompt(e.target.value)}
          placeholder="Descreva o que você está procurando com riqueza de contexto, temas ou emoções..."
          className="w-full p-space-md rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-sm text-on-surface focus:outline-none focus:border-primary-neon leading-relaxed resize-none"
        />

        {/* Controles de Modelo & Modo */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-space-xs border-t border-[#27272A]/50">
          {/* Seletor de Modelo Local Existente */}
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs text-outline font-medium">Modelo Ativo:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedModel('qwen2.5vl:7b')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-mono text-xs transition-all border',
                  selectedModel === 'qwen2.5vl:7b'
                    ? 'bg-secondary-neon/20 border-secondary-neon text-secondary-neon font-semibold'
                    : 'bg-surface-container-high border-transparent text-outline hover:text-on-surface'
                )}
              >
                qwen2.5vl:7b (5.9 GB)
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('gpt-oss:20b')}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-mono text-xs transition-all border',
                  selectedModel === 'gpt-oss:20b'
                    ? 'bg-primary-neon/20 border-primary-neon text-primary-neon font-semibold'
                    : 'bg-surface-container-high border-transparent text-outline hover:text-on-surface'
                )}
              >
                gpt-oss:20b (13.7 GB)
              </button>
            </div>
          </div>

          {/* Botão de Disparo */}
          <button
            type="button"
            onClick={() => handleExecuteAISearch()}
            className="inline-flex items-center gap-2 px-space-lg py-2.5 rounded-xl bg-gradient-to-r from-primary-neon via-primary-container to-secondary-neon text-white font-sans text-sm font-semibold shadow-lg hover:brightness-110 active:scale-[0.98] transition-all ml-auto"
          >
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>Interpretar & Buscar Vídeos</span>
          </button>
        </div>
      </div>

      {/* Seção de Variações Semânticas Geradas (Query Expansion) */}
      <div className="flex flex-col gap-space-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary-neon text-[20px]">hub</span>
            <h2 className="font-display font-semibold text-base text-on-surface">
              Variações Semânticas Mapeadas (Query Expansion)
            </h2>
          </div>
          <span className="font-sans text-xs text-outline">
            Clique em qualquer variante para varrer os provedores
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-sm">
          {semanticVariants.map((variant, index) => (
            <div
              key={index}
              onClick={() => handleExecuteAISearch(variant.title)}
              className="p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container border border-[#27272A] hover:border-secondary-neon/50 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-surface-container-high group-hover:bg-secondary-neon/20 group-hover:text-secondary-neon flex items-center justify-center text-outline transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[20px]">{variant.icon}</span>
                </div>
                <div className="min-w-0">
                  <span className="font-mono text-[10px] text-secondary-neon uppercase font-semibold block">
                    {variant.category}
                  </span>
                  <span className="font-sans text-xs text-on-surface group-hover:text-primary-neon transition-colors line-clamp-1">
                    "{variant.title}"
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[18px] text-outline group-hover:text-secondary-neon group-hover:translate-x-0.5 transition-all shrink-0 ml-2">
                arrow_forward
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Regra de Confiabilidade Ética */}
      <div className="p-4 rounded-xl bg-surface-container-lowest border border-[#27272A]/70 flex items-start gap-3 text-outline text-xs leading-relaxed">
        <span className="material-symbols-outlined text-primary-neon text-[20px] shrink-0 mt-0.5">verified_user</span>
        <div>
          <strong className="text-on-surface font-semibold">Garantia de Autenticidade:</strong> O VideoFinder utiliza o Ollama local exclusivamente para interpretar a sua intenção semântica, expandir sinônimos e pontuar a relevância das páginas. O sistema nunca inventa vídeos ou gera dados artificiais. Todos os resultados são conteúdos reais publicados por seus respectivos autores.
        </div>
      </div>
    </div>
  );
}

