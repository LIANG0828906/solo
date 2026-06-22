import { create } from 'zustand';
import type { FoodLogEntry, UserProfile, NutritionGoals, DailyNutrition, MealType } from '@/types';
import * as api from '@/services/food-api';

function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getDaysAgoString(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface NutritionState {
  todayLogs: FoodLogEntry[];
  goals: NutritionGoals | null;
  profile: UserProfile | null;
  selectedDate: string;
  recentLogs: FoodLogEntry[];
  notification: { message: string; type: 'reminder' | 'recommendation' } | null;
  recommendation: { dishName: string; reason: string; nutrients: string } | null;
  lastAddedId: string | null;

  fetchTodayLogs: () => Promise<void>;
  addFoodEntry: (foodId: string, amount: number, mealType: MealType) => Promise<void>;
  removeFoodEntry: (id: string) => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  saveProfileData: (profile: UserProfile) => Promise<void>;
  updateGoalsData: (goals: NutritionGoals) => Promise<void>;
  setSelectedDate: (date: string) => void;
  fetchRecentLogs: () => Promise<void>;
  checkAndShowNotification: () => void;
  dismissNotification: () => void;
  computeDailyTotals: () => DailyNutrition;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  todayLogs: [],
  goals: null,
  profile: null,
  selectedDate: getTodayString(),
  recentLogs: [],
  notification: null,
  recommendation: null,
  lastAddedId: null,

  fetchTodayLogs: async () => {
    const { selectedDate } = get();
    const logs = await api.getFoodLogs(selectedDate);
    set({ todayLogs: logs });
  },

  addFoodEntry: async (foodId, amount, mealType) => {
    const { selectedDate } = get();
    const entry = await api.addFoodLog({ foodId, amount, mealType, date: selectedDate });
    set((state) => ({
      todayLogs: [...state.todayLogs, entry],
      lastAddedId: entry.id,
    }));
  },

  removeFoodEntry: async (id) => {
    await api.deleteFoodLog(id);
    set((state) => ({
      todayLogs: state.todayLogs.filter((log) => log.id !== id),
    }));
  },

  fetchGoals: async () => {
    const goals = await api.getGoals();
    set({ goals });
  },

  fetchProfile: async () => {
    const data = await api.getProfile();
    if (data) {
      const { bmr: _bmr, tdee: _tdee, ...profile } = data;
      set({ profile });
    }
  },

  saveProfileData: async (profile) => {
    const data = await api.saveProfile(profile);
    const { bmr: _bmr, tdee: _tdee, ...savedProfile } = data;
    set({ profile: savedProfile });
    const newGoals = await api.getGoals();
    if (newGoals) {
      set({ goals: newGoals });
    }
  },

  updateGoalsData: async (goals) => {
    const updated = await api.updateGoals(goals);
    set({ goals: updated });
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
  },

  fetchRecentLogs: async () => {
    const start = getDaysAgoString(6);
    const end = getTodayString();
    const logs = await api.getFoodLogsRange(start, end);
    set({ recentLogs: logs });
  },

  checkAndShowNotification: () => {
    const hour = new Date().getHours();
    const { goals, todayLogs } = get();

    if (hour >= 6 && hour < 9) {
      set({
        notification: {
          message: '早餐时间到了！记得记录你的早餐摄入。',
          type: 'reminder',
        },
      });
    } else if (hour >= 11 && hour < 13) {
      set({
        notification: {
          message: '午餐时间到了！记得记录你的午餐摄入。',
          type: 'reminder',
        },
      });
    } else if (hour >= 17 && hour < 19) {
      set({
        notification: {
          message: '晚餐时间到了！记得记录你的晚餐摄入。',
          type: 'reminder',
        },
      });
    } else if (goals) {
      const totals = get().computeDailyTotals();
      const remaining = goals.calories - totals.calories;
      if (remaining > 500) {
        set({
          notification: {
            message: `今日还有 ${remaining} 千卡未摄入，注意补充营养。`,
            type: 'recommendation',
          },
          recommendation: {
            dishName: '鸡胸肉沙拉',
            reason: '高蛋白低脂肪，适合补充剩余热量',
            nutrients: '蛋白质 30g / 脂肪 8g / 碳水 12g',
          },
        });
      } else if (remaining < 0) {
        set({
          notification: {
            message: `今日热量已超标 ${Math.abs(remaining)} 千卡，注意控制摄入。`,
            type: 'recommendation',
          },
        });
      }
    }
  },

  dismissNotification: () => {
    set({ notification: null, recommendation: null });
  },

  computeDailyTotals: () => {
    const { todayLogs } = get();
    return todayLogs.reduce<DailyNutrition>(
      (acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        fat: acc.fat + log.fat,
        carbs: acc.carbs + log.carbs,
        fiber: acc.fiber + log.fiber,
      }),
      { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 },
    );
  },
}));
