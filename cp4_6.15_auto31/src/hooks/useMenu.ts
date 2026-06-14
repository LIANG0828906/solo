import { create } from 'zustand';
import type { Recipe, ShoppingItem, DayOfWeek, MealType, Zone } from '@/types';
import { DAYS, MEALS, ZONES } from '@/types';
import { builtinRecipes } from '@/data/recipes';

type MealPlanKey = `${DayOfWeek}-${MealType}`;

interface MenuState {
  recipes: Recipe[];
  mealPlan: Record<MealPlanKey, string | null>;
  shoppingItems: ShoppingItem[];
  currentWeek: number;
  expandedZones: Record<Zone, boolean>;

  addCustomRecipe: (recipe: Recipe) => void;
  assignRecipeToSlot: (day: DayOfWeek, meal: MealType, recipeId: string) => void;
  clearSlot: (day: DayOfWeek, meal: MealType) => void;
  generateShoppingList: () => void;
  toggleShoppingItem: (itemName: string) => void;
  toggleZone: (zone: Zone) => void;
  setCurrentWeek: (week: number) => void;
  getRecipeById: (id: string) => Recipe | undefined;
}

const initialMealPlan: Record<MealPlanKey, string | null> = {} as Record<MealPlanKey, string | null>;
for (const day of DAYS) {
  for (const meal of MEALS) {
    initialMealPlan[`${day}-${meal}`] = null;
  }
}

const initialExpandedZones: Record<Zone, boolean> = {} as Record<Zone, boolean>;
for (const zone of ZONES) {
  initialExpandedZones[zone] = true;
}

function mergeIngredients(recipes: Recipe[]): ShoppingItem[] {
  const map = new Map<string, ShoppingItem>();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name}-${ing.unit}`;
      const existing = map.get(key);
      if (existing) {
        existing.quantity += ing.quantity;
      } else {
        map.set(key, {
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          zone: ing.zone,
          checked: false,
        });
      }
    }
  }

  const items = Array.from(map.values());
  items.sort((a, b) => ZONES.indexOf(a.zone) - ZONES.indexOf(b.zone));
  return items;
}

export const useMenuStore = create<MenuState>((set, get) => ({
  recipes: [...builtinRecipes],
  mealPlan: initialMealPlan,
  shoppingItems: [],
  currentWeek: 1,
  expandedZones: initialExpandedZones,

  addCustomRecipe: (recipe: Recipe) => {
    set((state) => ({
      recipes: [...state.recipes, recipe],
    }));
  },

  assignRecipeToSlot: (day: DayOfWeek, meal: MealType, recipeId: string) => {
    const key: MealPlanKey = `${day}-${meal}`;
    set((state) => ({
      mealPlan: { ...state.mealPlan, [key]: recipeId },
    }));
    get().generateShoppingList();
  },

  clearSlot: (day: DayOfWeek, meal: MealType) => {
    const key: MealPlanKey = `${day}-${meal}`;
    set((state) => ({
      mealPlan: { ...state.mealPlan, [key]: null },
    }));
    get().generateShoppingList();
  },

  generateShoppingList: () => {
    const { mealPlan, recipes } = get();
    const assignedRecipeIds = new Set(
      Object.values(mealPlan).filter((id): id is string => id !== null)
    );
    const assignedRecipes = recipes.filter((r) => assignedRecipeIds.has(r.id));
    const items = mergeIngredients(assignedRecipes);
    set({ shoppingItems: items });
  },

  toggleShoppingItem: (itemName: string) => {
    set((state) => ({
      shoppingItems: state.shoppingItems.map((item) =>
        item.name === itemName ? { ...item, checked: !item.checked } : item
      ),
    }));
  },

  toggleZone: (zone: Zone) => {
    set((state) => ({
      expandedZones: { ...state.expandedZones, [zone]: !state.expandedZones[zone] },
    }));
  },

  setCurrentWeek: (week: number) => {
    set({ currentWeek: week });
  },

  getRecipeById: (id: string) => {
    return get().recipes.find((r) => r.id === id);
  },
}));
