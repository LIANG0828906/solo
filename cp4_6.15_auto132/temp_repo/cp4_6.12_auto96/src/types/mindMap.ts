export interface MindMapNode {
  id: string;
  text: string;
  children: string[];
  x: number;
  y: number;
  color: string;
  level: number;
  width: number;
  height: number;
}

export interface Snapshot {
  nodes: Record<string, MindMapNode>;
  rootId: string;
}

export interface HistoryState {
  past: Snapshot[];
  future: Snapshot[];
}

export interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface MindMapStoreState {
  nodes: Record<string, MindMapNode>;
  rootId: string;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  history: HistoryState;
  viewport: Viewport;
  setNodes: (nodes: Record<string, MindMapNode>) => void;
  updateNode: (id: string, patch: Partial<MindMapNode>) => void;
  selectNode: (id: string | null) => void;
  setEditingNode: (id: string | null) => void;
  pushHistory: (snapshot: Snapshot) => void;
  undo: () => void;
  redo: () => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  reset: () => void;
}

export const NODE_COLORS: Record<number, string> = {
  0: '#e8e0f0',
  1: '#e8e0f0',
  2: '#dce7f5',
  3: '#dff0d8',
};

export const LEVEL_FONT_SIZES: Record<number, { size: number; weight: string }> = {
  0: { size: 18, weight: '700' },
  1: { size: 18, weight: '700' },
  2: { size: 14, weight: '400' },
  3: { size: 14, weight: '400' },
};

export const HISTORY_MAX_DEPTH = 50;
export const MIN_SCALE = 0.5;
export const MAX_SCALE = 2;
export const DEFAULT_SIBLING_GAP = 30;
export const MOBILE_SIBLING_GAP = 25;
export const LEVEL_GAP = 80;
export const DEFAULT_NODE_WIDTH = 120;
export const DEFAULT_NODE_HEIGHT = 44;
