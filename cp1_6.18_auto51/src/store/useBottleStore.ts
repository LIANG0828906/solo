import { create } from 'zustand';
import type { Bottle } from '../types';
import { getRandomBottle, createBottle, addContinuation } from '../modules/api';

interface BottleState {
  bottles: Bottle[];
  currentBottle: Bottle | null;
  viewedIds: string[];
  isCreateModalOpen: boolean;
  showParticleEffect: boolean;
  showConnectionLine: boolean;
  loading: boolean;

  fetchRandomBottle: () => Promise<void>;
  createNewBottle: (content: string, images: string[]) => Promise<void>;
  addBottleContinuation: (content: string) => Promise<void>;
  openCreateModal: () => void;
  closeCreateModal: () => void;
  triggerParticleEffect: () => void;
  triggerConnectionLine: () => void;
}

export const useBottleStore = create<BottleState>((set, get) => ({
  bottles: [],
  currentBottle: null,
  viewedIds: [],
  isCreateModalOpen: false,
  showParticleEffect: false,
  showConnectionLine: false,
  loading: false,

  fetchRandomBottle: async () => {
    set({ loading: true });
    const { viewedIds } = get();
    const bottle = await getRandomBottle(viewedIds);
    if (bottle) {
      set({
        currentBottle: bottle,
        viewedIds: [...viewedIds, bottle.id],
        loading: false
      });
    } else {
      set({ loading: false });
    }
  },

  createNewBottle: async (content: string, images: string[]) => {
    set({ loading: true });
    const bottle = await createBottle(content, images);
    set(state => ({
      bottles: [bottle, ...state.bottles],
      currentBottle: bottle,
      loading: false
    }));
    get().triggerParticleEffect();
  },

  addBottleContinuation: async (content: string) => {
    const { currentBottle } = get();
    if (!currentBottle) return;
    set({ loading: true });
    const updated = await addContinuation(currentBottle.id, content);
    if (updated) {
      set({
        currentBottle: updated,
        loading: false
      });
      get().triggerConnectionLine();
    } else {
      set({ loading: false });
    }
  },

  openCreateModal: () => set({ isCreateModalOpen: true }),
  closeCreateModal: () => set({ isCreateModalOpen: false }),

  triggerParticleEffect: () => {
    set({ showParticleEffect: true });
    setTimeout(() => set({ showParticleEffect: false }), 1200);
  },

  triggerConnectionLine: () => {
    set({ showConnectionLine: true });
    setTimeout(() => set({ showConnectionLine: false }), 2000);
  }
}));
