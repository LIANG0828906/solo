import { create } from 'zustand';
import { MaterialType, EnvType } from '../engine/SceneManager';
import { BrushParams } from '../engine/BrushTool';

export type BrushType = 'pull' | 'smooth' | 'inflate';
export type ModelId = 'sphere' | 'torusknot';

interface AppState {
  currentModel: ModelId;
  brushParams: BrushParams;
  undoStack: Float32Array[];
  materialType: MaterialType;
  envType: EnvType;
  vertexCount: number;
  brushDirection: 'out' | 'in';
  isUndoing: boolean;
}

interface AppActions {
  setBrushParam: <K extends keyof BrushParams>(
    key: K,
    value: BrushParams[K]
  ) => void;
  setCurrentModel: (model: ModelId) => void;
  pushUndoSnapshot: (snapshot: Float32Array) => void;
  undo: () => Float32Array | null;
  resetModel: () => void;
  setMaterial: (type: MaterialType) => void;
  setEnv: (type: EnvType) => void;
  setVertexCount: (count: number) => void;
  setBrushDirection: (direction: 'out' | 'in') => void;
  setIsUndoing: (value: boolean) => void;
  clearUndoStack: () => void;
}

export const useAppStore = create<AppState & AppActions>((set, get) => ({
  currentModel: 'sphere',
  brushParams: {
    size: 0.5,
    intensity: 0.5,
    hardness: 0.5,
    type: 'pull'
  },
  undoStack: [],
  materialType: 'clay',
  envType: 'neutral',
  vertexCount: 0,
  brushDirection: 'out',
  isUndoing: false,

  setBrushParam: (key, value) =>
    set((state) => ({
      brushParams: { ...state.brushParams, [key]: value }
    })),

  setCurrentModel: (model) => set({ currentModel: model }),

  pushUndoSnapshot: (snapshot) => {
    const { undoStack } = get();
    const newStack = [...undoStack, snapshot];
    if (newStack.length > 5) {
      newStack.shift();
    }
    set({ undoStack: newStack });
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return null;

    const newStack = [...undoStack];
    const snapshot = newStack.pop()!;
    set({ undoStack: newStack, isUndoing: true });

    setTimeout(() => {
      set({ isUndoing: false });
    }, 200);

    return snapshot;
  },

  resetModel: () => set({ undoStack: [] }),

  setMaterial: (type) => set({ materialType: type }),

  setEnv: (type) => set({ envType: type }),

  setVertexCount: (count) => set({ vertexCount: count }),

  setBrushDirection: (direction) => set({ brushDirection: direction }),

  setIsUndoing: (value) => set({ isUndoing: value }),

  clearUndoStack: () => set({ undoStack: [] })
}));
