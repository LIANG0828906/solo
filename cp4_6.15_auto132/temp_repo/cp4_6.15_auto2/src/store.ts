import { create } from 'zustand';
import type { UserIngredient, DietTag, ShoppingItem } from './data';
import { recommendRecipes, generateShoppingList } from './data';
import type { Recipe, RecipeScore } from './data';

interface AppState {
  userIngredients: UserIngredient[];
  dietPreferences: DietTag[];
  selectedRecipeIds: string[];
  shoppingItems: ShoppingItem[];
  recommendations: RecipeScore[];
  selectedRecipes: Recipe[];

  addIngredient: (ingredient: UserIngredient) => void;
  removeIngredient: (ingredientId: string) => void;
  updateIngredientQuantity: (ingredientId: string, quantity: number) => void;
  toggleDietPreference: (tag: DietTag) => void;
  toggleRecipeSelection: (recipeId: string) => void;
  toggleShoppingItem: (ingredientId: string) => void;
  computeRecommendations: () => void;
  computeShoppingList: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  userIngredients: [],
  dietPreferences: [],
  selectedRecipeIds: [],
  shoppingItems: [],
  recommendations: [],
  selectedRecipes: [],

  addIngredient: (ingredient) =>
    set((state) => {
      const existing = state.userIngredients.find(
        (ui) => ui.ingredientId === ingredient.ingredientId
      );
      if (existing) {
        return {
          userIngredients: state.userIngredients.map((ui) =>
            ui.ingredientId === ingredient.ingredientId
              ? { ...ui, quantity: ui.quantity + ingredient.quantity }
              : ui
          ),
        };
      }
      return { userIngredients: [...state.userIngredients, ingredient] };
    }),

  removeIngredient: (ingredientId) =>
    set((state) => ({
      userIngredients: state.userIngredients.filter(
        (ui) => ui.ingredientId !== ingredientId
      ),
    })),

  updateIngredientQuantity: (ingredientId, quantity) =>
    set((state) => ({
      userIngredients: state.userIngredients.map((ui) =>
        ui.ingredientId === ingredientId ? { ...ui, quantity } : ui
      ),
    })),

  toggleDietPreference: (tag) =>
    set((state) => ({
      dietPreferences: state.dietPreferences.includes(tag)
        ? state.dietPreferences.filter((t) => t !== tag)
        : [...state.dietPreferences, tag],
    })),

  toggleRecipeSelection: (recipeId) =>
    set((state) => {
      const isSelected = state.selectedRecipeIds.includes(recipeId);
      const newSelectedIds = isSelected
        ? state.selectedRecipeIds.filter((id) => id !== recipeId)
        : [...state.selectedRecipeIds, recipeId];
      const newSelectedRecipes = state.recommendations
        .filter((r) => newSelectedIds.includes(r.recipe.id))
        .map((r) => r.recipe);
      return {
        selectedRecipeIds: newSelectedIds,
        selectedRecipes: newSelectedRecipes,
      };
    }),

  toggleShoppingItem: (ingredientId) =>
    set((state) => ({
      shoppingItems: state.shoppingItems.map((item) =>
        item.ingredientId === ingredientId
          ? { ...item, checked: !item.checked }
          : item
      ),
    })),

  computeRecommendations: () => {
    const { userIngredients, dietPreferences } = get();
    const recommendations = recommendRecipes(userIngredients, dietPreferences);
    const selectedRecipeIds = get().selectedRecipeIds.filter((id) =>
      recommendations.some((r) => r.recipe.id === id)
    );
    const selectedRecipes = recommendations
      .filter((r) => selectedRecipeIds.includes(r.recipe.id))
      .map((r) => r.recipe);
    set({ recommendations, selectedRecipeIds, selectedRecipes });
  },

  computeShoppingList: () => {
    const { selectedRecipes, userIngredients } = get();
    const existingCheckedMap = new Map(
      get().shoppingItems.map((item) => [item.ingredientId, item.checked])
    );
    const items = generateShoppingList(selectedRecipes, userIngredients).map(
      (item) => ({
        ...item,
        checked: existingCheckedMap.get(item.ingredientId) ?? false,
      })
    );
    set({ shoppingItems: items });
  },
}));
