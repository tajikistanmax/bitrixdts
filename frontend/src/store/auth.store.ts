import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthTokens } from '../types/auth';

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setAuth: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => {
        // Единственный источник правды — Zustand persist.
        // Axios-интерцептор читает токен из стора, а не напрямую из localStorage.
        set({ user, tokens, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, tokens: null, isAuthenticated: false });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      // Персистируем user и tokens; isAuthenticated восстанавливается через onRehydrateStorage
      partialize: (state) => ({ user: state.user, tokens: state.tokens }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // После восстановления из localStorage выставляем isAuthenticated
          state.isAuthenticated = !!(state.tokens?.accessToken);
        }
      },
    }
  )
);
