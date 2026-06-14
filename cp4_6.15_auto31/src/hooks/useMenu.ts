import { create } from 'zustand';
import type { Recipe, ShoppingItem, DayOfWeek, MealType, Zone } from '@/types';
import { DAYS, MEALS, ZONES } from '@/types';
import { builtinRecipes } from '@/data/recipes';

type MealPlanKey = `${DayOfWeek}-${MealType}`;
type WeekMealPlans = Record<number, Record<MealPlanKey, string | null>>;
type WeekShoppingItems = Record<number, ShoppingItem[]>;
type WeekCheckedItems = Record<number, Record<string, boolean>>;

function createEmptyMealPlan(): Record<MealPlanKey, string | null> {
  const plan = {} as Record<MealPlanKey, string | null>;
  for (const day of DAYS) {
    for (const meal of MEALS) {
      plan[`${day}-${meal}`] = null;
    }
  }
  return plan;
}

function createSampleWeekMealPlan(offset: number): Record<MealPlanKey, string | null> {
  const plan = createEmptyMealPlan();
  const weekRecipes = [
    ['r11', 'r1', 'r7'],
    ['r12', 'r2', 'r8'],
    ['r13', 'r3', 'r9'],
    ['r11', 'r4', 'r10'],
    ['r12', 'r5', 'r7'],
    ['r13', 'r6', 'r8'],
    ['r11', 'r1', 'r9'],
  ];
  const shifted = weekRecipes.map((_, i) => weekRecipes[(i + offset) % weekRecipes.length]);
  for (let d = 0; d < DAYS.length; d++) {
    const day = DAYS[d];
    for (let m = 0; m < MEALS.length; m++) {
      plan[`${day}-${MEALS[m]}`] = shifted[d][m];
    }
  }
  return plan;
}

const initialWeekMealPlans: WeekMealPlans = {
  1: createSampleWeekMealPlan(0),
  2: createSampleWeekMealPlan(2),
  3: createSampleWeekMealPlan(4),
  4: createSampleWeekMealPlan(6),
};

interface MenuState {
  recipes: Recipe[];
  weekMealPlans: WeekMealPlans;
  weekShoppingItems: WeekShoppingItems;
  weekCheckedItems: WeekCheckedItems;
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
  getMealPlan: () => Record<MealPlanKey, string | null>;
  getShoppingItems: () => ShoppingItem[];
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

function generateInitialWeekData() {
  const shopping: WeekShoppingItems = {};
  const checked: WeekCheckedItems = {};
  for (let w = 1; w <= 4; w++) {
    const plan = initialWeekMealPlans[w];
    const ids = new Set(Object.values(plan).filter((id): id is string => id !== null));
    const recipes = builtinRecipes.filter((r) => ids.has(r.id));
    shopping[w] = mergeIngredients(recipes);
    checked[w] = {};
  }
  return { shopping, checked };
}

const initialWeekData = generateInitialWeekData();

export const useMenuStore = create<MenuState>((set, get) => ({
  recipes: [...builtinRecipes],
  weekMealPlans: initialWeekMealPlans,
  weekShoppingItems: initialWeekData.shopping,
  weekCheckedItems: initialWeekData.checked,
  currentWeek: 1,
  expandedZones: initialExpandedZones,

  getMealPlan: () => {
    const { weekMealPlans, currentWeek } = get();
    return weekMealPlans[currentWeek] || createEmptyMealPlan();
  },

  getShoppingItems: () => {
    const { weekShoppingItems, weekCheckedItems, currentWeek } = get();
    const items = weekShoppingItems[currentWeek] || [];
    const checked = weekCheckedItems[currentWeek] || {};
    return items.map((item) => ({ ...item, checked: checked[item.name] ?? false }));
  },

  addCustomRecipe: (recipe: Recipe) => {
    set((state) => ({
      recipes: [...state.recipes, recipe],
    }));
  },

  assignRecipeToSlot: (day: DayOfWeek, meal: MealType, recipeId: string) => {
    const key: MealPlanKey = `${day}-${meal}`;
    set((state) => {
      const week = state.currentWeek;
      const plan = { ...state.weekMealPlans[week], [key]: recipeId };
      return {
        weekMealPlans: { ...state.weekMealPlans, [week]: plan },
      };
    });
    get().generateShoppingList();
  },

  clearSlot: (day: DayOfWeek, meal: MealType) => {
    const key: MealPlanKey = `${day}-${meal}`;
    set((state) => {
      const week = state.currentWeek;
      const plan = { ...state.weekMealPlans[week], [key]: null };
      return {
        weekMealPlans: { ...state.weekMealPlans, [week]: plan },
      };
    });
    get().generateShoppingList();
  },

  generateShoppingList: () => {
    const { getMealPlan, recipes, currentWeek } = get();
    const mealPlan = getMealPlan();
    const assignedRecipeIds = new Set(
      Object.values(mealPlan).filter((id): id is string => id !== null)
    );
    const assignedRecipes = recipes.filter((r) => assignedRecipeIds.has(r.id));
    const items = mergeIngredients(assignedRecipes);
    set((state) => ({
      weekShoppingItems: { ...state.weekShoppingItems, [currentWeek]: items },
    }));
  },

  toggleShoppingItem: (itemName: string) => {
    set((state) => {
      const week = state.currentWeek;
      const checked = { ...state.weekCheckedItems[week] };
      checked[itemName] = !checked[itemName];
      return {
        weekCheckedItems: { ...state.weekCheckedItems, [week]: checked },
      };
    });
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
