'use client';

import React from 'react';

export function Header() {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl z-40 px-space-md flex items-center justify-between border-b border-[#27272A]/50 shadow-[0_1px_8px_rgba(0,0,0,0.3)]">
      {/* Busca Rápida de Cabeçalho */}
      <div className="flex items-center gap-space-md flex-1 max-w-xl">
        <div className="w-full flex items-center gap-space-sm bg-surface-container-low px-space-md py-2 rounded-xl text-on-surface-variant border border-[#27272A]/40 shadow-inner">
          <span className="material-symbols-outlined text-[20px] text-primary">search</span>
          <span className="font-sans text-sm text-outline flex-1 truncate">
            Buscar por legenda, transcrição, autor ou URL...
          </span>
          <kbd className="font-mono text-xs bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded shadow-sm border border-[#27272A]">
            ⌘K
          </kbd>
        </div>
        <div className="hidden xl:flex items-center gap-2 px-space-sm py-1.5 rounded-full bg-surface-container-low border border-[#27272A]/40">
          <span className="h-2 w-2 rounded-full bg-secondary-neon animate-pulse"></span>
          <span className="font-sans text-xs text-on-surface-variant font-medium">Fontes Conectadas</span>
        </div>
      </div>

      {/* Ações do Usuário & Perfil */}
      <div className="flex items-center gap-space-md">
        <div className="relative flex items-center">
          <button
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            type="button"
            title="Notificações"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-neon shadow-[0_0_6px_#F43F5E]"></span>
        </div>

        <button
          className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
          type="button"
          title="Modo Escuro Ativo"
        >
          <span className="material-symbols-outlined text-[22px]">dark_mode</span>
        </button>

        <div className="h-6 w-[1px] bg-surface-variant"></div>

        {/* Perfil */}
        <div className="flex items-center gap-space-sm pl-space-xs cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center border border-primary/40 text-on-surface font-sans font-semibold text-xs shadow-sm">
            VF
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-sans text-xs text-on-surface font-semibold group-hover:text-primary transition-colors">
              Explorador
            </span>
            <span className="font-sans text-[11px] text-secondary font-medium">Plano Open-Source</span>
          </div>
        </div>
      </div>
    </header>
  );
}

