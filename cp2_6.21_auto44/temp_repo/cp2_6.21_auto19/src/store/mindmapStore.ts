import { create } from 'zustand';
import { MindmapNode, Task, MindmapEdge } from '../types';

interface MindmapState {
  nodes: MindmapNode[];
  tasks: Task[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  zoom: number;
  position: { x: number; y: number };
  isSaving: boolean;
  saveToast: boolean;

  addNode: (node: Omit<MindmapNode, 'created_at' | 'updated_at'>) => void;
  updateNode: (id: string, updates: Partial<MindmapNode>) => void;
  deleteNode: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedEdge: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  setPosition: (pos: { x: number; y: number }) => void;

  addTask: (task: Omit<Task, 'created_at' | 'updated_at'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTask: (id: string) => void;

  getTasksForNode: (nodeId: string) => Task[];
  getHighestPriorityForNode: (nodeId: string) => 'high' | 'medium' | 'low' | null;

  clearAll: () => void;
  loadMindmap: (nodes: MindmapNode[], tasks: Task[]) => void;

  setSaving: (val: boolean) => void;
  showSaveToast: () => void;
  hideSaveToast: () => void;

  getEdges: () => MindmapEdge[];
}

export const useMindmapStore = create<MindmapState>((set, get) => ({
  nodes: [],
  tasks: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  zoom: 1,
  position: { x: 0, y: 0 },
  isSaving: false,
  saveToast: false,

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
    })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      tasks: state.tasks.filter((t) => t.node_id !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    })),

  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setSelectedEdge: (id) => set({ selectedEdgeId: id }),
  setZoom: (zoom) => set({ zoom }),
  setPosition: (pos) => set({ position: pos }),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),

  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      ),
    })),

  getTasksForNode: (nodeId) => {
    return get().tasks.filter((t) => t.node_id === nodeId);
  },

  getHighestPriorityForNode: (nodeId) => {
    const tasks = get().tasks.filter((t) => t.node_id === nodeId && !t.completed);
    if (tasks.length === 0) return null;
    if (tasks.some((t) => t.priority === 'high')) return 'high';
    if (tasks.some((t) => t.priority === 'medium')) return 'medium';
    return 'low';
  },

  clearAll: () =>
    set({
      nodes: [],
      tasks: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    }),

  loadMindmap: (nodes, tasks) =>
    set({
      nodes,
      tasks,
      selectedNodeId: null,
      selectedEdgeId: null,
    }),

  setSaving: (val) => set({ isSaving: val }),
  showSaveToast: () => {
    set({ saveToast: true });
    setTimeout(() => set({ saveToast: false }), 2000);
  },
  hideSaveToast: () => set({ saveToast: false }),

  getEdges: () => {
    const edges: MindmapEdge[] = [];
    const nodes = get().nodes;
    nodes.forEach((node) => {
      if (node.parent_id) {
        edges.push({
          id: `edge-${node.parent_id}-${node.id}`,
          source: node.parent_id,
          target: node.id,
        });
      }
    });
    return edges;
  },
}));
