'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
  isAi?: boolean;
}

const navItems: NavItem[] = [
  { name: 'Início', href: '/', icon: 'home' },
  { name: 'Resultados de Busca', href: '/search', icon: 'video_library' },
  { name: 'Busca com IA', href: '/ai-search', icon: 'auto_awesome', badge: 'v2.4', isAi: true },
  { name: 'Favoritos & Coleções', href: '/favorites', icon: 'bookmark' },
  { name: 'Histórico', href: '/history', icon: 'history' },
  { name: 'Dashboard & Métricas', href: '/dashboard', icon: 'insights' },
  { name: 'Configurações', href: '/settings', icon: 'settings' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-r border-[#27272A]/50">
      <div className="flex flex-col">
        {/* Logo & Marca */}
        <div className="h-16 px-space-md flex items-center gap-space-sm border-b border-[#27272A]/30">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-container via-primary-neon to-secondary-neon flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.5)]">
            <span className="material-symbols-outlined text-[20px] text-black font-bold">play_arrow</span>
          </div>
          <span className="font-display font-semibold text-lg text-on-surface tracking-tight">VideoFinder</span>
          <span className="px-1.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-mono text-[10px] font-semibold tracking-wide uppercase">
            AI
          </span>
        </div>

        {/* Menu de Navegação */}
        <div className="px-space-md py-space-sm">
          <div className="text-outline font-sans text-xs uppercase tracking-wider px-space-sm mb-space-xs font-medium">
            Navegação
          </div>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-space-sm px-space-sm py-2 rounded-lg transition-colors font-sans text-sm font-medium',
                    isActive
                      ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  )}
                >
                  <span
                    className={cn(
                      'material-symbols-outlined text-[20px]',
                      item.isAi && !isActive && 'text-secondary-neon'
                    )}
                  >
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 bg-primary/20 text-primary font-mono text-[10px] rounded">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Widget de Telemetria do Indexador */}
      <div className="p-space-md m-space-md rounded-xl bg-surface-container-low border border-[#27272A]/50 shadow-inner">
        <div className="flex items-center justify-between mb-space-xs">
          <span className="font-sans text-xs text-outline font-semibold tracking-wider">INDEXADOR</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-neon opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary-neon"></span>
          </span>
        </div>
        <p className="font-sans text-xs text-on-surface-variant mb-space-sm leading-relaxed">
          Sincronização em tempo real ativa com provedores abertos.
        </p>
        <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
          <div className="bg-secondary-neon h-1.5 rounded-full w-[92%] transition-all duration-500"></div>
        </div>
      </div>
    </aside>
  );
}

