import { create } from 'zustand';
import {
  fetchIngredients,
  searchRecipes,
  fetchRecipeDetail,
  fetchSubstitutions,
} from '../utils/api';
import type { Ingredient, Recipe, SearchResult, Substitution, Nutrition } from '../utils/api';

interface ActiveSub {
  originalId: string;
  originalName: string;
  substituteName: string;
  diffPercent: string;
}

interface RecipeStore {
  ingredients: Ingredient[];
  selectedIngredientIds: string[];
  searchResults: SearchResult[];
  currentRecipe: Recipe | null;
  currentSubstitutions: Substitution[];
  activeSubstitutionIngredientId: string | null;
  activeSubstitutions: ActiveSub[];
  favorites: string[];
  loading: boolean;
  substitutionPanelOpen: boolean;

  loadIngredients: () => Promise<void>;
  toggleIngredient: (id: string) => void;
  removeIngredient: (id: string) => void;
  clearIngredients: () => void;
  doSearch: () => Promise<void>;
  loadRecipe: (id: string) => Promise<void>;
  openSubstitutionPanel: (ingredientId: string) => Promise<void>;
  closeSubstitutionPanel: () => void;
  applySubstitution: (originalId: string, originalName: string, subName: string, diffPercent: string) => void;
  revertSubstitution: (originalId: string) => void;
  toggleFavorite: (recipeId: string) => void;
  isFavorite: (recipeId: string) => boolean;
  getAdjustedNutrition: (baseNutrition: Nutrition) => Nutrition;
  getSubImpactText: (baseNutrition: Nutrition) => string;
  getIngredientDisplayName: (ingredientId: string, ingredients: Ingredient[]) => string;
  isIngredientSubstituted: (ingredientId: string) => boolean;
}

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem('recipe_favorites');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favs: string[]) {
  localStorage.setItem('recipe_favorites', JSON.stringify(favs));
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  ingredients: [],
  selectedIngredientIds: [],
  searchResults: [],
  currentRecipe: null,
  currentSubstitutions: [],
  activeSubstitutionIngredientId: null,
  activeSubstitutions: [],
  favorites: loadFavorites(),
  loading: false,
  substitutionPanelOpen: false,

  loadIngredients: async () => {
    const data = await fetchIngredients();
    set({ ingredients: data });
  },

  toggleIngredient: (id: string) => {
    const { selectedIngredientIds } = get();
    if (selectedIngredientIds.includes(id)) {
      set({ selectedIngredientIds: selectedIngredientIds.filter(x => x !== id) });
    } else if (selectedIngredientIds.length < 8) {
      set({ selectedIngredientIds: [...selectedIngredientIds, id] });
    }
  },

  removeIngredient: (id: string) => {
    set({ selectedIngredientIds: get().selectedIngredientIds.filter(x => x !== id) });
  },

  clearIngredients: () => {
    set({ selectedIngredientIds: [], searchResults: [] });
  },

  doSearch: async () => {
    const { selectedIngredientIds } = get();
    if (selectedIngredientIds.length === 0) {
      set({ searchResults: [] });
      return;
    }
    set({ loading: true });
    const results = await searchRecipes(selectedIngredientIds);
    set({ searchResults: results, loading: false });
  },

  loadRecipe: async (id: string) => {
    set({ loading: true, currentRecipe: null, activeSubstitutions: [] });
    const recipe = await fetchRecipeDetail(id);
    set({ currentRecipe: recipe, loading: false });
  },

  openSubstitutionPanel: async (ingredientId: string) => {
    set({ activeSubstitutionIngredientId: ingredientId, substitutionPanelOpen: true });
    const subs = await fetchSubstitutions(ingredientId);
    set({ currentSubstitutions: subs });
  },

  closeSubstitutionPanel: () => {
    set({ substitutionPanelOpen: false, activeSubstitutionIngredientId: null, currentSubstitutions: [] });
  },

  applySubstitution: (originalId, originalName, subName, diffPercent) => {
    const { activeSubstitutions } = get();
    const filtered = activeSubstitutions.filter(s => s.originalId !== originalId);
    set({ activeSubstitutions: [...filtered, { originalId, originalName, substituteName: subName, diffPercent }] });
  },

  revertSubstitution: (originalId) => {
    set({ activeSubstitutions: get().activeSubstitutions.filter(s => s.originalId !== originalId) });
  },

  toggleFavorite: (recipeId: string) => {
    const { favorites } = get();
    const next = favorites.includes(recipeId)
      ? favorites.filter(x => x !== recipeId)
      : [...favorites, recipeId];
    set({ favorites: next });
    saveFavorites(next);
  },

  isFavorite: (recipeId: string) => {
    return get().favorites.includes(recipeId);
  },

  getAdjustedNutrition: (baseNutrition: Nutrition) => {
    const { activeSubstitutions } = get();
    if (activeSubstitutions.length === 0) return baseNutrition;
    let adjusted = { ...baseNutrition };
    for (const sub of activeSubstitutions) {
      const match = sub.diffPercent.match(/([+-]?\d+)%/);
      if (match) {
        const pct = parseInt(match[1], 10) / 100;
        adjusted = {
          calories: Math.round(adjusted.calories * (1 + pct * 0.3)),
          protein: Math.round(adjusted.protein * (1 + pct * 0.2)),
          fat: Math.round(adjusted.fat * (1 + pct * 0.3)),
          carbs: Math.round(adjusted.carbs * (1 + pct * 0.2)),
          fiber: Math.round(adjusted.fiber * (1 + pct * 0.1)),
          sodium: Math.round(adjusted.sodium * (1 + pct * 0.15)),
        };
      }
    }
    return adjusted;
  },

  getSubImpactText: (baseNutrition: Nutrition) => {
    const { activeSubstitutions } = get();
    if (activeSubstitutions.length === 0) return '';
    const adjusted = get().getAdjustedNutrition(baseNutrition);
    const calDiff = ((adjusted.calories - baseNutrition.calories) / baseNutrition.calories * 100).toFixed(0);
    const dir = parseInt(calDiff) > 0 ? '增加' : '降低';
    const absVal = Math.abs(parseInt(calDiff));
    if (absVal === 0) return '替换后整体营养变化不大';
    return `替换后总热量${dir}${absVal}%`;
  },

  getIngredientDisplayName: (ingredientId: string, ingredients: Ingredient[]) => {
    const { activeSubstitutions } = get();
    const sub = activeSubstitutions.find(s => s.originalId === ingredientId);
    if (sub) return sub.substituteName;
    const ing = ingredients.find(i => i.id === ingredientId);
    return ing ? ing.name : ingredientId;
  },

  isIngredientSubstituted: (ingredientId: string) => {
    return get().activeSubstitutions.some(s => s.originalId === ingredientId);
  },
}));
