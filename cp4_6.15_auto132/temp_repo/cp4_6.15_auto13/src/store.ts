import { create } from 'zustand';
import { StorageUnit, TabType, StorageType } from './types';
import { generateId, saveToLocalStorage, loadFromLocalStorage } from './utils';

interface AppState {
  units: StorageUnit[];
  activeTab: TabType;
  searchQuery: string;
  highlightedUnitId: string | null;
  selectedUnitId: string | null;
  addUnit: (type: StorageType) => void;
  updateUnit: (id: string, updates: Partial<StorageUnit>) => void;
  deleteUnit: (id: string) => void;
  setActiveTab: (tab: TabType) => void;
  setSearchQuery: (query: string) => void;
  setHighlightedUnitId: (id: string | null) => void;
  setSelectedUnitId: (id: string | null) => void;
  importData: (data: StorageUnit[]) => void;
}

const STORAGE_KEY = 'storage-planner-data';

const createDefaultUnits = (): StorageUnit[] => [
  {
    id: generateId(),
    name: '主卧衣柜',
    type: 'cabinet',
    x: 10,
    y: 10,
    width: 120,
    depth: 60,
    height: 200,
    color: '#4A90D9',
    items: [
      { id: generateId(), name: '夏季衣物', category: '衣物', quantity: 20, estimatedVolume: 5000 },
      { id: generateId(), name: '冬季衣物', category: '衣物', quantity: 15, estimatedVolume: 8000 },
    ],
  },
  {
    id: generateId(),
    name: '厨房抽屉',
    type: 'drawer',
    x: 150,
    y: 10,
    width: 80,
    depth: 50,
    height: 20,
    color: '#50C878',
    items: [
      { id: generateId(), name: '餐具', category: '厨房用品', quantity: 30, estimatedVolume: 2000 },
    ],
  },
  {
    id: generateId(),
    name: '储物箱A',
    type: 'box',
    x: 10,
    y: 100,
    width: 50,
    depth: 40,
    height: 30,
    color: '#DDA0DD',
    items: [],
  },
];

export const useStore = create<AppState>((set) => ({
  units: loadFromLocalStorage<StorageUnit[]>(STORAGE_KEY, createDefaultUnits()),
  activeTab: 'editor',
  searchQuery: '',
  highlightedUnitId: null,
  selectedUnitId: null,

  addUnit: (type: StorageType) =>
    set((state) => {
      const newUnit: StorageUnit = {
        id: generateId(),
        name: type === 'cabinet' ? '新柜子' : type === 'drawer' ? '新抽屉' : '新储物盒',
        type,
        x: 50 + state.units.length * 10,
        y: 50 + state.units.length * 10,
        width: type === 'cabinet' ? 100 : type === 'drawer' ? 60 : 40,
        depth: type === 'cabinet' ? 50 : type === 'drawer' ? 40 : 30,
        height: type === 'cabinet' ? 180 : type === 'drawer' ? 15 : 25,
        color:
          type === 'cabinet' ? '#4A90D9' : type === 'drawer' ? '#50C878' : '#DDA0DD',
        items: [],
      };
      const newUnits = [...state.units, newUnit];
      saveToLocalStorage(STORAGE_KEY, newUnits);
      return { units: newUnits, selectedUnitId: newUnit.id };
    }),

  updateUnit: (id: string, updates: Partial<StorageUnit>) =>
    set((state) => {
      const newUnits = state.units.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      );
      saveToLocalStorage(STORAGE_KEY, newUnits);
      return { units: newUnits };
    }),

  deleteUnit: (id: string) =>
    set((state) => {
      const newUnits = state.units.filter((u) => u.id !== id);
      saveToLocalStorage(STORAGE_KEY, newUnits);
      return {
        units: newUnits,
        selectedUnitId: state.selectedUnitId === id ? null : state.selectedUnitId,
      };
    }),

  setActiveTab: (tab: TabType) => set({ activeTab: tab }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setHighlightedUnitId: (id: string | null) => set({ highlightedUnitId: id }),
  setSelectedUnitId: (id: string | null) => set({ selectedUnitId: id }),

  importData: (data: StorageUnit[]) => {
    saveToLocalStorage(STORAGE_KEY, data);
    set({ units: data });
  },
}));
