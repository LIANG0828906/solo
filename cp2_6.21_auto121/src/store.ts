import { create } from 'zustand';

interface AppState {
  currentDesignId: string | null;
  isLoggedIn: boolean;
  loadingStates: { [key: string]: boolean };
  isFullscreen: boolean;
  setCurrentDesignId: (id: string | null) => void;
  setLoggedIn: (value: boolean) => void;
  setLoading: (key: string, value: boolean) => void;
  toggleFullscreen: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentDesignId: null,
  isLoggedIn: false,
  loadingStates: {},
  isFullscreen: false,
  setCurrentDesignId: (id) => set({ currentDesignId: id }),
  setLoggedIn: (value) => set({ isLoggedIn: value }),
  setLoading: (key, value) =>
    set((state) => ({
      loadingStates: { ...state.loadingStates, [key]: value },
    })),
  toggleFullscreen: () =>
    set((state) => ({ isFullscreen: !state.isFullscreen })),
}));
