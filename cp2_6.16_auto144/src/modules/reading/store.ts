import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/utils/indexedDB';
import type { ReadingGoal, ReadingRecord, Note } from '@/types';

interface ReadingState {
  goals: ReadingGoal[];
  records: ReadingRecord[];
  notes: Note[];
  isLoading: boolean;
  initData: () => Promise<void>;
  addGoal: (goal: Omit<ReadingGoal, 'id' | 'createdAt' | 'updatedAt' | 'currentPage'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<ReadingGoal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addRecord: (record: Omit<ReadingRecord, 'id' | 'createdAt'>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateGoalProgress: (goalId: string, endPage: number) => Promise<void>;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  goals: [],
  records: [],
  notes: [],
  isLoading: true,

  initData: async () => {
    set({ isLoading: true });
    const { goals, records, notes } = await db.getAll();
    set({ goals, records, notes, isLoading: false });
  },

  addGoal: async (goalData) => {
    const now = new Date().toISOString();
    const newGoal: ReadingGoal = {
      ...goalData,
      id: uuidv4(),
      currentPage: 0,
      createdAt: now,
      updatedAt: now,
    };
    await db.saveGoal(newGoal);
    set((state) => ({ goals: [newGoal, ...state.goals] }));
  },

  updateGoal: async (id, updates) => {
    const goal = get().goals.find((g) => g.id === id);
    if (!goal) return;

    const updatedGoal: ReadingGoal = {
      ...goal,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await db.saveGoal(updatedGoal);
    set((state) => ({
      goals: state.goals.map((g) => (g.id === id ? updatedGoal : g)),
    }));
  },

  deleteGoal: async (id) => {
    await db.deleteGoal(id);
    set((state) => ({
      goals: state.goals.filter((g) => g.id !== id),
      records: state.records.filter((r) => r.goalId !== id),
      notes: state.notes.filter((n) => n.goalId !== id),
    }));
  },

  addRecord: async (recordData) => {
    const newRecord: ReadingRecord = {
      ...recordData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.saveRecord(newRecord);
    set((state) => ({ records: [newRecord, ...state.records] }));
  },

  deleteRecord: async (id) => {
    await db.deleteRecord(id);
    set((state) => ({
      records: state.records.filter((r) => r.id !== id),
    }));
  },

  addNote: async (noteData) => {
    const newNote: Note = {
      ...noteData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    await db.saveNote(newNote);
    set((state) => ({ notes: [...state.notes, newNote] }));
  },

  deleteNote: async (id) => {
    await db.deleteNote(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
    }));
  },

  updateGoalProgress: async (goalId, endPage) => {
    const goal = get().goals.find((g) => g.id === goalId);
    if (!goal) return;

    if (endPage > goal.currentPage) {
      await get().updateGoal(goalId, { currentPage: endPage });
    }
  },
}));
