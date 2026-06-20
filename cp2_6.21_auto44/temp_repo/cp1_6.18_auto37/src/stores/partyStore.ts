import { create } from 'zustand';
import type {
  Activity,
  UserMaterial,
  CreateActivityPayload,
  ContributedMaterial,
} from '@/types';
import {
  fetchActivities,
  createActivity as apiCreateActivity,
  joinActivity as apiJoinActivity,
  fetchUserMaterials,
  addUserMaterial as apiAddUserMaterial,
  updateUserMaterial as apiUpdateUserMaterial,
} from '@/api/mockApi';

interface PartyState {
  activities: Activity[];
  userMaterials: UserMaterial[];
  isLoading: boolean;
  toastMessage: string | null;
  toastType: 'success' | 'error';

  initActivities: () => Promise<void>;
  createUserActivity: (payload: CreateActivityPayload) => Promise<void>;
  joinParty: (activityId: string, contributions: ContributedMaterial[]) => Promise<void>;
  initUserMaterials: () => Promise<void>;
  addMaterial: (name: string, emoji: string, quantity: number) => Promise<void>;
  updateMaterial: (id: string, quantity: number) => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const usePartyStore = create<PartyState>((set, get) => ({
  activities: [],
  userMaterials: [],
  isLoading: false,
  toastMessage: null,
  toastType: 'success',

  initActivities: async () => {
    set({ isLoading: true });
    const activities = await fetchActivities();
    set({ activities, isLoading: false });
  },

  createUserActivity: async (payload: CreateActivityPayload) => {
    const activity = await apiCreateActivity(payload);
    set((state) => ({
      activities: [activity, ...state.activities],
    }));
    get().showToast('新建成功');
  },

  joinParty: async (activityId: string, contributions: ContributedMaterial[]) => {
    const updated = await apiJoinActivity(activityId, contributions);
    set((state) => ({
      activities: state.activities.map((a) =>
        a.id === activityId ? updated : a
      ),
    }));
    get().showToast('报名成功');
  },

  initUserMaterials: async () => {
    const userMaterials = await fetchUserMaterials();
    set({ userMaterials });
  },

  addMaterial: async (name: string, emoji: string, quantity: number) => {
    const material = await apiAddUserMaterial(name, emoji, quantity);
    set((state) => ({
      userMaterials: [...state.userMaterials, material],
    }));
    get().showToast('材料已添加');
  },

  updateMaterial: async (id: string, quantity: number) => {
    const updated = await apiUpdateUserMaterial(id, quantity);
    set((state) => ({
      userMaterials: state.userMaterials.map((m) =>
        m.id === id ? updated : m
      ),
    }));
  },

  showToast: (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer !== null) {
      clearTimeout(toastTimer);
    }
    set({ toastMessage: message, toastType: type });
    toastTimer = setTimeout(() => {
      get().hideToast();
      toastTimer = null;
    }, 2000);
  },

  hideToast: () => {
    set({ toastMessage: null });
  },
}));
