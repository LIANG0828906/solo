import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  ChartState,
  ChartNode,
  ChartEdge,
  ViewState,
  CONFIG,
  NODE_COLORS,
} from '@/types';

const STORAGE_KEY = 'infographic-editor-data';

const initialViewState: ViewState = {
  zoom: CONFIG.DEFAULT_ZOOM,
  offsetX: 0,
  offsetY: 0,
};

interface PersistedData {
  nodes: ChartNode[];
  edges: ChartEdge[];
  viewState: ViewState;
  timestamp: number;
}

let saveTimeout: NodeJS.Timeout | null = null;
let onSaveCallback: (() => void) | null = null;

export const setOnSaveCallback = (callback: () => void) => {
  onSaveCallback = callback;
};

export const useChartStore = create<ChartState>((set, get) => ({
  nodes: [],
  edges: [],
  viewState: initialViewState,
  selectedNodeId: null,
  selectedEdgeId: null,
  connectingFromId: null,
  isDragging: false,
  dragNodeId: null,
  isSaved: true,
  lastSaved: null,
  snapFlashNodeId: null,

  addNode: (node: Partial<ChartNode>) => {
    const newNode: ChartNode = {
      id: uuidv4(),
      x: node.x ?? 200,
      y: node.y ?? 200,
      width: node.width ?? CONFIG.DEFAULT_NODE_WIDTH,
      height: node.height ?? CONFIG.DEFAULT_NODE_HEIGHT,
      text: node.text ?? '新节点',
      bgColor: node.bgColor ?? NODE_COLORS[get().nodes.length % NODE_COLORS.length],
      borderRadius: node.borderRadius ?? 'round',
      borderStyle: node.borderStyle ?? 'none',
      icon: node.icon ?? '📝',
    };

    set(state => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
      selectedEdgeId: null,
      isSaved: false,
    }));

    get().scheduleSave();
  },

  updateNode: (id: string, updates: Partial<ChartNode>) => {
    set(state => ({
      nodes: state.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)),
      isSaved: false,
    }));
    get().scheduleSave();
  },

  deleteNode: (id: string) => {
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== id),
      edges: state.edges.filter(e => e.fromId !== id && e.toId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      connectingFromId: state.connectingFromId === id ? null : state.connectingFromId,
      isSaved: false,
    }));
    get().scheduleSave();
  },

  addEdge: (edge: Partial<ChartEdge>) => {
    if (!edge.fromId || !edge.toId || edge.fromId === edge.toId) return;

    const exists = get().edges.some(
      e =>
        (e.fromId === edge.fromId && e.toId === edge.toId) ||
        (e.fromId === edge.toId && e.toId === edge.fromId)
    );

    if (exists) return;

    const newEdge: ChartEdge = {
      id: uuidv4(),
      fromId: edge.fromId,
      toId: edge.toId,
      style: edge.style ?? 'bezier',
      color: edge.color ?? '#1976D2',
      width: edge.width ?? 2,
      arrow: edge.arrow ?? true,
      label: edge.label ?? '',
    };

    set(state => ({
      edges: [...state.edges, newEdge],
      selectedEdgeId: newEdge.id,
      selectedNodeId: null,
      isSaved: false,
    }));

    get().scheduleSave();
  },

  updateEdge: (id: string, updates: Partial<ChartEdge>) => {
    set(state => ({
      edges: state.edges.map(e => (e.id === id ? { ...e, ...updates } : e)),
      isSaved: false,
    }));
    get().scheduleSave();
  },

  deleteEdge: (id: string) => {
    set(state => ({
      edges: state.edges.filter(e => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
      isSaved: false,
    }));
    get().scheduleSave();
  },

  setViewState: (state: Partial<ViewState>) => {
    set(prev => ({
      viewState: { ...prev.viewState, ...state },
    }));
  },

  resetView: () => {
    set({
      viewState: initialViewState,
    });
  },

  selectNode: (id: string | null) => {
    set({
      selectedNodeId: id,
      selectedEdgeId: null,
    });
  },

  selectEdge: (id: string | null) => {
    set({
      selectedEdgeId: id,
      selectedNodeId: null,
    });
  },

  startConnecting: (fromId: string) => {
    set({
      connectingFromId: fromId,
      selectedNodeId: fromId,
    });
  },

  cancelConnecting: () => {
    set({
      connectingFromId: null,
    });
  },

  clearChart: () => {
    set({
      nodes: [],
      edges: [],
      viewState: initialViewState,
      selectedNodeId: null,
      selectedEdgeId: null,
      connectingFromId: null,
      isDragging: false,
      dragNodeId: null,
      isSaved: false,
    });
    get().scheduleSave();
  },

  setDragging: (isDragging: boolean, nodeId: string | null) => {
    set({
      isDragging,
      dragNodeId: nodeId,
    });
  },

  setSnapFlash: (nodeId: string | null) => {
    set({ snapFlashNodeId: nodeId });
    if (nodeId) {
      setTimeout(() => {
        set({ snapFlashNodeId: null });
      }, 100);
    }
  },

  scheduleSave: () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(() => {
      get().saveToLocalStorage();
    }, CONFIG.AUTO_SAVE_DELAY);
  },

  saveToLocalStorage: () => {
    try {
      const { nodes, edges, viewState } = get();
      const data: PersistedData = {
        nodes,
        edges,
        viewState,
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      set({ isSaved: true, lastSaved: Date.now() });
      onSaveCallback?.();
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  loadFromLocalStorage: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const data: PersistedData = JSON.parse(saved);
        set({
          nodes: data.nodes || [],
          edges: data.edges || [],
          viewState: data.viewState || initialViewState,
          isSaved: true,
          lastSaved: data.timestamp || null,
        });
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  },
}));
