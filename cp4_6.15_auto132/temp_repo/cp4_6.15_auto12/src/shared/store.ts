import { create } from 'zustand';
import type { Ingredient, Recipe, AppPage, RecipeDifficulty } from './types';
import { generateId } from './utils';
import { RECIPES } from './recipeData';

interface AppState {
  currentPage: AppPage;
  ingredients: Ingredient[];
  shoppingList: string[];
  experiencePoints: number;
  cookingRecipe: Recipe | null;
  difficultyPreference: RecipeDifficulty;
  recipes: Recipe[];

  setCurrentPage: (page: AppPage) => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  updateIngredient: (id: string, ingredient: Partial<Omit<Ingredient, 'id'>>) => void;
  deleteIngredient: (id: string) => void;
  addToShoppingList: (item: string) => void;
  removeFromShoppingList: (item: string) => void;
  addExperience: (points: number) => void;
  setCookingRecipe: (recipe: Recipe | null) => void;
  setDifficultyPreference: (pref: RecipeDifficulty) => void;
  loadFromStorage: () => void;
}

const STORAGE_KEYS = {
  ingredients: 'kitchen-story-ingredients',
  shoppingList: 'kitchen-story-shopping-list',
  experiencePoints: 'kitchen-story-experience',
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'inventory',
  ingredients: [],
  shoppingList: [],
  experiencePoints: 0,
  cookingRecipe: null,
  difficultyPreference: 'easy',
  recipes: RECIPES,

  setCurrentPage: (page) => set({ currentPage: page }),

  addIngredient: (ingredient) => {
    const newIngredient: Ingredient = { ...ingredient, id: generateId() };
    const updated = [...get().ingredients, newIngredient];
    localStorage.setItem(STORAGE_KEYS.ingredients, JSON.stringify(updated));
    set({ ingredients: updated });
  },

  updateIngredient: (id, partial) => {
    const updated = get().ingredients.map((ing) =>
      ing.id === id ? { ...ing, ...partial } : ing
    );
    localStorage.setItem(STORAGE_KEYS.ingredients, JSON.stringify(updated));
    set({ ingredients: updated });
  },

  deleteIngredient: (id) => {
    const updated = get().ingredients.filter((ing) => ing.id !== id);
    localStorage.setItem(STORAGE_KEYS.ingredients, JSON.stringify(updated));
    set({ ingredients: updated });
  },

  addToShoppingList: (item) => {
    const list = get().shoppingList;
    if (!list.includes(item)) {
      const updated = [...list, item];
      localStorage.setItem(STORAGE_KEYS.shoppingList, JSON.stringify(updated));
      set({ shoppingList: updated });
    }
  },

  removeFromShoppingList: (item) => {
    const updated = get().shoppingList.filter((i) => i !== item);
    localStorage.setItem(STORAGE_KEYS.shoppingList, JSON.stringify(updated));
    set({ shoppingList: updated });
  },

  addExperience: (points) => {
    const updated = get().experiencePoints + points;
    localStorage.setItem(STORAGE_KEYS.experiencePoints, String(updated));
    set({ experiencePoints: updated });
  },

  setCookingRecipe: (recipe) => set({ cookingRecipe: recipe }),

  setDifficultyPreference: (pref) => set({ difficultyPreference: pref }),

  loadFromStorage: () => {
    const ingredients = loadJSON<Ingredient[]>(STORAGE_KEYS.ingredients, []);
    const shoppingList = loadJSON<string[]>(STORAGE_KEYS.shoppingList, []);
    const experiencePoints = loadJSON<number>(STORAGE_KEYS.experiencePoints, 0);
    set({ ingredients, shoppingList, experiencePoints });
  },
}));
