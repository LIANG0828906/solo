import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  MindMapStoreState,
  MindMapNode,
  Snapshot,
} from '@/types/mindMap';
import {
  NODE_COLORS,
  DEFAULT_NODE_WIDTH,
  DEFAULT_NODE_HEIGHT,
} from '@/types/mindMap';
import { createSnapshot, pushHistory, undoHistory, redoHistory } from '@/utils/history';
import { calculateLayout } from '@/utils/layout';

function createInitialState(): {
  nodes: Record<string, MindMapNode>;
  rootId: string;
} {
  const rootId = uuidv4();
  const rootNode: MindMapNode = {
    id: rootId,
    text: '中心主题',
    children: [],
    x: 0,
    y: 0,
    color: NODE_COLORS[0],
    level: 0,
    width: DEFAULT_NODE_WIDTH,
    height: DEFAULT_NODE_HEIGHT,
  };

  const nodes: Record<string, MindMapNode> = { [rootId]: rootNode };
  const laidOut = calculateLayout(nodes, rootId, {
    rootX: 0,
    rootY: 0,
  });

  return { nodes: laidOut, rootId };
}

const initial = createInitialState();

export const useMindMapStore = create<MindMapStoreState>((set, get) => ({
  nodes: initial.nodes,
  rootId: initial.rootId,
  selectedNodeId: null,
  editingNodeId: null,
  history: { past: [], future: [] },
  viewport: { scale: 1, offsetX: 0, offsetY: 0 },

  setNodes: (nodes) => set({ nodes }),

  updateNode: (id, patch) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: { ...state.nodes[id], ...patch },
      },
    })),

  selectNode: (id) => set({ selectedNodeId: id }),

  setEditingNode: (id) => set({ editingNodeId: id }),

  pushHistory: (snapshot) =>
    set((state) => ({
      history: pushHistory(state.history, snapshot),
    })),

  undo: () => {
    const state = get();
    const currentSnapshot = createSnapshot(state.nodes, state.rootId);
    const result = undoHistory(state.history, currentSnapshot);
    if (result.snapshot) {
      set({
        nodes: result.snapshot.nodes,
        rootId: result.snapshot.rootId,
        history: result.history,
      });
    }
  },

  redo: () => {
    const state = get();
    const currentSnapshot = createSnapshot(state.nodes, state.rootId);
    const result = redoHistory(state.history, currentSnapshot);
    if (result.snapshot) {
      set({
        nodes: result.snapshot.nodes,
        rootId: result.snapshot.rootId,
        history: result.history,
      });
    }
  },

  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),

  reset: () => {
    const fresh = createInitialState();
    set({
      nodes: fresh.nodes,
      rootId: fresh.rootId,
      selectedNodeId: null,
      editingNodeId: null,
      history: { past: [], future: [] },
      viewport: { scale: 1, offsetX: 0, offsetY: 0 },
    });
  },
}));

export type { Snapshot };
