import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addWeeks,
  subWeeks,
  isSameWeek,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { setShiftsStoreRef } from './workers';

export type ShiftType = 'morning' | 'evening' | 'night';

export interface ShiftAssignment {
  [date: string]: {
    [shift in ShiftType]?: string[];
  };
}

export const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: '早班',
  evening: '晚班',
  night: '夜班',
};

export const SHIFT_HOURS: Record<ShiftType, string> = {
  morning: '08:00 - 16:00',
  evening: '16:00 - 00:00',
  night: '00:00 - 08:00',
};

export const SHIFT_COLORS: Record<ShiftType, string> = {
  morning: 'linear-gradient(135deg, #f0e68c 0%, #daa520 100%)',
  evening: 'linear-gradient(135deg, #cd853f 0%, #8b4513 100%)',
  night: 'linear-gradient(135deg, #4a4a6a 0%, #1a1a3a 100%)',
};

interface ShiftsState {
  assignments: ShiftAssignment;
  currentWeekStart: Date;
  conflictInfo: { date: string; shift: ShiftType } | null;
  setCurrentWeek: (date: Date) => void;
  nextWeek: () => void;
  prevWeek: () => void;
  getWeekDays: () => Date[];
  assignWorker: (date: string, shift: ShiftType, workerId: string) => boolean;
  removeWorker: (date: string, shift: ShiftType, workerId: string) => void;
  moveWorker: (
    fromDate: string,
    fromShift: ShiftType,
    workerId: string,
    toDate: string,
    toShift: ShiftType
  ) => { success: boolean; conflict: boolean };
  hasConflict: (date: string, shift: ShiftType, workerId: string) => boolean;
  setConflict: (info: { date: string; shift: ShiftType } | null) => void;
  exportWeekJSON: () => string;
  getWorkersForShift: (date: string, shift: ShiftType) => string[];
}

const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

const serializeDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const useShiftsStore = create<ShiftsState>()(
  persist(
    (set, get) => ({
      assignments: {},
      currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
      conflictInfo: null,

      setCurrentWeek: (date) =>
        set({ currentWeekStart: startOfWeek(date, { weekStartsOn: 1 }) }),

      nextWeek: () =>
        set((state) => ({
          currentWeekStart: addWeeks(state.currentWeekStart, 1),
        })),

      prevWeek: () =>
        set((state) => ({
          currentWeekStart: subWeeks(state.currentWeekStart, 1),
        })),

      getWeekDays: () => {
        const start = get().currentWeekStart;
        return eachDayOfInterval({
          start,
          end: endOfWeek(start, { weekStartsOn: 1 }),
        });
      },

      assignWorker: (date, shift, workerId) => {
        const state = get();
        if (state.hasConflict(date, shift, workerId)) {
          return false;
        }
        set((state) => ({
          assignments: {
            ...state.assignments,
            [date]: {
              ...state.assignments[date],
              [shift]: [
                ...(state.assignments[date]?.[shift] || []),
                workerId,
              ],
            },
          },
        }));
        return true;
      },

      removeWorker: (date, shift, workerId) =>
        set((state) => ({
          assignments: {
            ...state.assignments,
            [date]: {
              ...state.assignments[date],
              [shift]: (state.assignments[date]?.[shift] || []).filter(
                (id) => id !== workerId
              ),
            },
          },
        })),

      moveWorker: (fromDate, fromShift, workerId, toDate, toShift) => {
        const state = get();
        if (state.hasConflict(toDate, toShift, workerId)) {
          return { success: false, conflict: true };
        }

        set((state) => {
          const newAssignments = { ...state.assignments };
          if (newAssignments[fromDate]?.[fromShift]) {
            newAssignments[fromDate] = {
              ...newAssignments[fromDate],
              [fromShift]: newAssignments[fromDate][fromShift]!.filter(
                (id) => id !== workerId
              ),
            };
          }
          if (!newAssignments[toDate]) {
            newAssignments[toDate] = {};
          }
          newAssignments[toDate] = {
            ...newAssignments[toDate],
            [toShift]: [...(newAssignments[toDate][toShift] || []), workerId],
          };
          return { assignments: newAssignments };
        });

        return { success: true, conflict: false };
      },

      hasConflict: (date, shift, workerId) => {
        const state = get();
        const dayAssignments = state.assignments[date] || {};
        for (const s of Object.keys(dayAssignments) as ShiftType[]) {
          if (s !== shift && dayAssignments[s]?.includes(workerId)) {
            return true;
          }
        }
        return false;
      },

      setConflict: (info) => set({ conflictInfo: info }),

      exportWeekJSON: () => {
        const state = get();
        const weekDays = state.getWeekDays();
        const weekData: any = {
          exportedAt: new Date().toISOString(),
          weekRange: {
            start: serializeDate(weekDays[0]),
            end: serializeDate(weekDays[6]),
          },
          shifts: {} as any,
        };

        weekDays.forEach((day) => {
          const dateKey = serializeDate(day);
          weekData.shifts[dateKey] = state.assignments[dateKey] || {};
        });

        return JSON.stringify(weekData, null, 2);
      },

      getWorkersForShift: (date, shift) => {
        return get().assignments[date]?.[shift] || [];
      },
    }),
    {
      name: 'fantasy-tavern-shifts',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

setShiftsStoreRef(useShiftsStore);

export { serializeDate };
export { isSameWeek };
