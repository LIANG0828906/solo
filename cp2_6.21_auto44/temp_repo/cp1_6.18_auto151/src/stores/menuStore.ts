import { create } from 'zustand';
import { v4 as generateId } from 'uuid';
import { Ingredient } from '@/data/ingredients';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export type TagType = 'recommended' | 'limited' | 'popular';

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Drink {
  id: string;
  name: string;
  base: Ingredient | null;
  syrups: Ingredient[];
  foamLevel: number;
  garnishes: Ingredient[];
  price: number;
  tags: TagType[];
  description: string;
  steps: string[];
  reviews: Review[];
}

export interface SeasonMenu {
  season: Season;
  drinks: Drink[];
}

interface MenuState {
  seasonMenus: SeasonMenu[];
  currentSeason: Season;
  editingDrink: Drink | null;
  isPreviewOpen: boolean;

  setCurrentSeason: (season: Season) => void;
  setEditingDrink: (drink: Drink | null) => void;
  addDrink: (drink: Drink) => void;
  updateDrink: (drink: Drink) => void;
  removeDrink: (drinkId: string) => void;
  reorderDrinks: (season: Season, fromIndex: number, toIndex: number) => void;
  setPreviewOpen: (open: boolean) => void;

  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
  exportData: () => string;
  importData: (json: string) => { success: boolean; errors: string[] };
  createNewDrink: () => Drink;
}

const STORAGE_KEY = 'cafe-menu-data';

const MAX_DRINKS_PER_SEASON = 8;

const defaultSeasonMenus: SeasonMenu[] = [
  { season: 'spring', drinks: [] },
  { season: 'summer', drinks: [] },
  { season: 'autumn', drinks: [] },
  { season: 'winter', drinks: [] },
];

export const useMenuStore = create<MenuState>()((set, get) => ({
  seasonMenus: defaultSeasonMenus,
  currentSeason: 'spring',
  editingDrink: null,
  isPreviewOpen: false,

  setCurrentSeason: (season) => set({ currentSeason: season }),

  setEditingDrink: (drink) => set({ editingDrink: drink }),

  addDrink: (drink) => {
    const { seasonMenus, currentSeason } = get();
    const menu = seasonMenus.find((m) => m.season === currentSeason);
    if (!menu) return;
    if (menu.drinks.length >= MAX_DRINKS_PER_SEASON) return;
    set({
      seasonMenus: seasonMenus.map((m) =>
        m.season === currentSeason ? { ...m, drinks: [...m.drinks, drink] } : m
      ),
    });
  },

  updateDrink: (drink) => {
    const { seasonMenus } = get();
    set({
      seasonMenus: seasonMenus.map((m) => ({
        ...m,
        drinks: m.drinks.map((d) => (d.id === drink.id ? drink : d)),
      })),
    });
  },

  removeDrink: (drinkId) => {
    const { seasonMenus } = get();
    set({
      seasonMenus: seasonMenus.map((m) => ({
        ...m,
        drinks: m.drinks.filter((d) => d.id !== drinkId),
      })),
    });
  },

  reorderDrinks: (season, fromIndex, toIndex) => {
    const { seasonMenus } = get();
    set({
      seasonMenus: seasonMenus.map((m) => {
        if (m.season !== season) return m;
        const drinks = [...m.drinks];
        const [moved] = drinks.splice(fromIndex, 1);
        drinks.splice(toIndex, 0, moved);
        return { ...m, drinks };
      }),
    });
  },

  setPreviewOpen: (open) => set({ isPreviewOpen: open }),

  saveToLocalStorage: () => {
    const { seasonMenus } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seasonMenus));
    } catch {
      // storage unavailable
    }
  },

  loadFromLocalStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SeasonMenu[];
      if (Array.isArray(parsed) && parsed.length === 4) {
        set({ seasonMenus: parsed });
      }
    } catch {
      // keep defaults
    }
  },

  exportData: () => {
    const { seasonMenus } = get();
    return JSON.stringify(seasonMenus, null, 2);
  },

  importData: (json) => {
    try {
      const parsed = JSON.parse(json) as SeasonMenu[];
      if (!Array.isArray(parsed)) {
        return { success: false, errors: ['Invalid data: expected an array of season menus'] };
      }
      const errors: string[] = [];
      for (const menu of parsed) {
        for (const drink of menu.drinks) {
          if (!drink.name || drink.name.trim() === '') {
            errors.push(`missing field name in drink ${drink.id || 'unknown'}`);
          }
          if (drink.base === null || drink.base === undefined) {
            errors.push(`missing field base in drink ${drink.name || drink.id || 'unknown'}`);
          }
          if (drink.syrups === undefined) {
            errors.push(`missing field syrups in drink ${drink.name || drink.id || 'unknown'}`);
          }
          if (drink.foamLevel === undefined) {
            errors.push(`missing field foamLevel in drink ${drink.name || drink.id || 'unknown'}`);
          }
        }
      }
      if (errors.length > 0) {
        return { success: false, errors };
      }
      set({ seasonMenus: parsed });
      get().saveToLocalStorage();
      return { success: true, errors: [] };
    } catch {
      return { success: false, errors: ['Invalid JSON format'] };
    }
  },

  createNewDrink: () => ({
    id: generateId(),
    name: '',
    base: null,
    syrups: [],
    foamLevel: 0,
    garnishes: [],
    price: 0,
    tags: [],
    description: '',
    steps: [],
    reviews: [],
  }),
}));

useMenuStore.getState().loadFromLocalStorage();
