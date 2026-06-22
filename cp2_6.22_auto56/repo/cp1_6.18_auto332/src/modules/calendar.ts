import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO, isValid } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { loadSnapshots, saveSnapshots } from './storage';
import type { PixelGrid } from './pixelGrid';

export interface MoodSnapshot {
  id: string;
  date: string;
  grid: PixelGrid;
  text: string;
  createdAt: string;
}

interface CalendarState {
  currentMonth: Date;
  selectedDate: Date | null;
  snapshots: Record<string, MoodSnapshot[]>;
  setCurrentMonth: (date: Date) => void;
  setSelectedDate: (date: Date | null) => void;
  addSnapshot: (date: string, grid: PixelGrid, text: string) => void;
  getSnapshotsForDate: (date: string) => MoodSnapshot[];
  navigateMonth: (direction: 1 | -1) => void;
  searchDate: (dateStr: string) => boolean;
  initFromStorage: () => void;
}

export { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, parseISO, isValid };

export function getCalendarDays(year: number, month: number): (Date | null)[] {
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(new Date(year, month));
  const days = eachDayOfInterval({ start, end });
  const firstDayOfWeek = getDay(start);
  const padded: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    padded.push(null);
  }
  for (const d of days) {
    padded.push(d);
  }
  while (padded.length % 7 !== 0) {
    padded.push(null);
  }
  return padded;
}

import { create } from 'zustand';

export const useCalendar = create<CalendarState>((set, get) => ({
  currentMonth: new Date(),
  selectedDate: null,
  snapshots: {},

  setCurrentMonth: (date) => set({ currentMonth: date }),
  setSelectedDate: (date) => set({ selectedDate: date }),

  addSnapshot: (date, grid, text) => {
    const snapshot: MoodSnapshot = {
      id: uuidv4(),
      date,
      grid,
      text,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const existing = state.snapshots[date] || [];
      const updated = { ...state.snapshots, [date]: [...existing, snapshot] };
      saveSnapshots(updated);
      return { snapshots: updated };
    });
  },

  getSnapshotsForDate: (date) => {
    return get().snapshots[date] || [];
  },

  navigateMonth: (direction) => {
    set((state) => ({
      currentMonth: direction === 1 ? addMonths(state.currentMonth, 1) : subMonths(state.currentMonth, 1),
    }));
  },

  searchDate: (dateStr) => {
    const parsed = parseISO(dateStr);
    if (!isValid(parsed)) return false;
    set({
      currentMonth: parsed,
      selectedDate: parsed,
    });
    return true;
  },

  initFromStorage: () => {
    const data = loadSnapshots();
    if (data) {
      set({ snapshots: data });
    }
  },
}));
