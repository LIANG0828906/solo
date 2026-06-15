import { create } from 'zustand';
import { get, set, del, createStore, UseStore } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type {
  Activity,
  UserSettings,
  Suggestion,
  Achievement,
  DailyEmission,
  LeaderboardItem,
  ActivityType,
  IDBKey,
} from '@/types';
import { calculateEmission, getFactor } from '@/constants/emissionFactors';
import {
  aggregateDailyEmissions,
  getTodayEmission,
  getMonthEmission,
  getTopEmittingSubtypes,
  calculateTargetProgress,
} from '@/utils/calculations';
import { generateSuggestions } from '@/utils/suggestions';

interface CarbonStoreState {
  activities: Activity[];
  userSettings: UserSettings;
  achievements: Achievement[];
  currentSuggestions: Suggestion[];
  dismissedSuggestionIds: Set<string>;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;

  dailyTrend: DailyEmission[];
  todayEmission: number;
  monthEmission: number;
  targetProgress: number;
  leaderboard: LeaderboardItem[];

  initStore: () => Promise<void>;

  addActivity: (
    type: ActivityType,
    subtype: string,
    value: number,
    date: string,
  ) => Promise<Activity | null>;

  updateActivity: (
    id: string,
    type: ActivityType,
    subtype: string,
    value: number,
    date: string,
  ) => Promise<Activity | null>;

  deleteActivity: (id: string) => Promise<boolean>;

  setMonthlyTarget: (target: number) => Promise<void>;

  regenerateSuggestions: () => void;
  dismissSuggestion: (id: string) => void;
  adoptSuggestion: (id: string) => void;

  clearAllData: () => Promise<void>;
  loadMockData: () => Promise<void>;
}

const DB_NAME = 'carbon-tracker-db';
const DB_STORE = 'kv-store';
const DB_VERSION = 1;

let idbStore: UseStore | null = null;

const getIdbStore = (): UseStore => {
  if (!idbStore) {
    idbStore = createStore(DB_NAME, DB_STORE);
  }
  return idbStore;
};

const safeIdbGet = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const store = getIdbStore();
    const result = await get<T>(key, store);
    if (result === undefined || result === null) {
      return defaultValue;
    }
    return result;
  } catch (err) {
    console.error(`[IndexedDB] Get failed for key "${key}":`, err);
    return defaultValue;
  }
};

const safeIdbSet = async (key: string, value: unknown): Promise<void> => {
  try {
    const store = getIdbStore();
    await set(key, value, store);
  } catch (err) {
    console.error(`[IndexedDB] Set failed for key "${key}":`, err);
    throw err;
  }
};

const safeIdbDel = async (key: string): Promise<void> => {
  try {
    const store = getIdbStore();
    await del(key, store);
  } catch (err) {
    console.error(`[IndexedDB] Del failed for key "${key}":`, err);
    throw err;
  }
};

const createDefaultSettings = (): UserSettings => ({
  id: uuidv4(),
  monthlyTarget: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const recomputeDerived = (activities: Activity[], settings: UserSettings) => {
  const daily = aggregateDailyEmissions(activities, 30);
  const todayEm = getTodayEmission(activities);
  const monthEm = getMonthEmission(activities);
  const progress = calculateTargetProgress(monthEm, settings.monthlyTarget);
  const lb = getTopEmittingSubtypes(activities, 20);

  return {
    dailyTrend: daily,
    todayEmission: Math.round(todayEm * 100) / 100,
    monthEmission: Math.round(monthEm * 100) / 100,
    targetProgress: progress,
    leaderboard: lb,
  };
};

export const useCarbonStore = create<CarbonStoreState>((set, get) => ({
  activities: [],
  userSettings: createDefaultSettings(),
  achievements: [],
  currentSuggestions: [],
  dismissedSuggestionIds: new Set<string>(),
  isHydrated: false,
  isLoading: true,
  error: null,

  dailyTrend: [],
  todayEmission: 0,
  monthEmission: 0,
  targetProgress: 0,
  leaderboard: [],

  initStore: async () => {
    try {
      set({ isLoading: true, error: null });

      const [activities, settings, achievements, dismissedIds] = await Promise.all([
        safeIdbGet<Activity[]>('activities', []),
        safeIdbGet<UserSettings | null>('userSettings', null),
        safeIdbGet<Achievement[]>('achievements', []),
        safeIdbGet<string[]>('dismissedSuggestions', []),
      ]);

      const finalSettings = settings || createDefaultSettings();
      if (!settings) {
        await safeIdbSet('userSettings', finalSettings);
      }

      const derived = recomputeDerived(activities, finalSettings);
      const suggestions = generateSuggestions(
        activities,
        new Set(dismissedIds),
        3,
      );

      set({
        activities,
        userSettings: finalSettings,
        achievements,
        dismissedSuggestionIds: new Set(dismissedIds),
        currentSuggestions: suggestions,
        isHydrated: true,
        isLoading: false,
        ...derived,
      });

      console.info('[Store] Initialization complete', {
        activities: activities.length,
        achievements: achievements.length,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '数据加载失败';
      set({
        error: message,
        isLoading: false,
        isHydrated: true,
      });
      console.error('[Store] Init error:', err);
    }
  },

  addActivity: async (type, subtype, value, date) => {
    try {
      const { activities, userSettings } = get();
      const emission = calculateEmission(type, subtype, value);
      const factor = getFactor(type, subtype);
      if (!factor) {
        throw new Error('未知的活动类型');
      }

      const newActivity: Activity = {
        id: uuidv4(),
        type,
        subtype,
        value,
        emission,
        date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedActivities = [newActivity, ...activities];
      await safeIdbSet('activities', updatedActivities);

      const derived = recomputeDerived(updatedActivities, userSettings);
      const suggestions = generateSuggestions(
        updatedActivities,
        get().dismissedSuggestionIds,
        3,
      );

      set({
        activities: updatedActivities,
        currentSuggestions: suggestions,
        ...derived,
      });

      return newActivity;
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加记录失败';
      set({ error: message });
      console.error('[Store] Add activity error:', err);
      return null;
    }
  },

  updateActivity: async (id, type, subtype, value, date) => {
    try {
      const { activities, userSettings } = get();
      const idx = activities.findIndex((a) => a.id === id);
      if (idx === -1) {
        throw new Error('记录不存在');
      }

      const emission = calculateEmission(type, subtype, value);
      const factor = getFactor(type, subtype);
      if (!factor) {
        throw new Error('未知的活动类型');
      }

      const updated: Activity = {
        ...activities[idx],
        type,
        subtype,
        value,
        emission,
        date,
        updatedAt: new Date().toISOString(),
      };

      const updatedActivities = [...activities];
      updatedActivities[idx] = updated;

      await safeIdbSet('activities', updatedActivities);

      const derived = recomputeDerived(updatedActivities, userSettings);
      const suggestions = generateSuggestions(
        updatedActivities,
        get().dismissedSuggestionIds,
        3,
      );

      set({
        activities: updatedActivities,
        currentSuggestions: suggestions,
        ...derived,
      });

      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新记录失败';
      set({ error: message });
      console.error('[Store] Update activity error:', err);
      return null;
    }
  },

  deleteActivity: async (id) => {
    try {
      const { activities, userSettings } = get();
      const updatedActivities = activities.filter((a) => a.id !== id);

      await safeIdbSet('activities', updatedActivities);

      const derived = recomputeDerived(updatedActivities, userSettings);
      const suggestions = generateSuggestions(
        updatedActivities,
        get().dismissedSuggestionIds,
        3,
      );

      set({
        activities: updatedActivities,
        currentSuggestions: suggestions,
        ...derived,
      });

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除记录失败';
      set({ error: message });
      console.error('[Store] Delete activity error:', err);
      return false;
    }
  },

  setMonthlyTarget: async (target) => {
    try {
      const { userSettings, activities } = get();
      const updated: UserSettings = {
        ...userSettings,
        monthlyTarget: target,
        updatedAt: new Date().toISOString(),
      };

      await safeIdbSet('userSettings', updated);
      const derived = recomputeDerived(activities, updated);

      set({
        userSettings: updated,
        ...derived,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存设置失败';
      set({ error: message });
      console.error('[Store] Set target error:', err);
    }
  },

  regenerateSuggestions: () => {
    const { activities, dismissedSuggestionIds } = get();
    const suggestions = generateSuggestions(
      activities,
      dismissedSuggestionIds,
      3,
    );
    set({ currentSuggestions: suggestions });
  },

  dismissSuggestion: (id) => {
    const { dismissedSuggestionIds, currentSuggestions } = get();
    const newDismissed = new Set(dismissedSuggestionIds);
    newDismissed.add(id);

    safeIdbSet('dismissedSuggestions', Array.from(newDismissed)).catch(
      (err) => {
        console.error('[Store] Dismiss save error:', err);
      },
    );

    set({
      dismissedSuggestionIds: newDismissed,
      currentSuggestions: currentSuggestions.filter((s) => s.id !== id),
    });
  },

  adoptSuggestion: (id) => {
    const { currentSuggestions, achievements, dismissedSuggestionIds } = get();
    const suggestion = currentSuggestions.find((s) => s.id === id);

    if (!suggestion) return;

    const newAchievement: Achievement = {
      id: uuidv4(),
      suggestionId: suggestion.id,
      title: suggestion.title,
      adoptedAt: new Date().toISOString(),
      potentialSaving: suggestion.potentialSaving,
    };

    const updatedAchievements = [newAchievement, ...achievements];
    const newDismissed = new Set(dismissedSuggestionIds);
    newDismissed.add(id);

    Promise.all([
      safeIdbSet('achievements', updatedAchievements),
      safeIdbSet('dismissedSuggestions', Array.from(newDismissed)),
    ]).catch((err) => {
      console.error('[Store] Adopt save error:', err);
    });

    set({
      achievements: updatedAchievements,
      dismissedSuggestionIds: newDismissed,
      currentSuggestions: currentSuggestions.filter((s) => s.id !== id),
    });
  },

  clearAllData: async () => {
    try {
      const keys: IDBKey[] = [
        'activities',
        'userSettings',
        'achievements',
        'dismissedSuggestions',
      ];
      await Promise.all(keys.map((k) => safeIdbDel(k)));

      const defaultSettings = createDefaultSettings();
      await safeIdbSet('userSettings', defaultSettings);

      const derived = recomputeDerived([], defaultSettings);

      set({
        activities: [],
        userSettings: defaultSettings,
        achievements: [],
        dismissedSuggestionIds: new Set(),
        currentSuggestions: generateSuggestions([], new Set(), 3),
        error: null,
        ...derived,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '清除数据失败';
      set({ error: message });
      console.error('[Store] Clear data error:', err);
    }
  },

  loadMockData: async () => {
    try {
      set({ isLoading: true });
      const { userSettings } = get();

      const types: Array<{
        type: ActivityType;
        subtype: string;
        valueRange: [number, number];
      }> = [
        { type: 'transport', subtype: 'car', valueRange: [5, 40] },
        { type: 'transport', subtype: 'subway', valueRange: [5, 25] },
        { type: 'transport', subtype: 'bus', valueRange: [3, 15] },
        { type: 'transport', subtype: 'bike', valueRange: [1, 10] },
        { type: 'transport', subtype: 'walk', valueRange: [0.5, 5] },
        { type: 'diet', subtype: 'vegetarian', valueRange: [1, 2] },
        { type: 'diet', subtype: 'mixed', valueRange: [1, 3] },
        { type: 'diet', subtype: 'meat', valueRange: [1, 2] },
        { type: 'electricity', subtype: 'ac', valueRange: [1, 6] },
        { type: 'electricity', subtype: 'computer', valueRange: [2, 8] },
        { type: 'electricity', subtype: 'light', valueRange: [2, 6] },
      ];

      const mockActivities: Activity[] = [];
      const now = new Date();

      for (let d = 29; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        const recordsPerDay = 4 + Math.floor(Math.random() * 5);

        for (let i = 0; i < recordsPerDay; i++) {
          const tpl = types[Math.floor(Math.random() * types.length)];
          const value = Number(
            (
              tpl.valueRange[0] +
              Math.random() * (tpl.valueRange[1] - tpl.valueRange[0])
            ).toFixed(1),
          );
          const emission = calculateEmission(tpl.type, tpl.subtype, value);

          mockActivities.push({
            id: uuidv4(),
            type: tpl.type,
            subtype: tpl.subtype,
            value,
            emission,
            date: format(date, 'yyyy-MM-dd'),
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
          });
        }
      }

      mockActivities.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      await safeIdbSet('activities', mockActivities);
      await safeIdbDel('dismissedSuggestions');
      await safeIdbDel('achievements');

      const derived = recomputeDerived(mockActivities, userSettings);
      const suggestions = generateSuggestions(mockActivities, new Set(), 3);

      set({
        activities: mockActivities,
        achievements: [],
        dismissedSuggestionIds: new Set(),
        currentSuggestions: suggestions,
        isLoading: false,
        ...derived,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载示例数据失败';
      set({ error: message, isLoading: false });
      console.error('[Store] Load mock error:', err);
    }
  },
}));

export default useCarbonStore;
