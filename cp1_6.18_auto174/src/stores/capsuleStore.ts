import { create } from 'zustand';
import { Capsule, CreateCapsuleInput, EmotionType } from '../../shared/types';
import {
  fetchCapsules,
  createCapsule as apiCreateCapsule,
  markCapsuleAsRead as apiMarkAsRead,
  pollUpdates,
} from '../engine/capsuleEngine';

interface CapsuleState {
  capsules: Capsule[];
  selectedCapsule: Capsule | null;
  activeFilter: EmotionType | null;
  isLoading: boolean;
  error: string | null;
  playingCapsule: Capsule | null;

  loadCapsules: () => Promise<void>;
  createCapsule: (input: CreateCapsuleInput) => Promise<Capsule>;
  setSelectedCapsule: (capsule: Capsule | null) => void;
  setActiveFilter: (filter: EmotionType | null) => void;
  markAsRead: (id: string) => Promise<void>;
  startPolling: () => () => void;
  setPlayingCapsule: (capsule: Capsule | null) => void;
  getFilteredCapsules: () => Capsule[];
}

export const useCapsuleStore = create<CapsuleState>((set, get) => ({
  capsules: [],
  selectedCapsule: null,
  activeFilter: null,
  isLoading: false,
  error: null,
  playingCapsule: null,

  loadCapsules: async () => {
    set({ isLoading: true, error: null });
    try {
      const capsules = await fetchCapsules();
      set({ capsules, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createCapsule: async (input: CreateCapsuleInput) => {
    set({ isLoading: true, error: null });
    try {
      const capsule = await apiCreateCapsule(input);
      set((state) => ({
        capsules: [...state.capsules, capsule].sort((a, b) => a.openAt - b.openAt),
        isLoading: false,
      }));
      return capsule;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  setSelectedCapsule: (capsule) => set({ selectedCapsule: capsule }),

  setActiveFilter: (filter) => set({ activeFilter: filter }),

  markAsRead: async (id: string) => {
    try {
      await apiMarkAsRead(id);
      set((state) => ({
        capsules: state.capsules.map((c) =>
          c.id === id ? { ...c, status: 'read' } : c
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  startPolling: () => {
    let stopped = false;

    const poll = async () => {
      if (stopped) return;
      try {
        const updates = await pollUpdates();
        if (updates.length > 0) {
          set((state) => {
            const updatedCapsules = [...state.capsules];
            for (const updated of updates) {
              const idx = updatedCapsules.findIndex((c) => c.id === updated.id);
              if (idx !== -1) {
                updatedCapsules[idx] = updated;
              } else {
                updatedCapsules.push(updated);
              }
            }
            return { capsules: updatedCapsules.sort((a, b) => a.openAt - b.openAt) };
          });
        }
      } catch (e) {
        console.error('Poll error:', e);
      }
      if (!stopped) {
        setTimeout(poll, 2000);
      }
    };

    poll();
    return () => {
      stopped = true;
    };
  },

  setPlayingCapsule: (capsule) => set({ playingCapsule: capsule }),

  getFilteredCapsules: () => {
    const { capsules, activeFilter } = get();
    if (!activeFilter) return capsules;
    return capsules.filter((c) => c.emotion === activeFilter);
  },
}));
