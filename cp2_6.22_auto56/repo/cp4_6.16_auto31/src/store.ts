import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';

export type Frequency = 'daily' | 'weekly';

export type BadgeLevel = 'bronze' | 'silver' | 'gold';

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  frequency: Frequency;
  reminder: string;
  createdAt: string;
}

export interface Checkin {
  date: string;
  habitId: string;
  completed: boolean;
}

export interface Badge {
  id: string;
  habitId: string;
  level: BadgeLevel;
  unlockedAt: string;
  streakDays: number;
}

export type CheckinsMap = Record<string, string[]>;

export interface HabitStore {
  habits: Habit[];
  checkins: CheckinsMap;
  badges: Badge[];
  showAchievement: Badge | null;

  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
  removeHabit: (habitId: string) => void;
  toggleCheckin: (habitId: string, date: string) => void;
  addBadge: (badge: Omit<Badge, 'id' | 'unlockedAt'>) => void;
  setShowAchievement: (badge: Badge | null) => void;
  loadFromStorage: () => Promise<void>;
  saveToStorage: () => Promise<void>;
  getStreakDays: (habitId: string) => number;
  getGlobalProgress: () => { completed: number; total: number; percentage: number };
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const STORAGE_KEYS = {
  HABITS: 'habit_tracker_habits',
  CHECKINS: 'habit_tracker_checkins',
  BADGES: 'habit_tracker_badges',
};

const getStreakDaysFromCheckins = (habitId: string, checkins: CheckinsMap): number => {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDate(date);

    const dayCheckins = checkins[dateStr] || [];
    if (dayCheckins.includes(habitId)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
};

export const useHabitStore = create<HabitStore>((set, get) => ({
  habits: [],
  checkins: {},
  badges: [],
  showAchievement: null,

  addHabit: (habitData) => {
    const newHabit: Habit = {
      ...habitData,
      id: generateId(),
      createdAt: formatDate(new Date()),
    };
    set((state) => ({
      habits: [...state.habits, newHabit],
    }));
    get().saveToStorage();
  },

  removeHabit: (habitId) => {
    set((state) => {
      const newCheckins: CheckinsMap = {};
      Object.keys(state.checkins).forEach((date) => {
        const habitIds = state.checkins[date].filter((id) => id !== habitId);
        if (habitIds.length > 0) {
          newCheckins[date] = habitIds;
        }
      });

      return {
        habits: state.habits.filter((h) => h.id !== habitId),
        checkins: newCheckins,
        badges: state.badges.filter((b) => b.habitId !== habitId),
      };
    });
    get().saveToStorage();
  },

  toggleCheckin: (habitId, date) => {
    set((state) => {
      const currentCheckins = state.checkins[date] || [];
      const isChecked = currentCheckins.includes(habitId);

      let newCheckinsForDate: string[];
      if (isChecked) {
        newCheckinsForDate = currentCheckins.filter((id) => id !== habitId);
      } else {
        newCheckinsForDate = [...currentCheckins, habitId];
      }

      const newCheckins = { ...state.checkins };
      if (newCheckinsForDate.length > 0) {
        newCheckins[date] = newCheckinsForDate;
      } else {
        delete newCheckins[date];
      }

      const streakDays = getStreakDaysFromCheckins(habitId, newCheckins);

      let newBadges = [...state.badges];
      let newShowAchievement = state.showAchievement;

      if (!isChecked) {
        const existingBadge = newBadges.find((b) => b.habitId === habitId);

        let newLevel: BadgeLevel | null = null;
        if (streakDays >= 30 && (!existingBadge || existingBadge.level !== 'gold')) {
          newLevel = 'gold';
        } else if (streakDays >= 14 && (!existingBadge || (existingBadge.level !== 'gold' && existingBadge.level !== 'silver'))) {
          newLevel = 'silver';
        } else if (streakDays >= 7 && !existingBadge) {
          newLevel = 'bronze';
        }

        if (newLevel) {
          const newBadge: Badge = {
            id: existingBadge?.id || generateId(),
            habitId,
            level: newLevel,
            unlockedAt: formatDate(new Date()),
            streakDays,
          };

          if (existingBadge) {
            newBadges = newBadges.map((b) => (b.id === existingBadge.id ? newBadge : b));
          } else {
            newBadges.push(newBadge);
          }

          newShowAchievement = newBadge;
        }
      }

      return {
        checkins: newCheckins,
        badges: newBadges,
        showAchievement: newShowAchievement,
      };
    });
    get().saveToStorage();
  },

  addBadge: (badgeData) => {
    const newBadge: Badge = {
      ...badgeData,
      id: generateId(),
      unlockedAt: formatDate(new Date()),
    };
    set((state) => ({
      badges: [...state.badges, newBadge],
    }));
    get().saveToStorage();
  },

  setShowAchievement: (badge) => {
    set({ showAchievement: badge });
  },

  loadFromStorage: async () => {
    try {
      const [habits, checkins, badges] = await Promise.all([
        idbGet(STORAGE_KEYS.HABITS) as unknown as Promise<Habit[] | undefined>,
        idbGet(STORAGE_KEYS.CHECKINS) as unknown as Promise<CheckinsMap | undefined>,
        idbGet(STORAGE_KEYS.BADGES) as unknown as Promise<Badge[] | undefined>,
      ]);

      set({
        habits: habits || [],
        checkins: checkins || {},
        badges: badges || [],
      });
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  saveToStorage: async () => {
    try {
      const state = get();
      await Promise.all([
        idbSet(STORAGE_KEYS.HABITS, state.habits),
        idbSet(STORAGE_KEYS.CHECKINS, state.checkins),
        idbSet(STORAGE_KEYS.BADGES, state.badges),
      ]);
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },

  getStreakDays: (habitId) => {
    const { checkins } = get();
    return getStreakDaysFromCheckins(habitId, checkins);
  },

  getGlobalProgress: () => {
    const { habits, checkins } = get();
    const today = formatDate(new Date());
    const todayCheckins = checkins[today] || [];
    const total = habits.length;
    const completed = todayCheckins.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    return { completed, total, percentage };
  },
}));
