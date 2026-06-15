import { create } from 'zustand';
import { Storyboard, Material, createStoryboard, createMaterial } from '@/utils/helpers';

interface StoryboardStore {
  storyboards: Storyboard[];
  materials: Material[];

  addStoryboard: (title: string, description: string) => Storyboard;
  deleteStoryboard: (id: string) => void;
  updateStoryboard: (id: string, updates: Partial<Storyboard>) => void;
  getStoryboard: (id: string) => Storyboard | undefined;
  getStoryboardByShareCode: (code: string) => Storyboard | undefined;

  addMaterial: (storyboardId: string, type: 'upload' | 'url', imageUrl: string) => void;
  deleteMaterial: (id: string) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  reorderMaterials: (storyboardId: string, startIndex: number, endIndex: number) => void;
  getMaterialsByStoryboard: (storyboardId: string) => Material[];
}

const STORAGE_KEY = 'storyboard-studio-data';

function loadFromStorage(): { storyboards: Storyboard[]; materials: Material[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const storyboards = (data.storyboards || []).map((s: any) => ({
        ...s,
        authorNickname: s.authorNickname || '创作者',
        shareCode: s.shareCode || (() => {
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
          let code = '';
          for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
          return code;
        })(),
        createdAt: s.createdAt || new Date().toISOString(),
        updatedAt: s.updatedAt || new Date().toISOString(),
      }));
      return { storyboards, materials: data.materials || [] };
    }
  } catch (_e) {}
  return { storyboards: [], materials: [] };
}

function saveToStorage(storyboards: Storyboard[], materials: Material[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ storyboards, materials }));
  } catch {}
}

const initial = loadFromStorage();

export const useStoryboardStore = create<StoryboardStore>((set, get) => ({
  storyboards: initial.storyboards,
  materials: initial.materials,

  addStoryboard: (title, description) => {
    const sb = createStoryboard(title, description);
    set((state) => {
      const storyboards = [...state.storyboards, sb];
      saveToStorage(storyboards, state.materials);
      return { storyboards };
    });
    return sb;
  },

  deleteStoryboard: (id) => {
    set((state) => {
      const storyboards = state.storyboards.filter((s) => s.id !== id);
      const materials = state.materials.filter((m) => m.storyboardId !== id);
      saveToStorage(storyboards, materials);
      return { storyboards, materials };
    });
  },

  updateStoryboard: (id, updates) => {
    set((state) => {
      const storyboards = state.storyboards.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      );
      saveToStorage(storyboards, state.materials);
      return { storyboards };
    });
  },

  getStoryboard: (id) => {
    return get().storyboards.find((s) => s.id === id);
  },

  getStoryboardByShareCode: (code) => {
    return get().storyboards.find((s) => s.shareCode === code);
  },

  addMaterial: (storyboardId, type, imageUrl) => {
    const existing = get().materials.filter((m) => m.storyboardId === storyboardId);
    const order = existing.length > 0 ? Math.max(...existing.map((m) => m.order)) + 1 : 0;
    const material = createMaterial(storyboardId, type, imageUrl, order);
    set((state) => {
      const materials = [...state.materials, material];
      saveToStorage(state.storyboards, materials);
      return { materials };
    });
    set((state) => {
      const storyboards = state.storyboards.map((s) =>
        s.id === storyboardId ? { ...s, updatedAt: new Date().toISOString() } : s
      );
      saveToStorage(storyboards, state.materials);
      return { storyboards };
    });
  },

  deleteMaterial: (id) => {
    set((state) => {
      const material = state.materials.find((m) => m.id === id);
      const materials = state.materials.filter((m) => m.id !== id);
      saveToStorage(state.storyboards, materials);
      if (material) {
        const storyboards = state.storyboards.map((s) =>
          s.id === material.storyboardId ? { ...s, updatedAt: new Date().toISOString() } : s
        );
        saveToStorage(storyboards, materials);
        return { materials, storyboards };
      }
      return { materials };
    });
  },

  updateMaterial: (id, updates) => {
    set((state) => {
      const materials = state.materials.map((m) => (m.id === id ? { ...m, ...updates } : m));
      saveToStorage(state.storyboards, materials);
      return { materials };
    });
  },

  reorderMaterials: (storyboardId, startIndex, endIndex) => {
    set((state) => {
      const items = state.materials
        .filter((m) => m.storyboardId === storyboardId)
        .sort((a, b) => a.order - b.order);
      const [removed] = items.splice(startIndex, 1);
      items.splice(endIndex, 0, removed);
      const reordered = items.map((item, idx) => ({ ...item, order: idx }));
      const materials = state.materials.map((m) => {
        const reorderedItem = reordered.find((r) => r.id === m.id);
        return reorderedItem || m;
      });
      const storyboards = state.storyboards.map((s) =>
        s.id === storyboardId ? { ...s, updatedAt: new Date().toISOString() } : s
      );
      saveToStorage(storyboards, materials);
      return { materials, storyboards };
    });
  },

  getMaterialsByStoryboard: (storyboardId) => {
    return get()
      .materials.filter((m) => m.storyboardId === storyboardId)
      .sort((a, b) => a.order - b.order);
  },
}));
