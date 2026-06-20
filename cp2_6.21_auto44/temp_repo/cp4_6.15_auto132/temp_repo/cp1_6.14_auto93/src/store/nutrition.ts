import { create } from 'zustand';
import type {
  MealEntry,
  UserProfile,
  DailyNutrition,
  WeeklyPlan,
  PlanMeal,
} from '../../shared/types';
import {
  getMeals,
  addMeal,
  deleteMeal,
  getDailyNutrition,
  getWeeklyNutrition,
  getProfile,
  saveProfile,
  getPlans,
  generatePlan,
  type AddMealBody,
  type SaveProfileBody,
} from '../lib/api';

interface PlanFoodItem {
  foodId: string;
  foodName: string;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionState {
  meals: MealEntry[];
  profile: UserProfile | null;
  dailyNutrition: DailyNutrition | null;
  weeklyNutrition: DailyNutrition[];
  plan: WeeklyPlan | null;
  loading: boolean;
  error: string | null;

  fetchMeals: (date: string) => Promise<void>;
  addMealRecord: (data: AddMealBody) => Promise<void>;
  removeMeal: (id: string) => Promise<void>;
  fetchDailyNutrition: (date: string) => Promise<void>;
  fetchWeeklyNutrition: (days?: number) => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: SaveProfileBody) => Promise<void>;
  fetchPlan: () => Promise<void>;
  createPlan: (startDate?: string) => Promise<void>;
  addMealFromPlan: (
    foodItem: PlanFoodItem,
    mealType: PlanMeal['mealType'],
    date: string,
    quantity?: number,
  ) => Promise<void>;
}

const mapMealType = (
  type: PlanMeal['mealType'],
): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
  switch (type) {
    case 'breakfast':
      return 'breakfast';
    case 'lunch':
      return 'lunch';
    case 'dinner':
      return 'dinner';
    case 'snack-morning':
    case 'snack-afternoon':
      return 'snack';
    default:
      return 'snack';
  }
};

export const useNutritionStore = create<NutritionState>((set, get) => ({
  meals: [],
  profile: null,
  dailyNutrition: null,
  weeklyNutrition: [],
  plan: null,
  loading: false,
  error: null,

  fetchMeals: async (date: string) => {
    set({ loading: true, error: null });
    try {
      const meals = await getMeals(date);
      set({ meals, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取饮食记录失败', loading: false });
    }
  },

  addMealRecord: async (data: AddMealBody) => {
    set({ loading: true, error: null });
    try {
      const newMeal = await addMeal(data);
      set((state) => ({
        meals: [...state.meals, newMeal],
        loading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加饮食记录失败', loading: false });
      throw err;
    }
  },

  removeMeal: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteMeal(id);
      set((state) => ({
        meals: state.meals.filter((m) => m.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '删除饮食记录失败', loading: false });
      throw err;
    }
  },

  fetchDailyNutrition: async (date: string) => {
    set({ loading: true, error: null });
    try {
      const nutrition = await getDailyNutrition(date);
      set({ dailyNutrition: nutrition, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取每日营养数据失败', loading: false });
    }
  },

  fetchWeeklyNutrition: async (days?: number) => {
    set({ loading: true, error: null });
    try {
      const nutrition = await getWeeklyNutrition(days);
      set({ weeklyNutrition: nutrition, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取每周营养数据失败', loading: false });
    }
  },

  fetchProfile: async () => {
    set({ loading: true, error: null });
    try {
      const profile = await getProfile();
      set({ profile, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取用户档案失败', loading: false });
    }
  },

  updateProfile: async (data: SaveProfileBody) => {
    set({ loading: true, error: null });
    try {
      const profile = await saveProfile(data);
      set({ profile, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存用户档案失败', loading: false });
      throw err;
    }
  },

  fetchPlan: async () => {
    set({ loading: true, error: null });
    try {
      const plans = await getPlans();
      const latestPlan = plans.length > 0 ? plans[plans.length - 1] : null;
      set({ plan: latestPlan, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取饮食计划失败', loading: false });
    }
  },

  createPlan: async (startDate?: string) => {
    set({ loading: true, error: null });
    try {
      const plan = await generatePlan(startDate);
      set({ plan, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '生成饮食计划失败', loading: false });
      throw err;
    }
  },

  addMealFromPlan: async (
    foodItem: PlanFoodItem,
    mealType: PlanMeal['mealType'],
    date: string,
    quantity?: number,
  ) => {
    const mappedType = mapMealType(mealType);
    const finalQuantity = quantity !== undefined ? quantity : foodItem.quantity;

    const addMealData: AddMealBody = {
      foodId: foodItem.foodId,
      mealType: mappedType,
      quantity: finalQuantity,
      date,
    };

    await get().addMealRecord(addMealData);
  },
}));
