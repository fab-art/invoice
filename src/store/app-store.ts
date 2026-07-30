import { create } from 'zustand';

export type AppView = 'login' | 'reception' | 'reports' | 'admin' | 'pharmacies';

interface AppState {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  user: {
    id?: string;
    email?: string;
    fullName?: string;
    role?: 'ADMIN' | 'RECEPTIONIST';
  } | null;
  setUser: (user: AppState['user']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'login',
  setCurrentView: (view) => set({ currentView: view }),
  user: null,
  setUser: (user) => set({ user }),
}));
