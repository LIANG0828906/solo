import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Spot, RouteItem, calcTotalDuration, calcCalories, getThemeColor } from './data';

interface RouteState {
  items: RouteItem[];
  addItem: (spot: Spot) => void;
  removeItem: (uid: string) => void;
  reorderItems: (fromIndex: number, toIndex: number) => void;
  totalDuration: () => number;
  totalCalories: () => number;
  themeColor: () => string;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'virtual-tour-route';

export const useRouteStore = create<RouteState>((set, get) => ({
  items: [],
  addItem: (spot: Spot) => {
    const state = get();
    if (state.items.length >= 8) return;
    const newItem: RouteItem = { spot, uid: uuidv4() };
    set({ items: [...state.items, newItem] });
    get().saveToStorage();
  },
  removeItem: (uid: string) => {
    set({ items: get().items.filter((i) => i.uid !== uid) });
    get().saveToStorage();
  },
  reorderItems: (fromIndex: number, toIndex: number) => {
    const items = [...get().items];
    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    set({ items });
    get().saveToStorage();
  },
  totalDuration: () => calcTotalDuration(get().items),
  totalCalories: () => calcCalories(get().items),
  themeColor: () => getThemeColor(get().items),
  saveToStorage: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(get().items));
    } catch {}
  },
  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const items = JSON.parse(raw) as RouteItem[];
        set({ items });
      }
    } catch {}
  },
}));
