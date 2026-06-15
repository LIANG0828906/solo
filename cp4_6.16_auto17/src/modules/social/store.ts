import { create } from 'zustand';
import { SocialState, SocialActions } from './types';
import { getPublicTrails, getAllTrails, likeTrail as dbLikeTrail } from '@/shared/db';

const initialState: SocialState = {
  trails: [],
  loading: false,
  error: null,
  selectedCompareTrails: [],
  likeAnimation: null,
};

export const useSocialStore = create<SocialState & SocialActions>((set, get) => ({
  ...initialState,

  loadPublicTrails: async () => {
    set({ loading: true, error: null });
    try {
      const trails = await getPublicTrails();
      set({ trails, loading: false });
    } catch (e) {
      set({ error: '加载轨迹列表失败', loading: false });
    }
  },

  loadAllTrails: async () => {
    set({ loading: true, error: null });
    try {
      const trails = await getAllTrails();
      set({ trails, loading: false });
    } catch (e) {
      set({ error: '加载轨迹列表失败', loading: false });
    }
  },

  likeTrail: async (trailId: string) => {
    const updated = await dbLikeTrail(trailId);
    if (updated) {
      set(state => ({
        trails: state.trails.map(t => t.id === trailId ? updated : t),
        likeAnimation: trailId,
      }));
      setTimeout(() => {
        set({ likeAnimation: null });
      }, 600);
    }
  },

  toggleCompareSelection: (trailId: string) => {
    set(state => {
      const isSelected = state.selectedCompareTrails.includes(trailId);
      if (isSelected) {
        return {
          selectedCompareTrails: state.selectedCompareTrails.filter(id => id !== trailId),
        };
      }
      if (state.selectedCompareTrails.length >= 2) {
        return state;
      }
      return {
        selectedCompareTrails: [...state.selectedCompareTrails, trailId],
      };
    });
  },

  clearCompareSelection: () => {
    set({ selectedCompareTrails: [] });
  },

  setLikeAnimation: (trailId) => set({ likeAnimation: trailId }),
}));
