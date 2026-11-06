'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

export function AuthModal() {
  const { isModalOpen, modalTab, setModalOpen, login, register, isLoading, error } = useAuthStore();
  const [tab, setTab] = useState<'login' | 'register'>(modalTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'login') {
      await login(email, password);
    } else {
      await register(name, email, password);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md p-6 rounded-2xl bg-surface-container-low border border-[#27272A] shadow-2xl flex flex-col gap-5 relative">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={() => setModalOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Cabeçalho */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-container to-secondary-neon flex items-center justify-center">
              <span className="material-symbols-outlined text-black text-[16px] font-bold">account_circle</span>
            </div>
            <span className="font-display font-bold text-lg text-on-surface">Conta VideoFinder</span>
          </div>
          <p className="font-sans text-xs text-outline">
            Salve vídeos favoritos em coleções personalizadas e sincronize seu histórico de pesquisas.
          </p>
        </div>

        {/* Tabs: Entrar vs Criar Conta */}
        <div className="flex rounded-xl bg-surface-container-lowest p-1 border border-[#27272A]">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={cn(
              'flex-1 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all',
              tab === 'login'
                ? 'bg-primary-neon text-surface shadow-sm'
                : 'text-outline hover:text-on-surface'
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={cn(
              'flex-1 py-1.5 rounded-lg font-sans text-xs font-semibold transition-all',
              tab === 'register'
                ? 'bg-primary-neon text-surface shadow-sm'
                : 'text-outline hover:text-on-surface'
            )}
          >
            Criar Conta
          </button>
        </div>

        {/* Alerta de Erro */}
        {error && (
          <div className="p-3 rounded-xl bg-error/15 border border-error/30 text-error text-xs font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {tab === 'register' && (
            <div className="flex flex-col gap-1">
              <label className="font-sans text-xs text-outline font-medium">Nome Completo</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Lucas Mendes"
                className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="font-sans text-xs text-outline font-medium">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-sans text-xs text-outline font-medium">Senha</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="p-2.5 rounded-xl bg-surface-container-lowest border border-[#27272A] font-sans text-xs text-on-surface focus:outline-none focus:border-primary-neon"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 rounded-xl bg-primary-neon text-surface font-sans text-xs font-semibold hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 shadow-md shadow-primary-neon/20 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-surface/20 border-t-surface animate-spin" />
            ) : (
              <span>{tab === 'login' ? 'Acessar Plataforma' : 'Criar Minha Conta'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

