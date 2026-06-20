import { create } from 'zustand';
import { DebateNode, DebateEdge, NodeType, Side } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface DebateState {
  nodes: DebateNode[];
  edges: DebateEdge[];
  selectedNodeId: string | null;
  modalOpen: boolean;
  editingNode: DebateNode | null;
  side: Side;
  newNodePosition: { x: number; y: number } | null;

  addNode: (title: string, content: string, type: NodeType, x: number, y: number) => void;
  updateNode: (id: string, updates: Partial<DebateNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (sourceId: string, targetId: string, type: 'support' | 'refute') => void;
  deleteEdge: (id: string) => void;
  selectNode: (id: string | null) => void;
  openModal: (node?: DebateNode, position?: { x: number; y: number }) => void;
  closeModal: () => void;
  clearCanvas: () => void;
  setSide: (side: Side) => void;
  loadFromServer: (nodes: DebateNode[], edges: DebateEdge[]) => void;
  moveNode: (id: string, x: number, y: number) => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  modalOpen: false,
  editingNode: null,
  side: 'pro',
  newNodePosition: null,

  addNode: (title, content, type, x, y) => {
    const node: DebateNode = {
      id: uuidv4(),
      title,
      content,
      type,
      x,
      y,
    };
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  addEdge: (sourceId, targetId, type) => {
    const exists = useDebateStore.getState().edges.some(
      (e) => e.sourceId === sourceId && e.targetId === targetId
    );
    if (exists || sourceId === targetId) return;
    const edge: DebateEdge = {
      id: uuidv4(),
      sourceId,
      targetId,
      type,
    };
    set((state) => ({ edges: [...state.edges, edge] }));
  },

  deleteEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
    }));
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  openModal: (node, position) => {
    set({
      modalOpen: true,
      editingNode: node || null,
      newNodePosition: position || null,
    });
  },

  closeModal: () => {
    set({ modalOpen: false, editingNode: null, newNodePosition: null });
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], selectedNodeId: null });
  },

  setSide: (side) => {
    set({ side });
  },

  loadFromServer: (nodes, edges) => {
    set({ nodes, edges });
  },

  moveNode: (id, x, y) => {
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
  },
}));
