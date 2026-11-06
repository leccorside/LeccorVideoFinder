'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Omnibar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isAiEnabled, setIsAiEnabled] = useState(true);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    const params = new URLSearchParams({
      q: query.trim(),
      ai: isAiEnabled ? '1' : '0',
    });
    router.push(`/search?${params.toString()}`);
  };

  const setSuggestedQuery = (text: string) => {
    setQuery(text);
    const params = new URLSearchParams({
      q: text,
      ai: isAiEnabled ? '1' : '0',
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-3xl relative flex flex-col items-center">
      {/* Brilho atmosférico sutil atrás do Omnibar */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary-neon/25 via-secondary-neon/20 to-primary-container/25 blur-lg opacity-75 group-hover:opacity-100 transition duration-500 pointer-events-none"></div>

      {/* Container Principal do Omnibar */}
      <form
        onSubmit={handleSearch}
        className="relative w-full bg-surface-container-lowest/95 backdrop-blur-2xl rounded-2xl shadow-2xl p-space-sm flex flex-col gap-space-xs border border-[#27272A]"
      >
        <div className="flex items-center gap-space-sm px-space-sm py-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface-container-high text-secondary-neon shadow-sm">
            <span className="material-symbols-outlined text-[24px]">search</span>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um trecho de fala, legenda, assunto ou link do vídeo..."
            className="w-full bg-transparent text-on-surface font-sans text-base placeholder:text-outline focus:outline-none"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-2 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
              title="Limpar pesquisa"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 bg-surface-container px-2 py-1 rounded-md text-outline font-mono text-[11px] border border-[#27272A]/50">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>

        {/* Barra de Ações & Alternadores */}
        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-space-xs px-space-xs border-t border-[#27272A]/40">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiEnabled(!isAiEnabled)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs transition-all border',
                isAiEnabled
                  ? 'bg-surface-container-high text-on-surface border-primary-neon/40 shadow-[0_0_12px_rgba(139,92,246,0.15)]'
                  : 'bg-surface-container-low text-outline border-transparent hover:bg-surface-container-high'
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined text-[16px]',
                  isAiEnabled ? 'text-secondary-neon' : 'text-outline'
                )}
              >
                auto_awesome
              </span>
              <span className="font-medium">Busca IA Semântica</span>
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded font-mono text-[10px] uppercase font-semibold',
                  isAiEnabled
                    ? 'bg-secondary-container/20 text-secondary-neon'
                    : 'bg-surface-container text-outline'
                )}
              >
                {isAiEnabled ? 'Ativo' : 'Off'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="hidden md:inline font-mono text-[11px] text-outline">
              Latência est.: ~0.3s
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-space-lg py-2.5 rounded-xl bg-gradient-to-r from-primary-neon via-primary-container to-secondary-neon text-white font-sans text-sm font-semibold shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Buscar Vídeos</span>
            </button>
          </div>
        </div>
      </form>

      {/* Sugestões Rápidas de Busca */}
      <div className="w-full mt-3 bg-surface-container-lowest/90 backdrop-blur-xl rounded-xl shadow-2xl p-space-xs border border-[#27272A]/40">
        <div className="px-3 py-1.5 text-outline font-sans text-[11px] uppercase tracking-wider flex items-center justify-between font-semibold">
          <span>Sugestões Rápidas & Exemplos</span>
          <span className="text-secondary-neon font-mono text-[10px]">FONTES ABERTAS</span>
        </div>
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setSuggestedQuery('Nunca desista dos seus sonhos')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-space-sm min-w-0">
              <span className="material-symbols-outlined text-[18px] text-secondary-neon">subtitles</span>
              <span className="font-sans text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                "Nunca desista dos seus sonhos"
              </span>
            </div>
            <span className="font-mono text-xs text-outline shrink-0 ml-2">Exemplo do PROMPT.md</span>
          </button>

          <button
            type="button"
            onClick={() => setSuggestedQuery('Disciplina é mais importante que motivação')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-container-high flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-space-sm min-w-0">
              <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
              <span className="font-sans text-sm text-on-surface group-hover:text-primary transition-colors truncate">
                "Disciplina é mais importante que motivação"
              </span>
            </div>
            <span className="font-mono text-xs text-outline shrink-0 ml-2">Fala transcrita</span>
          </button>
        </div>
      </div>
    </div>
  );
}

