import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface PlannedRecipe {
  id: string;
  recipeId: string;
  name: string;
  image: string;
  cookTime: number;
}

export interface DayPlan {
  dayKey: string;
  dayName: string;
  date: string;
  recipes: PlannedRecipe[];
}

interface MealPlanContextType {
  mealPlan: DayPlan[];
  addRecipeToDay: (dayKey: string, recipe: Omit<PlannedRecipe, 'id'>) => void;
  removeRecipeFromDay: (dayKey: string, plannedId: string) => void;
  moveRecipe: (
    fromDayKey: string,
    toDayKey: string,
    fromIndex: number,
    toIndex: number
  ) => void;
  getDayTotalCookTime: (dayKey: string) => number;
  getDayRecipeCount: (dayKey: string) => number;
}

const MealPlanContext = createContext<MealPlanContextType | undefined>(undefined);

const MEAL_PLAN_KEY = 'meal_plan';

const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const getInitialMealPlan = (): DayPlan[] => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  return dayNames.map((dayName, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + mondayOffset + index);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return {
      dayKey: `day-${index}`,
      dayName,
      date: `${month}月${day}日`,
      recipes: [],
    };
  });
};

export function MealPlanProvider({ children }: { children: ReactNode }) {
  const [mealPlan, setMealPlan] = useState<DayPlan[]>(() => {
    try {
      const saved = localStorage.getItem(MEAL_PLAN_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const initial = getInitialMealPlan();
        return initial.map((day) => {
          const savedDay = parsed.find(
            (d: DayPlan) => d.dayKey === day.dayKey
          );
          return savedDay ? { ...day, recipes: savedDay.recipes } : day;
        });
      }
    } catch {
      // ignore
    }
    return getInitialMealPlan();
  });

  useEffect(() => {
    localStorage.setItem(MEAL_PLAN_KEY, JSON.stringify(mealPlan));
  }, [mealPlan]);

  const addRecipeToDay = (
    dayKey: string,
    recipe: Omit<PlannedRecipe, 'id'>
  ) => {
    setMealPlan((prev) =>
      prev.map((day) =>
        day.dayKey === dayKey
          ? { ...day, recipes: [...day.recipes, { ...recipe, id: uuidv4() }] }
          : day
      )
    );
  };

  const removeRecipeFromDay = (dayKey: string, plannedId: string) => {
    setMealPlan((prev) =>
      prev.map((day) =>
        day.dayKey === dayKey
          ? { ...day, recipes: day.recipes.filter((r) => r.id !== plannedId) }
          : day
      )
    );
  };

  const moveRecipe = (
    fromDayKey: string,
    toDayKey: string,
    fromIndex: number,
    toIndex: number
  ) => {
    setMealPlan((prev) => {
      const newPlan = prev.map((day) => ({ ...day, recipes: [...day.recipes] }));
      const fromDay = newPlan.find((d) => d.dayKey === fromDayKey);
      const toDay = newPlan.find((d) => d.dayKey === toDayKey);

      if (!fromDay || !toDay) return prev;

      const [movedRecipe] = fromDay.recipes.splice(fromIndex, 1);
      toDay.recipes.splice(toIndex, 0, movedRecipe);

      return newPlan;
    });
  };

  const getDayTotalCookTime = (dayKey: string) => {
    const day = mealPlan.find((d) => d.dayKey === dayKey);
    if (!day) return 0;
    return day.recipes.reduce((total, recipe) => total + recipe.cookTime, 0);
  };

  const getDayRecipeCount = (dayKey: string) => {
    const day = mealPlan.find((d) => d.dayKey === dayKey);
    return day ? day.recipes.length : 0;
  };

  return (
    <MealPlanContext.Provider
      value={{
        mealPlan,
        addRecipeToDay,
        removeRecipeFromDay,
        moveRecipe,
        getDayTotalCookTime,
        getDayRecipeCount,
      }}
    >
      {children}
    </MealPlanContext.Provider>
  );
}

export function useMealPlan() {
  const context = useContext(MealPlanContext);
  if (!context) {
    throw new Error('useMealPlan must be used within a MealPlanProvider');
  }
  return context;
}
