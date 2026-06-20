import { create } from 'zustand';
import { get, set, del, createStore, UseStore, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { format, subDays } from 'date-fns';
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
  formatDateKey,
} from '@/utils/calculations';
import { generateSuggestions } from '@/utils/suggestions';

const DB_NAME = 'carbon-tracker-db';
const DB_STORE = 'kv-store';
const DB_VERSION = 1;
const CACHE_TTL_MS = 5 * 60 * 1000;
const WRITE_RETRY_COUNT = 3;
const WRITE_RETRY_DELAY_MS = 1000;

interface CacheMeta {
  lastFetchAt: number;
  dataKey: string;
}

interface WriteQueueItem {
  id: string;
  key: IDBKey;
  value: unknown;
  resolve: (value: boolean) => void;
  reject: (reason: Error) => void;
  previousValue: unknown;
  createdAt: number;
  retries: number;
}

interface CarbonStoreState {
  activities: Activity[];
  userSettings: UserSettings;
  achievements: Achievement[];
  currentSuggestions: Suggestion[];
  dismissedSuggestionIds: Set<string>;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  cacheMeta: Record<string, CacheMeta>;
  writeQueue: WriteQueueItem[];
  isProcessingQueue: boolean;

  dailyTrend: DailyEmission[];
  todayEmission: number;
  monthEmission: number;
  targetProgress: number;
  leaderboard: LeaderboardItem[];

  initStore: () => Promise<void>;
  refreshFromIDB: (force?: boolean) => Promise<boolean>;
  invalidateCache: (dataKey?: string) => void;

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

  getQueueSize: () => number;
}

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
  const store = getIdbStore();
  await set(key, value, store);
};

const safeIdbDel = async (key: string): Promise<void> => {
  const store = getIdbStore();
  await del(key, store);
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = WRITE_RETRY_COUNT,
  delayMs = WRITE_RETRY_DELAY_MS,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(
        `[IndexedDB] Write attempt ${attempt + 1}/${retries + 1} failed:`,
        err,
      );
      if (attempt < retries) {
        await sleep(delayMs * Math.pow(2, attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Unknown write failure after retries');
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

  let progress: number;
  if (settings.monthlyTarget <= 0 || !isFinite(settings.monthlyTarget)) {
    progress = 100;
  } else {
    progress = calculateTargetProgress(monthEm, settings.monthlyTarget);
  }

  const lb = getTopEmittingSubtypes(activities, 20);

  return {
    dailyTrend: daily,
    todayEmission: Math.round(todayEm * 100) / 100,
    monthEmission: Math.round(monthEm * 100) / 100,
    targetProgress: isFinite(progress) ? progress : 100,
    leaderboard: lb,
  };
};

export const useCarbonStore = create<CarbonStoreState>((set, get) => {
  const processQueue = async () => {
    const state = get();
    if (state.isProcessingQueue || state.writeQueue.length === 0) return;

    set({ isProcessingQueue: true });

    let continueProcessing = true;
    while (continueProcessing) {
      const currentQueue = get().writeQueue;
      if (currentQueue.length === 0) {
        continueProcessing = false;
        break;
      }
      const item = currentQueue[0];
      try {
        await retryWithBackoff(() => safeIdbSet(item.key, item.value));
        set((s) => ({
          writeQueue: s.writeQueue.slice(1),
        }));
        item.resolve(true);
      } catch (err) {
        console.error(
          `[WriteQueue] Failed to write key="${item.key}" after ${WRITE_RETRY_COUNT + 1} attempts, rolling back...`,
        );
        set((s) => ({
          writeQueue: s.writeQueue.slice(1),
          error: `数据保存失败: ${item.key}，已回滚`,
        }));

        if (item.key === 'activities' && Array.isArray(item.previousValue)) {
          const prevActivities = item.previousValue as Activity[];
          const prevDerived = recomputeDerived(
            prevActivities,
            get().userSettings,
          );
          const newSuggestions = generateSuggestions(
            prevActivities,
            get().dismissedSuggestionIds,
            3,
          );
          set({
            activities: prevActivities,
            currentSuggestions: newSuggestions,
            ...prevDerived,
          });
        } else if (
          item.key === 'userSettings' &&
          item.previousValue &&
          typeof item.previousValue === 'object'
        ) {
          const prevSettings = item.previousValue as UserSettings;
          const prevDerived = recomputeDerived(
            get().activities,
            prevSettings,
          );
          set({
            userSettings: prevSettings,
            ...prevDerived,
          });
        }

        item.reject(
          err instanceof Error ? err : new Error('Write failed after retries'),
        );
      }
    }

    set({ isProcessingQueue: false });
  };

  const enqueueWrite = <T>(
    key: IDBKey,
    value: T,
    previousValue: T,
  ): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      const item: WriteQueueItem = {
        id: uuidv4(),
        key,
        value,
        previousValue,
        resolve,
        reject,
        createdAt: Date.now(),
        retries: 0,
      };

      set((s) => ({
        writeQueue: [...s.writeQueue, item],
      }));

      setTimeout(() => processQueue(), 0);
    });
  };

  return {
    activities: [],
    userSettings: createDefaultSettings(),
    achievements: [],
    currentSuggestions: [],
    dismissedSuggestionIds: new Set<string>(),
    isHydrated: false,
    isLoading: true,
    error: null,
    cacheMeta: {},
    writeQueue: [],
    isProcessingQueue: false,

    dailyTrend: [],
    todayEmission: 0,
    monthEmission: 0,
    targetProgress: 100,
    leaderboard: [],

    initStore: async () => {
      try {
        set({ isLoading: true, error: null });

        const [activities, settings, achievements, dismissedIds] =
          await Promise.all([
            safeIdbGet<Activity[]>('activities', []),
            safeIdbGet<UserSettings | null>('userSettings', null),
            safeIdbGet<Achievement[]>('achievements', []),
            safeIdbGet<string[]>('dismissedSuggestions', []),
          ]);

        const finalSettings = settings || createDefaultSettings();
        if (!settings) {
          try {
            await safeIdbSet('userSettings', finalSettings);
          } catch (err) {
            console.warn('[Store] Failed to save default settings:', err);
          }
        }

        const derived = recomputeDerived(activities, finalSettings);
        const suggestions = generateSuggestions(
          activities,
          new Set(dismissedIds),
          3,
        );

        const now = Date.now();
        const newCacheMeta: Record<string, CacheMeta> = {
          activities: { lastFetchAt: now, dataKey: 'activities' },
          userSettings: { lastFetchAt: now, dataKey: 'userSettings' },
          achievements: { lastFetchAt: now, dataKey: 'achievements' },
          dismissedSuggestions: {
            lastFetchAt: now,
            dataKey: 'dismissedSuggestions',
          },
        };

        set({
          activities,
          userSettings: finalSettings,
          achievements,
          dismissedSuggestionIds: new Set(dismissedIds),
          currentSuggestions: suggestions,
          isHydrated: true,
          isLoading: false,
          cacheMeta: newCacheMeta,
          ...derived,
        });

        console.info('[Store] Initialization complete', {
          activities: activities.length,
          achievements: achievements.length,
          queue: 0,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : '数据加载失败';
        const defaultSettings = createDefaultSettings();
        set({
          error: message,
          isLoading: false,
          isHydrated: true,
          userSettings: defaultSettings,
          activities: [],
          achievements: [],
          dismissedSuggestionIds: new Set(),
          currentSuggestions: generateSuggestions([], new Set(), 3),
          ...recomputeDerived([], defaultSettings),
        });
        console.error('[Store] Init error:', err);
      }
    },

    refreshFromIDB: async (force = false) => {
      const { cacheMeta, isHydrated } = get();
      const now = Date.now();

      if (isHydrated && !force) {
        const allFresh = ['activities', 'userSettings', 'achievements'].every(
          (k) => {
            const meta = cacheMeta[k];
            return meta && now - meta.lastFetchAt < CACHE_TTL_MS;
          },
        );
        if (allFresh) {
          console.debug('[Store] Cache fresh, skip refresh');
          return false;
        }
      }

      try {
        const [activities, settings, achievements, dismissedIds] =
          await Promise.all([
            safeIdbGet<Activity[]>('activities', []),
            safeIdbGet<UserSettings | null>('userSettings', null),
            safeIdbGet<Achievement[]>('achievements', []),
            safeIdbGet<string[]>('dismissedSuggestions', []),
          ]);

        const finalSettings = settings || createDefaultSettings();
        const derived = recomputeDerived(activities, finalSettings);
        const suggestions = generateSuggestions(
          activities,
          new Set(dismissedIds),
          3,
        );

        const newMeta = { ...cacheMeta };
        newMeta.activities = { lastFetchAt: now, dataKey: 'activities' };
        newMeta.userSettings = { lastFetchAt: now, dataKey: 'userSettings' };
        newMeta.achievements = { lastFetchAt: now, dataKey: 'achievements' };
        newMeta.dismissedSuggestions = {
          lastFetchAt: now,
          dataKey: 'dismissedSuggestions',
        };

        set({
          activities,
          userSettings: finalSettings,
          achievements,
          dismissedSuggestionIds: new Set(dismissedIds),
          currentSuggestions: suggestions,
          cacheMeta: newMeta,
          ...derived,
        });

        return true;
      } catch (err) {
        console.error('[Store] Refresh failed:', err);
        return false;
      }
    },

    invalidateCache: (dataKey) => {
      if (!dataKey) {
        set({ cacheMeta: {} });
        return;
      }
      set((s) => ({
        cacheMeta: {
          ...s.cacheMeta,
          [dataKey]: { ...s.cacheMeta[dataKey], lastFetchAt: 0 },
        },
      }));
    },

    addActivity: async (type, subtype, value, date) => {
      try {
        const { activities, userSettings, dismissedSuggestionIds } = get();
        const factor = getFactor(type, subtype);
        if (!factor) {
          throw new Error('未知的活动类型');
        }

        const emission = calculateEmission(type, subtype, value);

        const newActivity: Activity = {
          id: uuidv4(),
          type,
          subtype,
          value,
          emission,
          date: formatDateKey(date),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updatedActivities = [newActivity, ...activities];

        const previousActivities = [...activities];

        const derived = recomputeDerived(updatedActivities, userSettings);
        const suggestions = generateSuggestions(
          updatedActivities,
          dismissedSuggestionIds,
          3,
        );

        set({
          activities: updatedActivities,
          currentSuggestions: suggestions,
          ...derived,
        });

        const ok = await enqueueWrite<Activity[]>(
          'activities',
          updatedActivities,
          previousActivities,
        );

        if (!ok) {
          return null;
        }

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
        const { activities, userSettings, dismissedSuggestionIds } = get();
        const idx = activities.findIndex((a) => a.id === id);
        if (idx === -1) {
          throw new Error('记录不存在');
        }

        const factor = getFactor(type, subtype);
        if (!factor) {
          throw new Error('未知的活动类型');
        }

        const emission = calculateEmission(type, subtype, value);

        const previousActivities = [...activities];

        const updated: Activity = {
          ...activities[idx],
          type,
          subtype,
          value,
          emission,
          date: formatDateKey(date),
          updatedAt: new Date().toISOString(),
        };

        const updatedActivities = [...activities];
        updatedActivities[idx] = updated;

        const derived = recomputeDerived(updatedActivities, userSettings);
        const suggestions = generateSuggestions(
          updatedActivities,
          dismissedSuggestionIds,
          3,
        );

        set({
          activities: updatedActivities,
          currentSuggestions: suggestions,
          ...derived,
        });

        const ok = await enqueueWrite<Activity[]>(
          'activities',
          updatedActivities,
          previousActivities,
        );

        return ok ? updated : null;
      } catch (err) {
        const message = err instanceof Error ? err.message : '更新记录失败';
        set({ error: message });
        console.error('[Store] Update activity error:', err);
        return null;
      }
    },

    deleteActivity: async (id) => {
      try {
        const { activities, userSettings, dismissedSuggestionIds } = get();
        const previousActivities = [...activities];
        const updatedActivities = activities.filter((a) => a.id !== id);

        const derived = recomputeDerived(updatedActivities, userSettings);
        const suggestions = generateSuggestions(
          updatedActivities,
          dismissedSuggestionIds,
          3,
        );

        set({
          activities: updatedActivities,
          currentSuggestions: suggestions,
          ...derived,
        });

        const ok = await enqueueWrite<Activity[]>(
          'activities',
          updatedActivities,
          previousActivities,
        );

        return ok;
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
        const prevSettings = { ...userSettings };

        const updated: UserSettings = {
          ...userSettings,
          monthlyTarget: target,
          updatedAt: new Date().toISOString(),
        };

        const derived = recomputeDerived(activities, updated);

        set({
          userSettings: updated,
          ...derived,
        });

        await enqueueWrite<UserSettings>('userSettings', updated, prevSettings);
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

      const dismissedArr = Array.from(newDismissed);

      safeIdbSet('dismissedSuggestions', dismissedArr).catch((err) => {
        console.error('[Store] Dismiss save error:', err);
      });

      set({
        dismissedSuggestionIds: newDismissed,
        currentSuggestions: currentSuggestions.filter((s) => s.id !== id),
      });
    },

    adoptSuggestion: (id) => {
      const {
        currentSuggestions,
        achievements,
        dismissedSuggestionIds,
      } = get();
      const suggestion = currentSuggestions.find((s) => s.id === id);

      if (!suggestion) return;

      const templateId = suggestion.id.includes('-')
        ? suggestion.id.split('-').slice(0, -1).join('-')
        : suggestion.id;

      const newAchievement: Achievement = {
        id: uuidv4(),
        suggestionId: suggestion.id,
        suggestionTemplateId: templateId,
        title: suggestion.title,
        description: suggestion.description,
        activityType: suggestion.activityType,
        relatedSubtype: suggestion.relatedSubtype,
        adoptedAt: new Date().toISOString(),
        potentialSaving: suggestion.potentialSaving,
      };

      const updatedAchievements = [newAchievement, ...achievements];
      const newDismissed = new Set(dismissedSuggestionIds);
      newDismissed.add(id);
      const dismissedArr = Array.from(newDismissed);

      Promise.all([
        safeIdbSet('achievements', updatedAchievements),
        safeIdbSet('dismissedSuggestions', dismissedArr),
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
        const keysToClear: IDBKey[] = [
          'activities',
          'userSettings',
          'achievements',
          'dismissedSuggestions',
        ];
        await Promise.all(keysToClear.map((k) => safeIdbDel(k)));

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
          writeQueue: [],
          cacheMeta: {},
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
          const date = subDays(now, d);
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
          return (
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        });

        await safeIdbSet('activities', mockActivities);
        await safeIdbDel('dismissedSuggestions');
        await safeIdbDel('achievements');

        const derived = recomputeDerived(mockActivities, userSettings);
        const suggestions = generateSuggestions(
          mockActivities,
          new Set(),
          3,
        );

        set({
          activities: mockActivities,
          achievements: [],
          dismissedSuggestionIds: new Set(),
          currentSuggestions: suggestions,
          isLoading: false,
          ...derived,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '加载示例数据失败';
        set({ error: message, isLoading: false });
        console.error('[Store] Load mock error:', err);
      }
    },

    getQueueSize: () => get().writeQueue.length,
  };
});

export default useCarbonStore;
