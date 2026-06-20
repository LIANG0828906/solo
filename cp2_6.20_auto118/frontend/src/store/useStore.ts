import { create } from 'zustand';
import { Recipe, MealPlan, Ingredient, DailyGoal, DailySummary } from '../types';

interface AppState {
  recipes: Recipe[];
  mealPlans: MealPlan[];
  ingredientsDB: Ingredient[];
  dailyGoal: DailyGoal;
  dailySummary: DailySummary | null;

  setRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (recipe: Recipe) => void;
  removeRecipe: (id: string) => void;
  toggleRecipeFavorite: (id: string) => void;

  setMealPlans: (mealPlans: MealPlan[]) => void;
  addMealPlan: (mealPlan: MealPlan) => void;
  removeMealPlan: (id: string) => void;

  setIngredientsDB: (ingredients: Ingredient[]) => void;

  setDailyGoal: (goal: DailyGoal) => void;
  setDailySummary: (summary: DailySummary | null) => void;
}

const defaultDailyGoal: DailyGoal = {
  calories: 2000,
  protein: 60,
  fat: 65,
  carbs: 260,
};

export const useStore = create<AppState>((set) => ({
  recipes: [],
  mealPlans: [],
  ingredientsDB: [],
  dailyGoal: defaultDailyGoal,
  dailySummary: null,

  setRecipes: (recipes) => set({ recipes }),
  addRecipe: (recipe) => set((state) => ({ recipes: [recipe, ...state.recipes] })),
  updateRecipe: (recipe) =>
    set((state) => ({
      recipes: state.recipes.map((r) => (r.id === recipe.id ? recipe : r)),
    })),
  removeRecipe: (id) =>
    set((state) => ({
      recipes: state.recipes.filter((r) => r.id !== id),
    })),
  toggleRecipeFavorite: (id) =>
    set((state) => ({
      recipes: state.recipes.map((r) =>
        r.id === id ? { ...r, isFavorite: !r.isFavorite } : r
      ),
    })),

  setMealPlans: (mealPlans) => set({ mealPlans }),
  addMealPlan: (mealPlan) => set((state) => ({ mealPlans: [...state.mealPlans, mealPlan] })),
  removeMealPlan: (id) =>
    set((state) => ({
      mealPlans: state.mealPlans.filter((m) => m.id !== id),
    })),

  setIngredientsDB: (ingredientsDB) => set({ ingredientsDB }),

  setDailyGoal: (dailyGoal) => set({ dailyGoal }),
  setDailySummary: (dailySummary) => set({ dailySummary }),
}));
