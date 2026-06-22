export type BorderRadius = 'rect' | 'round' | 'ellipse';

export type BorderStyle = 'none' | 'solid' | 'dashed';

export type EdgeStyle = 'straight' | 'bezier' | 'step';

export interface ChartNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  bgColor: string;
  borderRadius: BorderRadius;
  borderStyle: BorderStyle;
  icon: string;
}

export interface ChartEdge {
  id: string;
  fromId: string;
  toId: string;
  style: EdgeStyle;
  color: string;
  width: number;
  arrow: boolean;
  label: string;
}

export interface ViewState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

export interface ChartState {
  nodes: ChartNode[];
  edges: ChartEdge[];
  viewState: ViewState;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  connectingFromId: string | null;
  isDragging: boolean;
  dragNodeId: string | null;
  isSaved: boolean;
  lastSaved: number | null;
  snapFlashNodeId: string | null;

  addNode: (node: Partial<ChartNode>) => void;
  updateNode: (id: string, updates: Partial<ChartNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: Partial<ChartEdge>) => void;
  updateEdge: (id: string, updates: Partial<ChartEdge>) => void;
  deleteEdge: (id: string) => void;
  setViewState: (state: Partial<ViewState>) => void;
  resetView: () => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  startConnecting: (fromId: string) => void;
  cancelConnecting: () => void;
  clearChart: () => void;
  setDragging: (isDragging: boolean, nodeId: string | null) => void;
  setSnapFlash: (nodeId: string | null) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

export const COLORS = {
  primary: '#1976D2',
  background: '#F0F2F5',
  panelBg: '#F8F9FA',
  canvasBg: '#FFFFFF',
  gridLine: '#E8E8E8',
  border: '#E0E0E0',
  text: '#333333',
  success: '#4CAF50',
  modalBg: '#FAFAFA',
};

export const NODE_COLORS = [
  '#E3F2FD',
  '#F3E5F5',
  '#E8F5E9',
  '#FFF3E0',
  '#FFEBEE',
];

export const EMOJI_ICONS = [
  '📊', '📈', '📉', '🎯', '💡', '🔍', '⚡', '🔥',
  '🎨', '📝', '📌', '🎪', '🚀', '⭐', '❤️', '💎',
  '🔗', '📁', '📂', '🗂️', '🧠', '🎓', '🏆', '🎭',
  '🌐', '📍', '📱', '💻', '🖥️', '☁️', '🔒', '✅',
];

export const CONFIG = {
  PANEL_WIDTH: 320,
  GRID_SIZE: 40,
  SNAP_DISTANCE: 15,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 2.0,
  DEFAULT_ZOOM: 1.0,
  AUTO_SAVE_DELAY: 1500,
  TOAST_DURATION: 1500,
  EXPORT_WIDTH: 1920,
  EXPORT_HEIGHT: 1080,
  DEFAULT_NODE_WIDTH: 140,
  DEFAULT_NODE_HEIGHT: 80,
  EDGE_LABEL_FONT_SIZE: 14,
  DRAG_LIFT_OFFSET: 10,
  MOBILE_BREAKPOINT: 768,
};
