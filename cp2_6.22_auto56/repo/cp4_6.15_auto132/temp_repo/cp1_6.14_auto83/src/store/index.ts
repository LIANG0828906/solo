import { create } from 'zustand';
import type { User, Resource, ResourceDetail, Project, FilterOptions, ReportStats } from '../types';
import { apiGet, apiPost } from '../api/client';

interface AppState {
  user: User | null;
  token: string | null;
  resources: Resource[];
  projects: Project[];
  currentResource: ResourceDetail | null;
  reportStats: ReportStats | null;
  filters: FilterOptions;
  loading: Record<string, boolean>;

  setAuth: (user: User | null, token: string | null) => void;
  logout: () => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  fetchResources: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  fetchResourceDetail: (id: string) => Promise<void>;
  fetchReportStats: (params?: Record<string, string>) => Promise<void>;
  setLoading: (key: string, value: boolean) => void;
}

const defaultFilters: FilterOptions = {
  types: [],
  search: '',
};

export const useStore = create<AppState>((set, get) => ({
  user: null,
  token: null,
  resources: [],
  projects: [],
  currentResource: null,
  reportStats: null,
  filters: defaultFilters,
  loading: {},

  setAuth: (user, token) => {
    set({ user, token });
    if (token) localStorage.setItem('pixelvault_token', token);
    if (user) localStorage.setItem('pixelvault_user', JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem('pixelvault_token');
    localStorage.removeItem('pixelvault_user');
    set({ user: null, token: null, resources: [], currentResource: null });
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  setLoading: (key, value) => {
    set((state) => ({ loading: { ...state.loading, [key]: value } }));
  },

  fetchResources: async () => {
    const { filters } = get();
    const params = new URLSearchParams();
    if (filters.types.length) params.set('type', filters.types.join(','));
    if (filters.search) params.set('search', filters.search);
    if (filters.minSize) params.set('minSize', String(filters.minSize));
    if (filters.maxSize) params.set('maxSize', String(filters.maxSize));
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);

    const qs = params.toString();
    const url = qs ? `/resources?${qs}` : '/resources';
    set({ loading: { ...get().loading, resources: true } });
    try {
      const res = await apiGet<{ success: boolean; data: Resource[] }>(url);
      set({ resources: res.data });
    } finally {
      set({ loading: { ...get().loading, resources: false } });
    }
  },

  fetchProjects: async () => {
    try {
      const res = await apiGet<{ success: boolean; data: Project[] }>('/resources/projects');
      set({ projects: res.data });
    } catch {
      set({ projects: [] });
    }
  },

  fetchResourceDetail: async (id) => {
    set({ loading: { ...get().loading, resource: true } });
    try {
      const res = await apiGet<{ success: boolean; data: ResourceDetail }>(`/resources/${id}`);
      set({ currentResource: res.data });
    } finally {
      set({ loading: { ...get().loading, resource: false } });
    }
  },

  fetchReportStats: async (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `/reports/stats?${qs}` : '/reports/stats';
    set({ loading: { ...get().loading, report: true } });
    try {
      const res = await apiGet<{ success: boolean; data: ReportStats }>(url);
      set({ reportStats: res.data });
    } finally {
      set({ loading: { ...get().loading, report: false } });
    }
  },
}));

const savedToken = localStorage.getItem('pixelvault_token');
const savedUser = localStorage.getItem('pixelvault_user');
if (savedToken && savedUser) {
  try {
    useStore.getState().setAuth(JSON.parse(savedUser), savedToken);
  } catch {
    /* ignore */
  }
}
