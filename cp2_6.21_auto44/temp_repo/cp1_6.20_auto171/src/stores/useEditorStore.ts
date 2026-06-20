import { create } from 'zustand';
import type { LevelState, ToolMode, SelectionTarget, DragState, TemplateMeta } from '@/types/shared';
import { createHistoryState, pushHistory, undoHistory, redoHistory, canUndo, canRedo } from '@/utils/history';
import type { HistoryState } from '@/utils/history';

const defaultLevelState: LevelState = {
  canvasWidth: 0,
  canvasHeight: 0,
  platforms: [],
  spikes: [],
  playerStart: { x: 100, y: 400 },
  jumpParams: { vx: 250, vy: 350 },
};

interface EditorStoreState {
  history: HistoryState<LevelState>;
  toolMode: ToolMode;
  selected: SelectionTarget;
  dragState: DragState;
  templateList: TemplateMeta[];
  loading: boolean;
}

interface EditorStoreActions {
  setToolMode: (mode: ToolMode) => void;
  setSelected: (target: SelectionTarget) => void;
  setDragState: (ds: DragState) => void;
  setLoading: (v: boolean) => void;
  setTemplateList: (list: TemplateMeta[]) => void;
  commitLevel: (mutator: (lvl: LevelState) => LevelState) => void;
  replaceLevel: (lvl: LevelState) => void;
  undo: () => void;
  redo: () => void;
  getLevel: () => LevelState;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export type EditorStore = EditorStoreState & EditorStoreActions;

export const useEditorStore = create<EditorStore>((set, get) => ({
  history: createHistoryState(defaultLevelState),
  toolMode: 'select',
  selected: null,
  dragState: null,
  templateList: [],
  loading: false,

  setToolMode: (mode) => set({ toolMode: mode }),
  setSelected: (target) => set({ selected: target }),
  setDragState: (ds) => set({ dragState: ds }),
  setLoading: (v) => set({ loading: v }),
  setTemplateList: (list) => set({ templateList: list }),

  commitLevel: (mutator) =>
    set((state) => ({
      history: pushHistory(state.history, mutator(state.history.present)),
    })),

  replaceLevel: (lvl) =>
    set((state) => ({
      history: pushHistory(state.history, lvl),
    })),

  undo: () =>
    set((state) => ({
      history: undoHistory(state.history),
    })),

  redo: () =>
    set((state) => ({
      history: redoHistory(state.history),
    })),

  getLevel: () => get().history.present,
  canUndo: () => canUndo(get().history),
  canRedo: () => canRedo(get().history),
}));
