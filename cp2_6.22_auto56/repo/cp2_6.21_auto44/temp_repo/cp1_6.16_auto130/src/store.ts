import { create } from 'zustand';

export interface ArtParams {
  lineDensity: number;
  shapeComplexity: number;
  hueShift: number;
  opacity: number;
  bgColor: string;
  primaryColor: string;
}

export interface FavoriteItem {
  id: string;
  params: ArtParams;
  hash: string;
  thumbnailDataUrl: string;
  createdAt: number;
}

export interface ExportState {
  show: boolean;
}

interface AppState {
  params: ArtParams;
  favorites: FavoriteItem[];
  exportModal: ExportState;
  isFavorited: boolean;
  panelCollapsed: boolean;

  setParams: (params: Partial<ArtParams>) => void;
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: string) => void;
  setExportModal: (show: boolean) => void;
  setIsFavorited: (val: boolean) => void;
  togglePanel: () => void;
  loadFavorites: () => void;
}

function computeHash(params: ArtParams): string {
  const str = `${params.lineDensity}-${params.shapeComplexity}-${params.hueShift}-${params.opacity}-${params.bgColor}-${params.primaryColor}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(6, '0').slice(0, 6);
}

export { computeHash };

const DEFAULT_PARAMS: ArtParams = {
  lineDensity: 20,
  shapeComplexity: 5,
  hueShift: 0,
  opacity: 0.7,
  bgColor: '#FFFFFF',
  primaryColor: '#FF5733',
};

const useStore = create<AppState>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  favorites: [],
  exportModal: { show: false },
  isFavorited: false,
  panelCollapsed: false,

  setParams: (partial) => {
    set((state) => {
      const newParams = { ...state.params, ...partial };
      const currentHash = computeHash(state.params);
      const newHash = computeHash(newParams);
      return {
        params: newParams,
        isFavorited: newHash === currentHash ? state.isFavorited : false,
      };
    });
  },

  addFavorite: (item) => {
    set((state) => {
      const newFavorites = [item, ...state.favorites];
      try {
        localStorage.setItem('art-favorites', JSON.stringify(newFavorites));
      } catch (e) { /* ignore */ }
      return { favorites: newFavorites, isFavorited: true };
    });
  },

  removeFavorite: (id) => {
    set((state) => {
      const newFavorites = state.favorites.filter((f) => f.id !== id);
      try {
        localStorage.setItem('art-favorites', JSON.stringify(newFavorites));
      } catch (e) { /* ignore */ }
      const currentHash = computeHash(state.params);
      const stillFavorited = newFavorites.some((f) => f.hash === currentHash);
      return { favorites: newFavorites, isFavorited: stillFavorited };
    });
  },

  setExportModal: (show) => set({ exportModal: { show } }),

  setIsFavorited: (val) => set({ isFavorited: val }),

  togglePanel: () => set((state) => ({ panelCollapsed: !state.panelCollapsed })),

  loadFavorites: () => {
    try {
      const stored = localStorage.getItem('art-favorites');
      if (stored) {
        const favorites: FavoriteItem[] = JSON.parse(stored);
        set((state) => {
          const currentHash = computeHash(state.params);
          const isFavorited = favorites.some((f) => f.hash === currentHash);
          return { favorites, isFavorited };
        });
      }
    } catch (e) { /* ignore */ }
  },
}));

export default useStore;
