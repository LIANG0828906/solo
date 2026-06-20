
import { create } from 'zustand';
import { User, Walnut, ThemeColor } from '../types';

interface AppState {
  user: User | null;
  token: string | null;
  theme: ThemeColor;
  walnuts: Walnut[];
  favorites: Walnut[];
  selectedWalnut: Walnut | null;
  isDetailModalOpen: boolean;
  isFavoritesOpen: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setTheme: (theme: ThemeColor) => void;
  setWalnuts: (walnuts: Walnut[]) => void;
  setFavorites: (favorites: Walnut[]) => void;
  setSelectedWalnut: (walnut: Walnut | null) => void;
  setIsDetailModalOpen: (open: boolean) => void;
  setIsFavoritesOpen: (open: boolean) => void;
  
  logout: () => void;
  addFavorite: (walnut: Walnut) => void;
  removeFavorite: (walnutId: string) => void;
  updateUserBalance: (balance: number, transactionCount?: number) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  theme: 'bamboo',
  walnuts: [],
  favorites: [],
  selectedWalnut: null,
  isDetailModalOpen: false,
  isFavoritesOpen: false,

  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setTheme: (theme) => set({ theme }),
  setWalnuts: (walnuts) => set({ walnuts }),
  setFavorites: (favorites) => set({ favorites }),
  setSelectedWalnut: (walnut) => set({ selectedWalnut: walnut }),
  setIsDetailModalOpen: (open) => set({ isDetailModalOpen: open }),
  setIsFavoritesOpen: (open) => set({ isFavoritesOpen: open }),

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, favorites: [] });
  },

  addFavorite: (walnut) => {
    const { favorites } = get();
    if (!favorites.find(f => f.id === walnut.id)) {
      const newFavorites = [...favorites, walnut];
      set({ favorites: newFavorites });
      const user = get().user;
      if (user) {
        const newUser = { ...user, favorites: newFavorites.map(f => f.id) };
        set({ user: newUser });
      }
    }
  },

  removeFavorite: (walnutId) => {
    const { favorites } = get();
    const newFavorites = favorites.filter(f => f.id !== walnutId);
    set({ favorites: newFavorites });
    const user = get().user;
    if (user) {
      const newUser = { ...user, favorites: newFavorites.map(f => f.id) };
      set({ user: newUser });
    }
  },

  updateUserBalance: (balance, transactionCount) => {
    const { user } = get();
    if (user) {
      const newUser = { 
        ...user, 
        balance,
        transactionCount: transactionCount ?? user.transactionCount,
      };
      set({ user: newUser });
    }
  },
});
