import { create } from 'zustand';
import { Recipe, MixStep, ScoreResult, BottleData } from '../types';

interface CartStore {
  currentRecipe: Recipe | null;
  selectedIngredients: string[];
  mixSteps: MixStep[];
  startTime: number | null;
  isComplete: boolean;
  scoreResult: ScoreResult | null;
  completedIngredients: Set<string>;
  setCurrentRecipe: (recipe: Recipe) => void;
  addIngredient: (bottle: BottleData) => void;
  addMixStep: (ingredientId: string, ingredientName: string, type: 'base' | 'mixer' | 'garnish') => void;
  markIngredientComplete: (ingredientId: string) => void;
  setStartTime: (time: number) => void;
  setIsComplete: (complete: boolean) => void;
  setScoreResult: (result: ScoreResult | null) => void;
  clearSteps: () => void;
  resetAll: () => void;
}

export const useCartStore = create<CartStore>((set) => ({
  currentRecipe: null,
  selectedIngredients: [],
  mixSteps: [],
  startTime: null,
  isComplete: false,
  scoreResult: null,
  completedIngredients: new Set(),
  
  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),
  
  addIngredient: (bottle) => set((state) => ({
    selectedIngredients: [...state.selectedIngredients, bottle.id]
  })),
  
  addMixStep: (ingredientId, ingredientName, type) => set((state) => ({
    mixSteps: [
      ...state.mixSteps,
      {
        ingredientId,
        ingredientName,
        timestamp: Date.now(),
        order: state.mixSteps.length + 1,
        type
      }
    ]
  })),
  
  markIngredientComplete: (ingredientId) => set((state) => {
    const newCompleted = new Set(state.completedIngredients);
    newCompleted.add(ingredientId);
    return { completedIngredients: newCompleted };
  }),
  
  setStartTime: (time) => set({ startTime: time }),
  
  setIsComplete: (complete) => set({ isComplete: complete }),
  
  setScoreResult: (result) => set({ scoreResult: result }),
  
  clearSteps: () => set({
    selectedIngredients: [],
    mixSteps: [],
    completedIngredients: new Set(),
    isComplete: false,
    scoreResult: null
  }),
  
  resetAll: () => set({
    currentRecipe: null,
    selectedIngredients: [],
    mixSteps: [],
    startTime: null,
    isComplete: false,
    scoreResult: null,
    completedIngredients: new Set()
  })
}));
