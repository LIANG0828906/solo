import { create } from 'zustand';
import { Draft, ScheduleMap, ScheduledItemWithDraft, Toast } from './types';

interface CalendarState {
  drafts: Draft[];
  schedule: ScheduleMap;
  currentMonth: Date;
  draggingDraft: Draft | null;
  toasts: Toast[];
  loading: boolean;
  conflictDate: string | null;

  setDrafts: (drafts: Draft[]) => void;
  addDraft: (draft: Draft) => void;
  updateDraft: (draft: Draft) => void;
  removeDraft: (id: string) => void;

  setSchedule: (schedule: ScheduleMap) => void;
  addScheduleItem: (date: string, item: ScheduledItemWithDraft) => void;
  removeScheduleItem: (date: string, scheduleId: string) => void;

  setCurrentMonth: (date: Date) => void;
  setDraggingDraft: (draft: Draft | null) => void;

  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;

  setConflictDate: (date: string | null) => void;
  setLoading: (loading: boolean) => void;
}

let toastCounter = 0;

export const useCalendarStore = create<CalendarState>((set, get) => ({
  drafts: [],
  schedule: {},
  currentMonth: new Date(),
  draggingDraft: null,
  toasts: [],
  loading: false,
  conflictDate: null,

  setDrafts: (drafts) => set({ drafts }),
  addDraft: (draft) => set((state) => ({ drafts: [draft, ...state.drafts] })),
  updateDraft: (draft) =>
    set((state) => ({
      drafts: state.drafts.map((d) => (d.id === draft.id ? draft : d))
    })),
  removeDraft: (id) =>
    set((state) => ({
      drafts: state.drafts.filter((d) => d.id !== id)
    })),

  setSchedule: (schedule) => set({ schedule }),
  addScheduleItem: (date, item) =>
    set((state) => {
      const existing = state.schedule[date] || [];
      const filtered = existing.filter((s) => s.draftId !== item.draftId);
      return {
        schedule: { ...state.schedule, [date]: [...filtered, item] }
      };
    }),
  removeScheduleItem: (date, scheduleId) =>
    set((state) => {
      const existing = state.schedule[date] || [];
      return {
        schedule: {
          ...state.schedule,
          [date]: existing.filter((s) => s.id !== scheduleId)
        }
      };
    }),

  setCurrentMonth: (currentMonth) => set({ currentMonth }),
  setDraggingDraft: (draggingDraft) => set({ draggingDraft }),

  addToast: (type, message) => {
    const id = `toast_${++toastCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  setConflictDate: (conflictDate) => set({ conflictDate }),
  setLoading: (loading) => set({ loading })
}));
