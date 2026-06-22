import { create } from 'zustand';
import ApiService from '@/services/ApiService';

interface Room {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  totalBudget: number;
  spent: number;
  thumbnail: string;
  order: number;
  updatedAt: string;
}

interface BudgetCategory {
  id: string;
  roomId: string;
  name: string;
  allocated: number;
  spent: number;
  items: BudgetItem[];
}

interface BudgetItem {
  id: string;
  categoryId: string;
  amount: number;
  date: string;
  note: string;
  receipt: string;
}

interface Task {
  id: string;
  roomId: string;
  name: string;
  assignee: string;
  note: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  completed: boolean;
}

interface Material {
  id: string;
  roomId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  link: string;
  purchased: boolean;
  category: string;
}

interface StoreState {
  rooms: Room[];
  selectedRoomId: string | null;
  budget: BudgetCategory[];
  tasks: Task[];
  materials: Material[];
  loading: boolean;
  activeTab: 'budget' | 'gantt' | 'materials';

  fetchRooms: () => Promise<void>;
  selectRoom: (id: string) => Promise<void>;
  setActiveTab: (tab: 'budget' | 'gantt' | 'materials') => void;
  reorderRooms: (rooms: Room[]) => Promise<void>;
  fetchBudget: (roomId: string) => Promise<void>;
  addBudgetItem: (roomId: string, data: Omit<BudgetItem, 'id'>) => Promise<void>;
  updateBudgetItem: (roomId: string, itemId: string, data: Partial<BudgetItem>) => Promise<void>;
  deleteBudgetItem: (roomId: string, itemId: string) => Promise<void>;
  fetchTasks: (roomId: string) => Promise<void>;
  updateTask: (roomId: string, taskId: string, data: Partial<Task>) => Promise<void>;
  fetchMaterials: (roomId: string) => Promise<void>;
  updateMaterial: (roomId: string, matId: string, data: Partial<Material>) => Promise<void>;
  clearSelection: () => void;
}

const useStore = create<StoreState>((set, get) => ({
  rooms: [],
  selectedRoomId: null,
  budget: [],
  tasks: [],
  materials: [],
  loading: false,
  activeTab: 'budget',

  fetchRooms: async () => {
    set({ loading: true });
    try {
      const rooms = await ApiService.getRooms();
      set({ rooms });
    } finally {
      set({ loading: false });
    }
  },

  selectRoom: async (id) => {
    set({ selectedRoomId: id, loading: true });
    try {
      const [budget, tasks, materials] = await Promise.all([
        ApiService.getBudget(id),
        ApiService.getTasks(id),
        ApiService.getMaterials(id),
      ]);
      set({ budget, tasks, materials });
    } finally {
      set({ loading: false });
    }
  },

  setActiveTab: (tab) => {
    set({ activeTab: tab });
  },

  reorderRooms: async (rooms) => {
    set({ rooms });
    await ApiService.reorderRooms(rooms.map((r, i) => ({ id: r.id, order: i })));
  },

  fetchBudget: async (roomId) => {
    const budget = await ApiService.getBudget(roomId);
    set({ budget });
  },

  addBudgetItem: async (roomId, data) => {
    await ApiService.addBudgetItem(roomId, data);
    await get().fetchBudget(roomId);
  },

  updateBudgetItem: async (roomId, itemId, data) => {
    await ApiService.updateBudgetItem(roomId, itemId, data);
    await get().fetchBudget(roomId);
  },

  deleteBudgetItem: async (roomId, itemId) => {
    await ApiService.deleteBudgetItem(roomId, itemId);
    await get().fetchBudget(roomId);
  },

  fetchTasks: async (roomId) => {
    const tasks = await ApiService.getTasks(roomId);
    set({ tasks });
  },

  updateTask: async (roomId, taskId, data) => {
    await ApiService.updateTask(roomId, taskId, data);
    await get().fetchTasks(roomId);
  },

  fetchMaterials: async (roomId) => {
    const materials = await ApiService.getMaterials(roomId);
    set({ materials });
  },

  updateMaterial: async (roomId, matId, data) => {
    await ApiService.updateMaterial(roomId, matId, data);
    await get().fetchMaterials(roomId);
  },

  clearSelection: () => {
    set({ selectedRoomId: null, budget: [], tasks: [], materials: [] });
  },
}));

export default useStore;
export type { Room, BudgetCategory, BudgetItem, Task, Material };
