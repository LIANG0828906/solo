import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  WorkoutRecord,
  MealRecord,
  WeeklyPlan,
  UserSettings,
  GoalType,
  WorkoutType,
  DailyStats,
} from './types';
import { db } from './utils/db';
import { generateWeeklyPlan } from './utils/planGenerator';
import { formatDate, getWeekDays, getWeekStartDate } from './utils/dateUtils';
import { calculateWorkoutCalories, calculateMealCalories } from './utils/calories';

interface FitTrackyStore {
  workoutRecords: WorkoutRecord[];
  mealRecords: MealRecord[];
  weeklyPlans: WeeklyPlan[];
  userSettings: UserSettings;
  isLoaded: boolean;

  loadFromIndexedDB: () => Promise<void>;

  addWorkoutRecord: (record: Omit<WorkoutRecord, 'id' | 'createdAt' | 'calories'> & { calories?: number }) => void;
  addMealRecord: (record: Omit<MealRecord, 'id' | 'createdAt' | 'calories'> & { calories?: number }) => void;
  generateWeeklyPlan: (weekStartDate: string) => WeeklyPlan | null;
  updateUserSettings: (settings: Partial<UserSettings>) => void;

  getDailyTotalCalories: (date: string) => { burned: number; consumed: number; duration: number };
  getWeeklyStats: (weekStartDate: string) => { avgBurned: number; avgConsumed: number; totalDuration: number };
  getWorkoutTypePreference: () => Record<WorkoutType, number>;
  getDailyStats: (date: string) => DailyStats;
  getTodayDuration: () => number;
  getCurrentWeekPlan: () => WeeklyPlan | null;
}

const defaultUserSettings: UserSettings = {
  id: 'default',
  goal: 'maintain',
  dailyDurationGoal: 30,
  nickname: '健身达人',
};

export const useFitTrackyStore = create<FitTrackyStore>((set, get) => ({
  workoutRecords: [],
  mealRecords: [],
  weeklyPlans: [],
  userSettings: defaultUserSettings,
  isLoaded: false,

  loadFromIndexedDB: async () => {
    try {
      await db.init();
      
      const [workoutRecords, mealRecords, weeklyPlans, userSettingsList] = await Promise.all([
        db.getAll('workoutRecords'),
        db.getAll('mealRecords'),
        db.getAll('weeklyPlans'),
        db.getAll('userSettings'),
      ]);

      const userSettings = userSettingsList.length > 0 ? userSettingsList[0] : defaultUserSettings;

      set({
        workoutRecords,
        mealRecords,
        weeklyPlans,
        userSettings,
        isLoaded: true,
      });
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      set({ isLoaded: true });
    }
  },

  addWorkoutRecord: (record) => {
    const calories = record.calories ?? calculateWorkoutCalories(record.type, record.duration);
    
    const newRecord: WorkoutRecord = {
      id: uuidv4(),
      date: record.date,
      type: record.type,
      duration: record.duration,
      calories,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      workoutRecords: [...state.workoutRecords, newRecord],
    }));

    db.add('workoutRecords', newRecord).catch(console.error);
  },

  addMealRecord: (record) => {
    const calories = record.calories ?? calculateMealCalories(record.foodName, record.portion);
    
    const newRecord: MealRecord = {
      id: uuidv4(),
      date: record.date,
      foodName: record.foodName,
      portion: record.portion,
      calories,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      mealRecords: [...state.mealRecords, newRecord],
    }));

    db.add('mealRecords', newRecord).catch(console.error);
  },

  generateWeeklyPlan: (weekStartDate: string) => {
    const { workoutRecords, userSettings } = get();
    
    const existingPlan = get().weeklyPlans.find(
      (p) => p.weekStartDate === weekStartDate
    );
    
    if (existingPlan) {
      return existingPlan;
    }

    const plan = generateWeeklyPlan(weekStartDate, userSettings.goal, workoutRecords);

    set((state) => ({
      weeklyPlans: [...state.weeklyPlans, plan],
    }));

    db.add('weeklyPlans', plan).catch(console.error);

    return plan;
  },

  updateUserSettings: (settings) => {
    set((state) => {
      const newSettings = { ...state.userSettings, ...settings };
      db.put('userSettings', newSettings).catch(console.error);
      return { userSettings: newSettings };
    });
  },

  getDailyTotalCalories: (date: string) => {
    const { workoutRecords, mealRecords } = get();
    
    const dayWorkouts = workoutRecords.filter((r) => r.date === date);
    const dayMeals = mealRecords.filter((r) => r.date === date);
    
    const burned = dayWorkouts.reduce((sum, r) => sum + r.calories, 0);
    const consumed = dayMeals.reduce((sum, r) => sum + r.calories, 0);
    const duration = dayWorkouts.reduce((sum, r) => sum + r.duration, 0);
    
    return { burned, consumed, duration };
  },

  getWeeklyStats: (weekStartDate: string) => {
    const weekDays = getWeekDays(weekStartDate);
    let totalBurned = 0;
    let totalConsumed = 0;
    let totalDuration = 0;
    
    weekDays.forEach((date) => {
      const daily = get().getDailyTotalCalories(date);
      totalBurned += daily.burned;
      totalConsumed += daily.consumed;
      totalDuration += daily.duration;
    });
    
    return {
      avgBurned: Math.round(totalBurned / 7),
      avgConsumed: Math.round(totalConsumed / 7),
      totalDuration,
    };
  },

  getWorkoutTypePreference: () => {
    const { workoutRecords } = get();
    const preference: Record<WorkoutType, number> = {
      running: 0,
      swimming: 0,
      cycling: 0,
      yoga: 0,
      strength: 0,
    };
    
    workoutRecords.forEach((record) => {
      preference[record.type]++;
    });
    
    return preference;
  },

  getDailyStats: (date: string): DailyStats => {
    const daily = get().getDailyTotalCalories(date);
    return {
      date,
      burnedCalories: daily.burned,
      consumedCalories: daily.consumed,
      workoutDuration: daily.duration,
    };
  },

  getTodayDuration: () => {
    const today = formatDate(new Date());
    return get().getDailyTotalCalories(today).duration;
  },

  getCurrentWeekPlan: () => {
    const weekStart = getWeekStartDate();
    return get().weeklyPlans.find((p) => p.weekStartDate === weekStart) || null;
  },
}));
