import { create } from 'zustand';

export type ActionType = 'cut' | 'boil' | 'bake' | 'stew' | 'mix' | 'steam' | 'fry' | 'other';

export interface FlowNode {
  id: string;
  stepNumber: number;
  description: string;
  ingredients: string[];
  tools: string[];
  duration: string;
  actionType: ActionType;
  x: number;
  y: number;
  isNew?: boolean;
}

interface FlowState {
  nodes: FlowNode[];
  scale: number;
  offsetX: number;
  offsetY: number;
  selectedNodeId: string | null;
  editingNodeId: string | null;
  addNode: (node: FlowNode) => void;
  removeNode: (id: string) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  setNodes: (nodes: FlowNode[]) => void;
  setScale: (scale: number) => void;
  setOffset: (x: number, y: number) => void;
  setSelectedNode: (id: string | null) => void;
  setEditingNode: (id: string | null) => void;
  insertNodeAfter: (afterId: string, node: FlowNode) => void;
  moveNode: (id: string, dx: number, dy: number) => void;
}

const renumber = (nodes: FlowNode[]): FlowNode[] =>
  nodes
    .sort((a, b) => a.stepNumber - b.stepNumber)
    .map((n, i) => ({ ...n, stepNumber: i + 1 }));

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [],
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  selectedNodeId: null,
  editingNodeId: null,

  addNode: (node) =>
    set((state) => ({
      nodes: renumber([...state.nodes, node]),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: renumber(state.nodes.filter((n) => n.id !== id)),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      editingNodeId: state.editingNodeId === id ? null : state.editingNodeId,
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),

  setNodes: (nodes) =>
    set(() => ({
      nodes: renumber(nodes),
    })),

  setScale: (scale) =>
    set(() => ({
      scale: Math.min(3.0, Math.max(0.5, scale)),
    })),

  setOffset: (x, y) =>
    set(() => ({
      offsetX: x,
      offsetY: y,
    })),

  setSelectedNode: (id) =>
    set(() => ({
      selectedNodeId: id,
    })),

  setEditingNode: (id) =>
    set(() => ({
      editingNodeId: id,
    })),

  insertNodeAfter: (afterId, node) =>
    set((state) => {
      const index = state.nodes.findIndex((n) => n.id === afterId);
      if (index === -1) return state;
      const newNodes = [...state.nodes];
      newNodes.splice(index + 1, 0, { ...node, stepNumber: index + 2 });
      return { nodes: renumber(newNodes) };
    }),

  moveNode: (id, dx, dy) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, x: n.x + dx, y: n.y + dy } : n
      ),
    })),
}));
