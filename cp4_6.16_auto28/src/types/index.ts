export interface Palette {
  id: string;
  title: string;
  colors: string[];
  createdAt: number;
  favoriteCount: number;
}

export interface PaletteStore {
  currentColors: string[];
  favorites: string[];
  sortBy: 'popular' | 'latest';
  setCurrentColors: (colors: string[]) => void;
  setColor: (index: number, color: string) => void;
  toggleFavorite: (id: string) => Promise<void>;
  setSortBy: (sort: 'popular' | 'latest') => void;
  loadFavorites: () => Promise<void>;
}
