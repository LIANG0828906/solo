import { create } from 'zustand';
import type { Ingredient, Recipe, Preferences, RecommendationResult, DietType } from '@/types';
import { recipeApi } from '@/api/recipeApi';
import { generateRecommendations } from '@/engine/recipeEngine';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  selectedIngredients: Ingredient[];
  recommendations: RecommendationResult[];
  preferences: Preferences;
  isGenerating: boolean;
  selectedRecipe: Recipe | null;
  isPanelCollapsed: boolean;
  
  addIngredient: (ingredient: Omit<Ingredient, 'id'>) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
  setDietType: (type: DietType) => void;
  toggleAllergen: (allergen: string) => void;
  generateRecommendationsAction: () => Promise<void>;
  selectRecipe: (recipe: Recipe | null) => void;
  togglePanel: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedIngredients: [],
  recommendations: [],
  preferences: {
    dietType: 'unlimited',
    allergens: [],
  },
  isGenerating: false,
  selectedRecipe: null,
  isPanelCollapsed: false,

  addIngredient: (ingredient) => {
    const { selectedIngredients } = get();
    const exists = selectedIngredients.some(
      ing => ing.name.toLowerCase() === ingredient.name.toLowerCase()
    );
    if (!exists) {
      set({
        selectedIngredients: [...selectedIngredients, { ...ingredient, id: uuidv4() }],
      });
    }
  },

  removeIngredient: (id) => {
    set(state => ({
      selectedIngredients: state.selectedIngredients.filter(ing => ing.id !== id),
    }));
  },

  clearIngredients: () => {
    set({ selectedIngredients: [] });
  },

  setDietType: (type) => {
    set(state => ({
      preferences: { ...state.preferences, dietType: type },
    }));
    const { selectedIngredients } = get();
    if (selectedIngredients.length > 0) {
      get().generateRecommendationsAction();
    }
  },

  toggleAllergen: (allergen) => {
    set(state => {
      const allergens = state.preferences.allergens.includes(allergen)
        ? state.preferences.allergens.filter(a => a !== allergen)
        : [...state.preferences.allergens, allergen];
      return {
        preferences: { ...state.preferences, allergens },
      };
    });
    const { selectedIngredients } = get();
    if (selectedIngredients.length > 0) {
      get().generateRecommendationsAction();
    }
  },

  generateRecommendationsAction: async () => {
    const { selectedIngredients, preferences } = get();
    if (selectedIngredients.length === 0) {
      set({ recommendations: [] });
      return;
    }

    set({ isGenerating: true });
    
    try {
      const recipes = await recipeApi.getAllRecipes();
      const results = generateRecommendations(recipes, selectedIngredients, preferences);
      set({ recommendations: results });
    } catch (error) {
      console.error('生成推荐失败:', error);
      set({ recommendations: [] });
    } finally {
      set({ isGenerating: false });
    }
  },

  selectRecipe: (recipe) => {
    set({ selectedRecipe: recipe });
  },

  togglePanel: () => {
    set(state => ({ isPanelCollapsed: !state.isPanelCollapsed }));
  },
}));
