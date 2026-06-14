import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ParamItem, Snapshot } from './types';

interface ParamsStoreState {
  params: ParamItem[];
  snapshots: Snapshot[];
  activeSnapshotId: string | null;
  addParam: (param: Omit<ParamItem, 'id'>) => void;
  removeParam: (id: string) => void;
  updateParam: (id: string, updates: Partial<ParamItem>) => void;
  reorderParams: (startIndex: number, endIndex: number) => void;
  updateParamValue: (id: string, value: string) => void;
  addSnapshot: (name: string) => void;
  removeSnapshot: (id: string) => void;
  switchSnapshot: (id: string) => void;
  clearActiveSnapshot: () => void;
  importState: (params: ParamItem[], snapshots: Snapshot[], activeSnapshotId: string | null) => void;
}

const defaultParams: ParamItem[] = [
  {
    id: uuidv4(),
    name: 'text',
    type: 'string',
    defaultValue: 'Button',
    currentValue: 'Button',
  },
  {
    id: uuidv4(),
    name: 'variant',
    type: 'enum',
    defaultValue: 'primary',
    currentValue: 'primary',
    enumOptions: ['primary', 'secondary', 'outline'],
  },
  {
    id: uuidv4(),
    name: 'size',
    type: 'enum',
    defaultValue: 'medium',
    currentValue: 'medium',
    enumOptions: ['small', 'medium', 'large'],
  },
  {
    id: uuidv4(),
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    currentValue: 'false',
  },
  {
    id: uuidv4(),
    name: 'borderRadius',
    type: 'number',
    defaultValue: '8',
    currentValue: '8',
  },
];

export const useParamsStore = create<ParamsStoreState>((set) => ({
  params: defaultParams,
  snapshots: [],
  activeSnapshotId: null,

  addParam: (param) =>
    set((state) => ({
      params: [...state.params, { ...param, id: uuidv4() }],
    })),

  removeParam: (id) =>
    set((state) => ({
      params: state.params.filter((p) => p.id !== id),
    })),

  updateParam: (id, updates) =>
    set((state) => ({
      params: state.params.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  reorderParams: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.params);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { params: result };
    }),

  updateParamValue: (id, value) =>
    set((state) => ({
      params: state.params.map((p) => (p.id === id ? { ...p, currentValue: value } : p)),
    })),

  addSnapshot: (name) =>
    set((state) => {
      if (state.snapshots.length >= 10) return state;
      return {
        snapshots: [
          ...state.snapshots,
          {
            id: uuidv4(),
            name,
            params: state.params.map((p) => ({ ...p, id: uuidv4() })),
          },
        ],
      };
    }),

  removeSnapshot: (id) =>
    set((state) => {
      const index = state.snapshots.findIndex((s) => s.id === id);
      const newSnapshots = state.snapshots.filter((s) => s.id !== id);

      if (state.activeSnapshotId !== id) {
        return { snapshots: newSnapshots };
      }

      if (newSnapshots.length === 0) {
        return {
          snapshots: newSnapshots,
          activeSnapshotId: null,
        };
      }

      const nextIndex = Math.min(index, newSnapshots.length - 1);
      const nextSnapshot = newSnapshots[nextIndex];
      return {
        snapshots: newSnapshots,
        activeSnapshotId: nextSnapshot.id,
        params: nextSnapshot.params.map((p) => ({ ...p, id: uuidv4() })),
      };
    }),

  switchSnapshot: (id) =>
    set((state) => {
      const snapshot = state.snapshots.find((s) => s.id === id);
      if (!snapshot) return state;
      return {
        activeSnapshotId: id,
        params: snapshot.params.map((p) => ({ ...p })),
      };
    }),

  clearActiveSnapshot: () =>
    set(() => ({
      activeSnapshotId: null,
    })),

  importState: (params, snapshots, activeSnapshotId) =>
    set(() => ({
      params,
      snapshots,
      activeSnapshotId,
    })),
}));
