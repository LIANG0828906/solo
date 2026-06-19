import { create } from 'zustand';
import type { Promotion, PromotionType, PromotionStatus, ABTest, RealtimeStats, HistoryData, CreatePromotionDto, UpdatePromotionDto, CreateABTestDto } from './types';
import {
  getPromotions,
  createPromotion as apiCreatePromotion,
  updatePromotion as apiUpdatePromotion,
  togglePromotion as apiTogglePromotion,
  deletePromotion as apiDeletePromotion,
  getABTests,
  createABTest as apiCreateABTest,
  getRealtimeStats,
  getHistoryData,
  mockPromotions,
} from './api';

interface StoreState {
  promotions: Promotion[];
  currentPromotion: Promotion | null;
  abTests: ABTest[];
  currentTest: ABTest | null;
  realtimeStats: RealtimeStats | null;
  loading: boolean;
  error: string | null;
  searchTerm: string;
  typeFilter: PromotionType | 'ALL';
  statusFilter: PromotionStatus | 'ALL';
  fetchPromotions: () => Promise<void>;
  loadPromotions: () => Promise<void>;
  createPromotion: (data: CreatePromotionDto) => Promise<void>;
  updatePromotion: (id: string, data: UpdatePromotionDto) => Promise<void>;
  togglePromotion: (id: string) => void;
  deletePromotion: (id: string) => void;
  fetchABTests: () => Promise<void>;
  createABTest: (data: CreateABTestDto) => Promise<void>;
  fetchRealtimeStats: (testId: string) => Promise<void>;
  fetchHistoryData: (testId: string) => Promise<HistoryData[]>;
  setCurrentPromotion: (promotion: Promotion | null) => void;
  clearCurrentPromotion: () => void;
  setSearchTerm: (term: string) => void;
  setTypeFilter: (type: PromotionType | 'ALL') => void;
  setStatusFilter: (status: PromotionStatus | 'ALL') => void;
}

export const useStore = create<StoreState>((set, get) => ({
  promotions: [],
  currentPromotion: null,
  abTests: [],
  currentTest: null,
  realtimeStats: null,
  loading: false,
  error: null,
  searchTerm: '',
  typeFilter: 'ALL',
  statusFilter: 'ALL',

  fetchPromotions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getPromotions();
      set({ promotions: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || '获取活动列表失败', loading: false });
    }
  },

  createPromotion: async (data: CreatePromotionDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCreatePromotion(data);
      set((state) => ({
        promotions: [...state.promotions, response.data],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || '创建活动失败', loading: false });
    }
  },

  updatePromotion: async (id: string, data: UpdatePromotionDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiUpdatePromotion(id, data);
      set((state) => ({
        promotions: state.promotions.map((p) =>
          p.id === id ? response.data : p
        ),
        currentPromotion:
          get().currentPromotion?.id === id ? response.data : get().currentPromotion,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || '更新活动失败', loading: false });
    }
  },

  togglePromotion: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await apiTogglePromotion(id);
      set((state) => ({
        promotions: state.promotions.map((p) =>
          p.id === id ? response.data : p
        ),
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || '切换活动状态失败', loading: false });
    }
  },

  deletePromotion: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await apiDeletePromotion(id);
      set((state) => ({
        promotions: state.promotions.filter((p) => p.id !== id),
        currentPromotion:
          get().currentPromotion?.id === id ? null : get().currentPromotion,
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || '删除活动失败', loading: false });
    }
  },

  fetchABTests: async () => {
    set({ loading: true, error: null });
    try {
      const response = await getABTests();
      set({ abTests: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || '获取A/B测试列表失败', loading: false });
    }
  },

  createABTest: async (data: CreateABTestDto) => {
    set({ loading: true, error: null });
    try {
      const response = await apiCreateABTest(data);
      set((state) => ({
        abTests: [...state.abTests, response.data],
        loading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || '创建A/B测试失败', loading: false });
    }
  },

  fetchRealtimeStats: async (testId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await getRealtimeStats(testId);
      set({ realtimeStats: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || '获取实时统计失败', loading: false });
    }
  },

  fetchHistoryData: async (testId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await getHistoryData(testId);
      set({ loading: false });
      return response.data;
    } catch (error: any) {
      set({ error: error.message || '获取历史数据失败', loading: false });
      return [];
    }
  },

  setCurrentPromotion: (promotion: Promotion | null) => {
    set({ currentPromotion: promotion });
  },

  clearCurrentPromotion: () => {
    set({ currentPromotion: null });
  },

  setSearchTerm: (term) => set({ searchTerm: term }),
  setTypeFilter: (type) => set({ typeFilter: type }),
  setStatusFilter: (status) => set({ statusFilter: status }),

  loadPromotions: async () => {
    set({ loading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    const data = await mockPromotions();
    set({ promotions: data, loading: false });
  },

  togglePromotionLocal: (id) => set((state) => ({
    promotions: state.promotions.map(p =>
      p.id === id
        ? { ...p, status: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' as PromotionStatus }
        : p
    )
  })),

  deletePromotionLocal: (id) => set((state) => ({
    promotions: state.promotions.filter(p => p.id !== id)
  })),
}));

export const usePromotionStore = useStore;

export const useFilteredPromotions = () => {
  const { promotions, searchTerm, typeFilter, statusFilter } = useStore();
  
  return promotions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || p.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });
};
