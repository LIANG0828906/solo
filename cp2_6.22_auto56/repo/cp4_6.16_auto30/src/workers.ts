import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

export type WorkerRole = 'bartender' | 'waiter' | 'chef';

export interface Worker {
  id: string;
  name: string;
  role: WorkerRole;
  hireDate: string;
  avatar: string;
}

export const ROLE_LABELS: Record<WorkerRole, string> = {
  bartender: '调酒师',
  waiter: '侍者',
  chef: '厨师',
};

export const ROLE_COLORS: Record<WorkerRole, string> = {
  bartender: '#C9A84C',
  waiter: '#2E4A2E',
  chef: '#8B3A3A',
};

interface WorkersState {
  workers: Worker[];
  isLoading: boolean;
  addWorker: (worker: Omit<Worker, 'id'>) => void;
  updateWorker: (id: string, updates: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;
  getWorker: (id: string) => Worker | undefined;
  hasWorkerShifts: (workerId: string) => boolean;
}

let shiftsStoreRef: any = null;

export const setShiftsStoreRef = (ref: any) => {
  shiftsStoreRef = ref;
};

const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

export const useWorkersStore = create<WorkersState>()(
  persist(
    (set, get) => ({
      workers: [],
      isLoading: true,

      addWorker: (worker) =>
        set((state) => ({
          workers: [...state.workers, { ...worker, id: uuidv4() }],
        })),

      updateWorker: (id, updates) =>
        set((state) => ({
          workers: state.workers.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          ),
        })),

      deleteWorker: (id) =>
        set((state) => ({
          workers: state.workers.filter((w) => w.id !== id),
        })),

      getWorker: (id) => get().workers.find((w) => w.id === id),

      hasWorkerShifts: (workerId) => {
        if (!shiftsStoreRef) return false;
        const shiftsState = shiftsStoreRef.getState();
        const assignments = shiftsState.assignments || {};
        return Object.values(assignments).some((dayShifts: any) =>
          Object.values(dayShifts).some((workerIds: any) =>
            workerIds.includes(workerId)
          )
        );
      },
    }),
    {
      name: 'fantasy-tavern-workers',
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoading = false;
      },
    }
  )
);
