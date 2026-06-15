import { create } from 'zustand';
import type { PlantData, Mood } from './plantGenerator';

export interface SavedPlant {
  id: string;
  createdAt: number;
  plant: PlantData;
  note: string;
}

export interface PlantStats {
  avgTrunkHeight: number;
  avgBranchCount: number;
  avgLeafSize: number;
  moodDistribution: Record<Mood, number>;
  totalCount: number;
}

const DB_NAME = 'virtual-plant-db';
const DB_VERSION = 1;
const STORE_NAME = 'saved-plants';
const MAX_SAVED = 50;

type Page = 'home' | 'collection';

interface PlantStore {
  currentPlant: PlantData | null;
  currentSvg: string | null;
  savedPlants: SavedPlant[];
  page: Page;
  isGenerating: boolean;
  isLoading: boolean;
  toast: { message: string; id: number } | null;

  setPage: (p: Page) => void;
  setCurrentPlant: (plant: PlantData, svg: string) => void;
  clearCurrent: () => void;

  loadSavedPlants: () => Promise<void>;
  saveCurrentPlant: () => Promise<boolean>;
  updatePlantNote: (id: string, note: string) => Promise<boolean>;
  deletePlant: (id: string) => Promise<boolean>;
  clearAllSaved: () => Promise<void>;

  computeStats: () => PlantStats;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetAll(): Promise<SavedPlant[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const list = (req.result || []) as SavedPlant[];
      list.sort((a, b) => b.createdAt - a.createdAt);
      resolve(list);
      db.close();
    };
    req.onerror = () => {
      reject(req.error);
      db.close();
    };
  });
}

async function dbPut(item: SavedPlant): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(item);
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}

async function dbClear(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => {
      reject(tx.error);
      db.close();
    };
  });
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const usePlantStore = create<PlantStore>((set, get) => ({
  currentPlant: null,
  currentSvg: null,
  savedPlants: [],
  page: 'home',
  isGenerating: false,
  isLoading: false,
  toast: null,

  setPage: (p) => set({ page: p }),

  setCurrentPlant: (plant, svg) => {
    set({ currentPlant: plant, currentSvg: svg });
  },

  clearCurrent: () => set({ currentPlant: null, currentSvg: null }),

  loadSavedPlants: async () => {
    try {
      set({ isLoading: true });
      const list = await dbGetAll();
      set({ savedPlants: list });
    } catch (e) {
      console.error('Failed to load saved plants', e);
      get().showToast('加载收藏失败');
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentPlant: async () => {
    const state = get();
    if (!state.currentPlant) {
      get().showToast('请先生成植物');
      return false;
    }

    const existing = state.savedPlants.find(
      (s) =>
        s.plant.seed === state.currentPlant!.seed &&
        Math.abs(s.plant.input.steps - state.currentPlant!.input.steps) < 1 &&
        Math.abs(s.plant.input.water - state.currentPlant!.input.water) < 0.1 &&
        Math.abs(s.plant.input.workHours - state.currentPlant!.input.workHours) < 0.1 &&
        s.plant.mood === state.currentPlant!.mood
    );
    if (existing) {
      get().showToast('这棵植物已经收藏过啦');
      return false;
    }

    if (state.savedPlants.length >= MAX_SAVED) {
      get().showToast(`收藏夹最多${MAX_SAVED}张`);
      return false;
    }

    try {
      const item: SavedPlant = {
        id: genId(),
        createdAt: Date.now(),
        plant: state.currentPlant,
        note: '',
      };
      await dbPut(item);
      set({ savedPlants: [item, ...state.savedPlants] });
      get().showToast('收藏成功 🌱');
      return true;
    } catch (e) {
      console.error(e);
      get().showToast('收藏失败');
      return false;
    }
  },

  updatePlantNote: async (id, note) => {
    const state = get();
    const target = state.savedPlants.find((s) => s.id === id);
    if (!target) return false;

    try {
      const trimmed = note.slice(0, 80);
      const updated: SavedPlant = { ...target, note: trimmed };
      await dbPut(updated);
      set({
        savedPlants: state.savedPlants.map((s) => (s.id === id ? updated : s)),
      });
      return true;
    } catch (e) {
      console.error(e);
      get().showToast('保存备注失败');
      return false;
    }
  },

  deletePlant: async (id) => {
    try {
      await dbDelete(id);
      set({ savedPlants: get().savedPlants.filter((s) => s.id !== id) });
      get().showToast('已删除');
      return true;
    } catch (e) {
      console.error(e);
      get().showToast('删除失败');
      return false;
    }
  },

  clearAllSaved: async () => {
    try {
      await dbClear();
      set({ savedPlants: [] });
    } catch (e) {
      console.error(e);
    }
  },

  computeStats: () => {
    const plants = get().savedPlants;
    const total = plants.length;
    const empty: PlantStats = {
      avgTrunkHeight: 0,
      avgBranchCount: 0,
      avgLeafSize: 0,
      moodDistribution: { happy: 0, calm: 0, anxious: 0, tired: 0 },
      totalCount: 0,
    };
    if (total === 0) return empty;

    let th = 0;
    let bc = 0;
    let ls = 0;
    const md: Record<Mood, number> = { happy: 0, calm: 0, anxious: 0, tired: 0 };

    for (const s of plants) {
      th += s.plant.metrics.trunkHeight;
      bc += s.plant.metrics.branchCount;
      ls += s.plant.metrics.avgLeafSize;
      md[s.plant.mood] = (md[s.plant.mood] || 0) + 1;
    }

    return {
      avgTrunkHeight: Math.round((th / total) * 10) / 10,
      avgBranchCount: Math.round((bc / total) * 10) / 10,
      avgLeafSize: Math.round((ls / total) * 10) / 10,
      moodDistribution: md,
      totalCount: total,
    };
  },

  showToast: (message) => {
    const id = Date.now();
    set({ toast: { message, id } });
    setTimeout(() => {
      const cur = get().toast;
      if (cur && cur.id === id) set({ toast: null });
    }, 2200);
  },

  hideToast: () => set({ toast: null }),
}));
