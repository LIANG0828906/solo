import { create } from 'zustand';
import type { Habit, HabitRecord, HeatmapDataItem, StatsResponse } from '../types';

interface HabitsState {
  habits: Habit[];
  records: HabitRecord[];
  heatmapData: HeatmapDataItem[];
  stats: StatsResponse | null;
  loading: boolean;
  error: string | null;
  setHabits: (habits: Habit[]) => void;
  setRecords: (records: HabitRecord[]) => void;
  setHeatmapData: (data: HeatmapDataItem[]) => void;
  setStats: (stats: StatsResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  selectedHabits: string[];
  setSelectedHabits: (habits: string[]) => void;
  toggleRecord: (habitName: string, date: string) => void;
  addHabit: (habit: Habit) => void;
  deleteHabit: (name: string) => void;
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  records: [],
  heatmapData: [],
  stats: null,
  loading: false,
  error: null,
  selectedHabits: [],

  setHabits: (habits) => set({ habits }),
  setRecords: (records) => set({ records }),
  setHeatmapData: (heatmapData) => set({ heatmapData }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedHabits: (selectedHabits) => set({ selectedHabits }),

  toggleRecord: (habitName, date) =>
    set((state) => {
      const existingIndex = state.records.findIndex(
        (r) => r.habitName === habitName && r.date === date
      );
      if (existingIndex >= 0) {
        const newRecords = [...state.records];
        newRecords[existingIndex] = {
          ...newRecords[existingIndex],
          completed: !newRecords[existingIndex].completed,
        };
        return { records: newRecords };
      } else {
        return {
          records: [
            ...state.records,
            { habitName, date, completed: true, createdAt: new Date().toISOString() },
          ],
        };
      }
    }),

  addHabit: (habit) =>
    set((state) => ({
      habits: [...state.habits, habit],
    })),

  deleteHabit: (name) =>
    set((state) => ({
      habits: state.habits.filter((h) => h.name !== name),
      records: state.records.filter((r) => r.habitName !== name),
    })),
}));
