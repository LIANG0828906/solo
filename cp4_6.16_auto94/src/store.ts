import { create } from 'zustand';
import type { Capsule, CapsuleStore, CapsuleStatus } from './types';
import {
  getAllCapsules,
  addCapsule as dbAddCapsule,
  updateCapsule as dbUpdateCapsule,
  deleteCapsule as dbDeleteCapsule,
} from './db';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export const useCapsuleStore = create<CapsuleStore>((set, get) => ({
  capsules: [],
  isLoading: false,
  searchQuery: '',
  filterStatus: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',

  fetchCapsules: async () => {
    set({ isLoading: true });
    try {
      const capsules = await getAllCapsules();
      set({ capsules, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch capsules:', error);
      set({ isLoading: false });
    }
  },

  addCapsule: async (capsuleData) => {
    const newCapsule: Capsule = {
      ...capsuleData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      status: 'locked',
    };
    await dbAddCapsule(newCapsule);
    set((state) => ({
      capsules: [...state.capsules, newCapsule],
    }));
  },

  updateCapsule: async (id, updates) => {
    await dbUpdateCapsule(id, updates);
    set((state) => ({
      capsules: state.capsules.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  deleteCapsule: async (id) => {
    await dbDeleteCapsule(id);
    set((state) => ({
      capsules: state.capsules.filter((c) => c.id !== id),
    }));
  },

  openCapsule: async (id) => {
    const updates: Partial<Capsule> = {
      status: 'opened',
      openedAt: new Date().toISOString(),
    };
    await dbUpdateCapsule(id, updates);
    set((state) => ({
      capsules: state.capsules.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  archiveCapsule: async (id) => {
    const updates: Partial<Capsule> = { status: 'archived' };
    await dbUpdateCapsule(id, updates);
    set((state) => ({
      capsules: state.capsules.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  checkExpiredCapsules: async () => {
    const { capsules } = get();
    const now = new Date();
    const expiredCapsules: Capsule[] = [];

    for (const capsule of capsules) {
      if (capsule.status === 'locked' && new Date(capsule.openDate) <= now) {
        expiredCapsules.push(capsule);
        const updates: Partial<Capsule> = { status: 'unlocked' };
        await dbUpdateCapsule(capsule.id, updates);
      }
    }

    if (expiredCapsules.length > 0) {
      set((state) => ({
        capsules: state.capsules.map((c) => {
          const expired = expiredCapsules.find((e) => e.id === c.id);
          return expired ? { ...c, status: 'unlocked' as CapsuleStatus } : c;
        }),
      }));
    }

    return expiredCapsules;
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (order) => set({ sortOrder: order }),

  getFilteredCapsules: () => {
    const { capsules, searchQuery, filterStatus, sortBy, sortOrder } = get();
    let filtered = [...capsules];

    if (filterStatus !== 'all') {
      filtered = filtered.filter((c) => c.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          c.content.toLowerCase().includes(query)
      );
    }

    filtered.sort((a, b) => {
      const aVal = new Date(a[sortBy]).getTime();
      const bVal = new Date(b[sortBy]).getTime();
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  },

  getCounts: () => {
    const { capsules } = get();
    return {
      total: capsules.length,
      locked: capsules.filter((c) => c.status === 'locked').length,
      unlocked: capsules.filter((c) => c.status === 'unlocked').length,
      opened: capsules.filter((c) => c.status === 'opened').length,
      archived: capsules.filter((c) => c.status === 'archived').length,
    };
  },
}));
