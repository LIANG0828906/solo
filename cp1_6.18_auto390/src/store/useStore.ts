import { create } from 'zustand';

export type ClothingType = 'top' | 'bottom' | 'shoes' | 'accessory';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type Style = 'casual' | 'business' | 'sport' | 'vintage';

export interface ClothingItem {
  id: string;
  type: ClothingType;
  name: string;
  season: Season;
  color: string;
}

export interface Outfit {
  top: ClothingItem;
  bottom: ClothingItem;
  shoes: ClothingItem;
  accessory: ClothingItem;
  reason: string;
}

export interface Weather {
  city: string;
  temperature: number;
  icon: string;
  humidity: number;
}

export interface UserProfile {
  username: string;
  style: Style;
  height: number;
  weight: number;
}

interface StoreState {
  wardrobe: ClothingItem[];
  currentOutfit: Outfit | null;
  weather: Weather;
  user: UserProfile | null;
  favorites: string[];
  addItem: (item: Omit<ClothingItem, 'id'>) => void;
  removeItem: (id: string) => void;
  setOutfit: (outfit: Outfit | null) => void;
  setWeather: (weather: Weather) => void;
  setUser: (user: UserProfile) => void;
  toggleFavorite: (outfitKey: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  wardrobe: [
    { id: '1', type: 'top', name: '白色T恤', season: 'summer', color: '白色' },
    { id: '2', type: 'top', name: '灰色卫衣', season: 'autumn', color: '灰色' },
    { id: '3', type: 'top', name: '黑色西装', season: 'winter', color: '黑色' },
    { id: '4', type: 'bottom', name: '蓝色牛仔裤', season: 'spring', color: '蓝色' },
    { id: '5', type: 'bottom', name: '黑色西裤', season: 'autumn', color: '黑色' },
    { id: '6', type: 'shoes', name: '白色运动鞋', season: 'summer', color: '白色' },
    { id: '7', type: 'shoes', name: '黑色皮鞋', season: 'winter', color: '黑色' },
    { id: '8', type: 'accessory', name: '针织围巾', season: 'winter', color: '米色' },
    { id: '9', type: 'accessory', name: '棒球帽', season: 'summer', color: '藏青' },
    { id: '10', type: 'top', name: '条纹衬衫', season: 'spring', color: '蓝白' },
  ],
  currentOutfit: null,
  weather: {
    city: '北京',
    temperature: 22,
    icon: '☀️',
    humidity: 45,
  },
  user: null,
  favorites: [],
  addItem: (item) =>
    set((state) => ({
      wardrobe: [...state.wardrobe, { ...item, id: Date.now().toString() }],
    })),
  removeItem: (id) =>
    set((state) => ({
      wardrobe: state.wardrobe.filter((item) => item.id !== id),
    })),
  setOutfit: (outfit) => set({ currentOutfit: outfit }),
  setWeather: (weather) => set({ weather }),
  setUser: (user) => set({ user }),
  toggleFavorite: (outfitKey) =>
    set((state) => ({
      favorites: state.favorites.includes(outfitKey)
        ? state.favorites.filter((k) => k !== outfitKey)
        : [...state.favorites, outfitKey],
    })),
}));
