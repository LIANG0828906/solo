import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Potion, ExperimentRecord, Recipe, PotionQuality } from '../brewing/types';

interface PotionState {
  potions: Potion[];
  records: ExperimentRecord[];
  recipes: Recipe[];
  addPotion: (potion: Omit<Potion, 'id' | 'createdAt'>) => void;
  removePotion: (id: string) => void;
  addRecord: (record: Omit<ExperimentRecord, 'id' | 'timestamp'>) => void;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'starred'>) => void;
  toggleRecipeStar: (id: string) => void;
  deleteRecipe: (id: string) => void;
}

export const usePotionStore = create<PotionState>((set) => ({
  potions: [],
  records: [],
  recipes: [],

  addPotion: (potion) =>
    set((state) => ({
      potions: [
        {
          ...potion,
          id: uuidv4(),
          createdAt: Date.now(),
        },
        ...state.potions,
      ],
    })),

  removePotion: (id) =>
    set((state) => ({
      potions: state.potions.filter((p) => p.id !== id),
    })),

  addRecord: (record) =>
    set((state) => ({
      records: [
        {
          ...record,
          id: uuidv4(),
          timestamp: Date.now(),
        },
        ...state.records,
      ],
    })),

  addRecipe: (recipe) =>
    set((state) => ({
      recipes: [
        {
          ...recipe,
          id: uuidv4(),
          createdAt: Date.now(),
          starred: false,
        },
        ...state.recipes,
      ],
    })),

  toggleRecipeStar: (id) =>
    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === id ? { ...r, starred: !r.starred } : r
      ),
    })),

  deleteRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    })),
}));
