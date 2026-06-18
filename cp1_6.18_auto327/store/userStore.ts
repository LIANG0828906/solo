import { create } from 'zustand';
import type { RoastLevel } from '@prisma/client';

export interface FlavorTag {
  id: string;
  name: string;
  color: string;
}

export interface CoffeeRecord {
  id: string;
  userId: string;
  coffeeName: string;
  roastLevel: RoastLevel;
  rating: number;
  notes: string | null;
  createdAt: string;
  flavorTags: FlavorTag[];
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string;
}

interface UIState {
  isCreateModalOpen: boolean;
  selectedDate: string | null;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  setSelectedDate: (date: string | null) => void;
}

interface UserState {
  user: User | null;
  records: CoffeeRecord[];
  flavorTags: FlavorTag[];
  setUser: (user: User) => void;
  setRecords: (records: CoffeeRecord[]) => void;
  addRecord: (record: CoffeeRecord) => void;
  setFlavorTags: (tags: FlavorTag[]) => void;
}

export const useUserStore = create<UserState & UIState>((set) => ({
  user: null,
  records: [],
  flavorTags: [],
  isCreateModalOpen: false,
  selectedDate: null,
  setUser: (user) => set({ user }),
  setRecords: (records) => set({ records }),
  addRecord: (record) =>
    set((state) => ({ records: [record, ...state.records] })),
  setFlavorTags: (flavorTags) => set({ flavorTags }),
  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),
  setSelectedDate: (date) => set({ selectedDate: date }),
}));
