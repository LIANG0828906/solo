import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { foods, type Food } from '../data/foods';
import {
  scaleNutrients,
  calculateTotalNutrients,
  formatDate,
  getLast7Days,
  type MealItem,
  type DailyRecord,
} from '../utils/nutrition';

const STORAGE_KEY = 'nutrition-app-records';

interface AppState {
  searchQuery: string;
  searchResults: Food[];
  selectedFood: Food | null;

  currentMeal: MealItem[];

  selectedDate: string;
  records: Record<string, DailyRecord>;

  showTrend: boolean;

  setSearchQuery: (query: string) => void;
  selectFood: (food: Food | null) => void;
  addFoodToMeal: (food: Food) => void;
  removeMealItem: (itemId: string) => void;
  updateMealItemAmount: (itemId: string, amount: number) => void;
  reorderMealItems: (fromIndex: number, toIndex: number) => void;

  setSelectedDate: (date: string) => void;
  saveCurrentMeal: () => void;
  loadMealForDate: (date: string) => void;

  toggleTrend: () => void;
  setShowTrend: (show: boolean) => void;

  getLast7DaysData: () => Array<{ date: string; calories: number }>;
}

function loadRecordsFromStorage(): Record<string, DailyRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') return parsed;
    return {};
  } catch {
    return {};
  }
}

function saveRecordsToStorage(records: Record<string, DailyRecord>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}

function searchFoods(query: string): Food[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];

  const exact: Food[] = [];
  const includes: Food[] = [];
  const category: Food[] = [];

  for (const food of foods) {
    const name = food.name.toLowerCase();
    const cat = food.category.toLowerCase();
    if (name === trimmed) {
      exact.push(food);
    } else if (name.includes(trimmed)) {
      includes.push(food);
    } else if (cat.includes(trimmed)) {
      category.push(food);
    }
  }

  return [...exact, ...includes, ...category].slice(0, 10);
}

export const useAppStore = create<AppState>((set, get) => {
  const initialRecords = loadRecordsFromStorage();
  const initialDate = formatDate(new Date());
  const initialMeal = initialRecords[initialDate]?.items ?? [];

  return {
    searchQuery: '',
    searchResults: [],
    selectedFood: null,

    currentMeal: initialMeal,

    selectedDate: initialDate,
    records: initialRecords,

    showTrend: false,

    setSearchQuery: (query: string) => {
      set({
        searchQuery: query,
        searchResults: searchFoods(query),
      });
    },

    selectFood: (food: Food | null) => {
      set({ selectedFood: food });
    },

    addFoodToMeal: (food: Food) => {
      const newItem: MealItem = {
        id: uuidv4(),
        foodId: food.id,
        foodName: food.name,
        amount: 100,
        nutrients: scaleNutrients(food, 100),
      };
      const newMeal = [...get().currentMeal, newItem];
      set({ currentMeal: newMeal });
      get().saveCurrentMeal();
    },

    removeMealItem: (itemId: string) => {
      const newMeal = get().currentMeal.filter((i) => i.id !== itemId);
      set({ currentMeal: newMeal });
      get().saveCurrentMeal();
    },

    updateMealItemAmount: (itemId: string, amount: number) => {
      const safeAmount = Math.max(0, Math.min(10000, amount));
      const meal = get().currentMeal;
      const idx = meal.findIndex((i) => i.id === itemId);
      if (idx === -1) return;

      const food = foods.find((f) => f.id === meal[idx].foodId);
      if (!food) return;

      const newMeal = [...meal];
      newMeal[idx] = {
        ...meal[idx],
        amount: safeAmount,
        nutrients: scaleNutrients(food, safeAmount),
      };
      set({ currentMeal: newMeal });
      get().saveCurrentMeal();
    },

    reorderMealItems: (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const meal = [...get().currentMeal];
      const [removed] = meal.splice(fromIndex, 1);
      meal.splice(toIndex, 0, removed);
      set({ currentMeal: meal });
      get().saveCurrentMeal();
    },

    setSelectedDate: (date: string) => {
      get().saveCurrentMeal();
      set({ selectedDate: date });
      get().loadMealForDate(date);
    },

    saveCurrentMeal: () => {
      const state = get();
      const records = { ...state.records };
      records[state.selectedDate] = {
        date: state.selectedDate,
        items: state.currentMeal,
      };
      set({ records });
      saveRecordsToStorage(records);
    },

    loadMealForDate: (date: string) => {
      const state = get();
      const record = state.records[date];
      set({ currentMeal: record?.items ?? [] });
    },

    toggleTrend: () => {
      set({ showTrend: !get().showTrend });
    },

    setShowTrend: (show: boolean) => {
      set({ showTrend: show });
    },

    getLast7DaysData: () => {
      const state = get();
      const days = getLast7Days();
      return days.map((date) => {
        const record = state.records[date];
        const nutrients = calculateTotalNutrients(record?.items ?? []);
        return { date, calories: nutrients.calories };
      });
    },
  };
});
