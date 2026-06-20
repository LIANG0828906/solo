import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type Category = '露营' | '徒步' | '摄影' | '急救' | '衣物';
export type Status = '已拥有' | '待购买';

export interface Equipment {
  id: string;
  name: string;
  category: Category;
  weight: number;
  status: Status;
}

export interface PackingItem {
  id: string;
  equipmentId: string;
  checked: boolean;
}

export interface Plan {
  id: string;
  name: string;
  packingItems: PackingItem[];
  weightThreshold: number;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  '露营': '#F4A261',
  '徒步': '#E76F51',
  '摄影': '#2A9D8F',
  '急救': '#E9C46A',
  '衣物': '#264653',
};

export const CATEGORIES: Category[] = ['露营', '徒步', '摄影', '急救', '衣物'];
export const STATUSES: Status[] = ['已拥有', '待购买'];

interface EquipmentStore {
  equipments: Equipment[];
  packingItems: PackingItem[];
  plans: Plan[];
  filterCategory: Category | null;
  filterStatus: Status | null;
  weightThreshold: number;

  addEquipment: (eq: Omit<Equipment, 'id'>) => void;
  removeEquipment: (id: string) => void;
  addToPacking: (equipmentId: string) => void;
  removeFromPacking: (packingItemId: string) => void;
  toggleChecked: (packingItemId: string) => void;
  filterByCategory: (cat: Category | null) => void;
  filterByStatus: (status: Status | null) => void;
  savePlan: (name: string) => void;
  loadPlan: (planId: string) => void;
  deletePlan: (planId: string) => void;
  setWeightThreshold: (threshold: number) => void;
}

const STORAGE_KEY = 'equipment-packing-plans';

function loadPlansFromStorage(): Plan[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function savePlansToStorage(plans: Plan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans.slice(0, 5)));
}

export const useEquipmentStore = create<EquipmentStore>((set, get) => ({
  equipments: [],
  packingItems: [],
  plans: loadPlansFromStorage(),
  filterCategory: null,
  filterStatus: null,
  weightThreshold: 15000,

  addEquipment: (eq) => {
    const equipment: Equipment = { ...eq, id: uuidv4() };
    set((state) => ({ equipments: [...state.equipments, equipment] }));
  },

  removeEquipment: (id) => {
    set((state) => ({
      equipments: state.equipments.filter((e) => e.id !== id),
      packingItems: state.packingItems.filter((p) => p.equipmentId !== id),
    }));
  },

  addToPacking: (equipmentId) => {
    const exists = get().packingItems.some((p) => p.equipmentId === equipmentId);
    if (exists) return;
    const item: PackingItem = { id: uuidv4(), equipmentId, checked: false };
    set((state) => ({ packingItems: [...state.packingItems, item] }));
  },

  removeFromPacking: (packingItemId) => {
    set((state) => ({
      packingItems: state.packingItems.filter((p) => p.id !== packingItemId),
    }));
  },

  toggleChecked: (packingItemId) => {
    set((state) => ({
      packingItems: state.packingItems.map((p) =>
        p.id === packingItemId ? { ...p, checked: !p.checked } : p
      ),
    }));
  },

  filterByCategory: (cat) => set({ filterCategory: cat }),
  filterByStatus: (status) => set({ filterStatus: status }),

  savePlan: (name) => {
    const state = get();
    const plan: Plan = {
      id: uuidv4(),
      name,
      packingItems: [...state.packingItems],
      weightThreshold: state.weightThreshold,
    };
    const plans = [plan, ...state.plans].slice(0, 5);
    set({ plans });
    savePlansToStorage(plans);
  },

  loadPlan: (planId) => {
    const plan = get().plans.find((p) => p.id === planId);
    if (plan) {
      set({
        packingItems: [...plan.packingItems],
        weightThreshold: plan.weightThreshold,
      });
    }
  },

  deletePlan: (planId) => {
    const plans = get().plans.filter((p) => p.id !== planId);
    set({ plans });
    savePlansToStorage(plans);
  },

  setWeightThreshold: (threshold) => set({ weightThreshold: threshold }),
}));
