import { create } from "zustand";
import type { Work, SearchParams } from "@/types";
import { fetchWorks } from "@/api/client";

interface WorkState {
  works: Work[];
  loading: boolean;
  error: string | null;
  searchParams: SearchParams;
  adminToken: string | null;
  setWorks: (works: Work[]) => void;
  addWork: (work: Work) => void;
  updateWork: (id: string, updates: Partial<Work>) => void;
  removeWork: (id: string) => void;
  setSearchParams: (params: SearchParams) => void;
  loadWorks: () => Promise<void>;
  setAdminToken: (token: string | null) => void;
}

export const useWorkStore = create<WorkState>((set, get) => ({
  works: [],
  loading: false,
  error: null,
  searchParams: { status: "published" },
  adminToken: localStorage.getItem("admin_token"),

  setWorks: (works) => set({ works }),

  addWork: (work) =>
    set((state) => ({ works: [...state.works, work] })),

  updateWork: (id, updates) =>
    set((state) => ({
      works: state.works.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),

  removeWork: (id) =>
    set((state) => ({ works: state.works.filter((w) => w.id !== id) })),

  setSearchParams: (params) => {
    set({ searchParams: params });
    get().loadWorks();
  },

  loadWorks: async () => {
    set({ loading: true, error: null });
    try {
      const works = await fetchWorks(get().searchParams);
      set({ works, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "加载失败",
        loading: false,
      });
    }
  },

  setAdminToken: (token) => {
    if (token) {
      localStorage.setItem("admin_token", token);
    } else {
      localStorage.removeItem("admin_token");
    }
    set({ adminToken: token });
  },
}));
