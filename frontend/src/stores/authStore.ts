import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_admin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isModalOpen: boolean;
  modalTab: 'login' | 'register';
  error: string | null;
  setModalOpen: (open: boolean, tab?: 'login' | 'register') => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: 1,
    name: 'Criador VideoFinder',
    email: 'dev@videofinder.local',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    is_admin: true,
  },
  token: null,
  isLoading: false,
  isModalOpen: false,
  modalTab: 'login',
  error: null,

  setModalOpen: (open, tab = 'login') => {
    set({ isModalOpen: open, modalTab: tab, error: null });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('videofinder_token', data.token);
        }
        set({ user: data.user, token: data.token, isModalOpen: false, isLoading: false });
        return true;
      } else {
        set({ error: data.message || 'Falha ao autenticar.', isLoading: false });
        return false;
      }
    } catch {
      set({ error: 'Erro de conexão com o servidor.', isLoading: false });
      return false;
    }
  },

  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, email, password, password_confirmation: password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('videofinder_token', data.token);
        }
        set({ user: data.user, token: data.token, isModalOpen: false, isLoading: false });
        return true;
      } else {
        set({ error: data.message || 'Falha no cadastro.', isLoading: false });
        return false;
      }
    } catch {
      set({ error: 'Erro de conexão com o servidor.', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    const token = get().token;
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('videofinder_token');
    }
    set({
      user: {
        id: 1,
        name: 'Visitante Anônimo',
        email: 'anon@videofinder.local',
        is_admin: false,
      },
      token: null,
    });
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('videofinder_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, token });
      } else {
        localStorage.removeItem('videofinder_token');
        set({ token: null });
      }
    } catch {}
  },
}));

