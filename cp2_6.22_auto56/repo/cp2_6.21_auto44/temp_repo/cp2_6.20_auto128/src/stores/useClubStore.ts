import { create } from 'zustand';
import type { Club, ClubListQuery, UserApplication, ApplicationStatus } from '../types';
import { clubApi, userApi } from '../api';

interface ClubState {
  clubs: Club[];
  currentClub: Club | null;
  applications: UserApplication[];
  loading: boolean;
  error: string | null;

  fetchClubs: (query?: ClubListQuery) => Promise<void>;
  fetchClubDetail: (id: number) => Promise<void>;
  applyClub: (id: number, reason?: string) => Promise<{ success: boolean; message: string }>;
  fetchApplications: () => Promise<void>;
  getApplicationStatus: (clubId: number) => ApplicationStatus | null;
}

export const useClubStore = create<ClubState>((set, get) => ({
  clubs: [],
  currentClub: null,
  applications: [],
  loading: false,
  error: null,

  fetchClubs: async (query) => {
    set({ loading: true, error: null });
    try {
      const data = await clubApi.list(query);
      set({ clubs: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || '加载社团列表失败', loading: false });
    }
  },

  fetchClubDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await clubApi.detail(id);
      set({ currentClub: data, loading: false });
    } catch (err: any) {
      set({ error: err.message || '加载社团详情失败', loading: false });
    }
  },

  applyClub: async (id, reason) => {
    set({ loading: true, error: null });
    try {
      const result = await clubApi.apply(id, { clubId: id, reason });
      set({ loading: false });
      await get().fetchApplications();
      return { success: true, message: result.message || '报名成功' };
    } catch (err: any) {
      set({ error: err.message || '报名失败', loading: false });
      return { success: false, message: err.message || '报名失败' };
    }
  },

  fetchApplications: async () => {
    try {
      const data = await userApi.applications();
      set({ applications: data });
    } catch (err: any) {
      console.error('加载用户申请失败:', err);
    }
  },

  getApplicationStatus: (clubId) => {
    const { applications } = get();
    const app = applications.find((a) => a.clubId === clubId);
    return app ? app.status : null;
  },
}));
