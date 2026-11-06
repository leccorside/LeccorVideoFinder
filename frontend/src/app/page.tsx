'use client';

import React from 'react';
import { Omnibar } from '@/components/search/Omnibar';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Brilhos de Luz Ambiente (Orbs de Fundo) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-primary-neon/15 via-secondary-neon/10 to-transparent blur-3xl pointer-events-none rounded-full"></div>
      <div className="absolute top-48 right-12 w-96 h-96 bg-secondary-neon/5 blur-[120px] pointer-events-none rounded-full"></div>

      {/* Hero Section & Omnibar Center */}
      <section className="relative z-10 px-margin pt-space-xl pb-space-lg max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-space-md py-1.5 rounded-full bg-surface-container-high/90 text-on-surface shadow-sm mb-space-lg backdrop-blur-md border border-[#27272A]/50">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-neon opacity-80"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-neon"></span>
          </span>
          <span className="font-mono text-[11px] text-secondary-neon tracking-wide uppercase font-semibold">
            ⚡ OmniVideo Engine v2.4
          </span>
          <span className="text-outline text-xs">/</span>
          <span className="font-sans text-xs text-on-surface-variant">
            Indexação & Busca Semântica em Tempo Real
          </span>
        </div>

        {/* Headline Principal */}
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight max-w-4xl text-on-surface mb-space-sm leading-tight">
          Encontre qualquer vídeo.{' '}
          <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-primary-neon via-primary-container to-secondary-neon bg-clip-text text-transparent">
            Em qualquer plataforma.
          </span>
        </h1>

        <p className="font-sans text-base text-on-surface-variant max-w-2xl mb-space-xl leading-relaxed">
          Pesquise por palavras exatas, contexto falado em transcrições ou temas conceituais. Uma única interface com varredura síncrona em múltiplas redes da web aberta.
        </p>

        {/* Omnibar Master */}
        <Omnibar />

        {/* Cards de Métricas e Conectores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-12 text-left">
          <div className="p-4 rounded-xl bg-surface-container-low border border-[#27272A]/50">
            <span className="text-outline font-mono text-[11px] uppercase block mb-1">Mecanismo</span>
            <span className="font-display font-semibold text-lg text-on-surface block">Universal</span>
            <span className="text-xs text-secondary-neon font-sans">Multi-provedor ativo</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-[#27272A]/50">
            <span className="text-outline font-mono text-[11px] uppercase block mb-1">IA Local</span>
            <span className="font-display font-semibold text-lg text-on-surface block">Ollama</span>
            <span className="text-xs text-primary font-sans">Sem custos de API</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-[#27272A]/50">
            <span className="text-outline font-mono text-[11px] uppercase block mb-1">Precisão</span>
            <span className="font-display font-semibold text-lg text-on-surface block">Timestamps</span>
            <span className="text-xs text-secondary-neon font-sans">Falas comprovadas</span>
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low border border-[#27272A]/50">
            <span className="text-outline font-mono text-[11px] uppercase block mb-1">Privacidade</span>
            <span className="font-display font-semibold text-lg text-on-surface block">100% Local</span>
            <span className="text-xs text-on-surface-variant font-sans">Zero telemetria externa</span>
          </div>
        </div>
      </section>
    </div>
  );
}

