import { create } from 'zustand';
import { Pipeline, PipelineType, CollisionResult, PipelinePoint } from '@/types';

interface PipelineState {
  pipelines: Pipeline[];
  selectedPipelineId: string | null;
  collisions: CollisionResult[];
  isAddingPipeline: boolean;
  addingPipelineType: PipelineType | null;
  addingPipelineDiameter: number;
  addingStartPoint: PipelinePoint | null;
  toast: { message: string; type: 'success' | 'error' } | null;
  focusedCollisionId: string | null;
  panelCollapsed: boolean;

  addPipeline: (pipeline: Pipeline) => void;
  removePipeline: (id: string) => void;
  updatePipeline: (id: string, updates: Partial<Pipeline>) => void;
  setSelectedPipeline: (id: string | null) => void;
  setCollisions: (collisions: CollisionResult[]) => void;
  setIsAddingPipeline: (isAdding: boolean) => void;
  setAddingPipelineType: (type: PipelineType | null) => void;
  setAddingPipelineDiameter: (diameter: number) => void;
  setAddingStartPoint: (point: PipelinePoint | null) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
  clearToast: () => void;
  setFocusedCollisionId: (id: string | null) => void;
  togglePanel: () => void;
  importPipelines: (pipelines: Pipeline[]) => void;
  clearAll: () => void;
}

let pipelineCounter = 0;
export const generateId = () => `pipeline-${++pipelineCounter}-${Date.now()}`;

let collisionCounter = 0;
const generateCollisionId = () => `collision-${++collisionCounter}-${Date.now()}`;

export const usePipelineStore = create<PipelineState>((set, get) => ({
  pipelines: [
    {
      id: 'demo-water-1',
      type: 'water',
      diameter: 150,
      start: { x: -1, y: 0.8, z: -4 },
      end: { x: -1, y: 0.8, z: 4 },
    },
    {
      id: 'demo-power-1',
      type: 'power',
      diameter: 100,
      start: { x: 0, y: 1.2, z: -4 },
      end: { x: 0, y: 1.2, z: 4 },
    },
    {
      id: 'demo-communication-1',
      type: 'communication',
      diameter: 80,
      start: { x: 1, y: 0.6, z: -4 },
      end: { x: 1, y: 0.6, z: 4 },
    },
    {
      id: 'demo-gas-1',
      type: 'gas',
      diameter: 120,
      start: { x: -0.5, y: 1.5, z: -3 },
      end: { x: 0.5, y: 0.9, z: 3 },
    },
  ],
  selectedPipelineId: null,
  collisions: [],
  isAddingPipeline: false,
  addingPipelineType: null,
  addingPipelineDiameter: 100,
  addingStartPoint: null,
  toast: null,
  focusedCollisionId: null,
  panelCollapsed: false,

  addPipeline: (pipeline) =>
    set((state) => ({
      pipelines: [...state.pipelines, pipeline],
      isAddingPipeline: false,
      addingStartPoint: null,
      addingPipelineType: null,
    })),

  removePipeline: (id) =>
    set((state) => ({
      pipelines: state.pipelines.filter((p) => p.id !== id),
      selectedPipelineId: state.selectedPipelineId === id ? null : state.selectedPipelineId,
    })),

  updatePipeline: (id, updates) =>
    set((state) => ({
      pipelines: state.pipelines.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  setSelectedPipeline: (id) => set({ selectedPipelineId: id }),

  setCollisions: (collisions) => {
    const withIds = collisions.map((c) => ({ ...c, id: c.id || generateCollisionId() }));
    set({ collisions: withIds });
  },

  setIsAddingPipeline: (isAdding) => set({ isAddingPipeline: isAdding }),

  setAddingPipelineType: (type) => set({ addingPipelineType: type }),

  setAddingPipelineDiameter: (diameter) => set({ addingPipelineDiameter: diameter }),

  setAddingStartPoint: (point) => set({ addingStartPoint: point }),

  showToast: (message, type) => {
    set({ toast: { message, type } });
    setTimeout(() => get().clearToast(), 3000);
  },

  clearToast: () => set({ toast: null }),

  setFocusedCollisionId: (id) => set({ focusedCollisionId: id }),

  togglePanel: () => set((state) => ({ panelCollapsed: !state.panelCollapsed })),

  importPipelines: (pipelines) => {
    set({ pipelines, collisions: [] });
    pipelineCounter = Math.max(pipelineCounter, pipelines.length);
  },

  clearAll: () => set({ pipelines: [], collisions: [], selectedPipelineId: null }),
}));
