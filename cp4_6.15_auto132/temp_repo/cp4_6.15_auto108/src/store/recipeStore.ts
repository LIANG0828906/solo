import { create } from 'zustand';
import type { Recipe } from '../types';
import { mockRecipes } from '../data/mockRecipes';

interface RecipeStore {
  selectedIngredients: string[];
  recipes: Recipe[];
  activeRecipe: Recipe | null;
  showDetail: boolean;
  currentServings: number;
  completedSteps: string[];
  hasSearched: boolean;
  addIngredient: (name: string) => void;
  removeIngredient: (name: string) => void;
  clearIngredients: () => void;
  recommendRecipes: () => void;
  randomRecipes: () => void;
  setActiveRecipe: (recipe: Recipe | null) => void;
  setCurrentServings: (servings: number) => void;
  toggleStep: (stepId: string) => void;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  selectedIngredients: [],
  recipes: mockRecipes,
  activeRecipe: null,
  showDetail: false,
  currentServings: 2,
  completedSteps: [],
  hasSearched: false,

  addIngredient: (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !get().selectedIngredients.includes(trimmed)) {
      set((state) => ({
        selectedIngredients: [...state.selectedIngredients, trimmed],
      }));
    }
  },

  removeIngredient: (name: string) => {
    set((state) => ({
      selectedIngredients: state.selectedIngredients.filter((i) => i !== name),
    }));
  },

  clearIngredients: () => set({ selectedIngredients: [], hasSearched: false }),

  recommendRecipes: () => {
    const { selectedIngredients, recipes } = get();
    const scored = recipes
      .map((recipe) => {
        const matchCount = recipe.ingredients.filter((ing) =>
          selectedIngredients.some(
            (selected) =>
              ing.name.includes(selected) || selected.includes(ing.name)
          )
        ).length;
        const score = Math.round(
          (matchCount / recipe.ingredients.length) * 100
        );
        return { ...recipe, matchScore: score };
      })
      .sort((a, b) => b.matchScore - a.matchScore);
    set({ recipes: scored, hasSearched: true });
  },

  randomRecipes: () => {
    const shuffled = [...get().recipes]
      .map((r) => ({ ...r, matchScore: Math.floor(Math.random() * 60) + 40 }))
      .sort(() => Math.random() - 0.5);
    set({ recipes: shuffled, hasSearched: true });
  },

  setActiveRecipe: (recipe: Recipe | null) => {
    set({
      activeRecipe: recipe,
      showDetail: !!recipe,
      currentServings: recipe?.baseServings || 2,
      completedSteps: [],
    });
  },

  setCurrentServings: (servings: number) => set({ currentServings: servings }),

  toggleStep: (stepId: string) => {
    set((state) => ({
      completedSteps: state.completedSteps.includes(stepId)
        ? state.completedSteps.filter((id) => id !== stepId)
        : [...state.completedSteps, stepId],
    }));
  },
}));
