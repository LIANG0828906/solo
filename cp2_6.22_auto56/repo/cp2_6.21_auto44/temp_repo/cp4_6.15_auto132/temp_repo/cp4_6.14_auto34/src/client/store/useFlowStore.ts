import { create } from 'zustand';
import type { FlowNode, FlowEdge, User, CursorPosition, Snapshot } from '../../types';

interface FlowState {
  nodes: FlowNode[];
  edges: FlowEdge[];
  users: User[];
  cursors: Map<string, CursorPosition>;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  snapshots: Snapshot[];
  isReadOnly: boolean;
  viewport: { x: number; y: number; scale: number };
  isRestoreAnimating: boolean;
  
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  setUsers: (users: User[]) => void;
  addNode: (node: FlowNode) => void;
  updateNode: (id: string, updates: Partial<FlowNode>) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: FlowEdge) => void;
  updateEdge: (id: string, updates: Partial<FlowEdge>) => void;
  deleteEdge: (id: string) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateCursor: (userId: string, x: number, y: number) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  setSnapshots: (snapshots: Snapshot[]) => void;
  addSnapshot: (snapshot: Snapshot) => void;
  setIsReadOnly: (readonly: boolean) => void;
  setViewport: (viewport: { x: number; y: number; scale: number }) => void;
  setIsRestoreAnimating: (animating: boolean) => void;
  reset: () => void;
}

export const useFlowStore = create<FlowState>((set) => ({
  nodes: [],
  edges: [],
  users: [],
  cursors: new Map(),
  selectedNodeId: null,
  selectedEdgeId: null,
  snapshots: [],
  isReadOnly: false,
  viewport: { x: 0, y: 0, scale: 1 },
  isRestoreAnimating: false,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setUsers: (users) => set({ users }),
  
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node],
  })),
  
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map((n) =>
      n.id === id ? { ...n, ...updates } : n
    ),
  })),
  
  deleteNode: (id) => set((state) => ({
    nodes: state.nodes.filter((n) => n.id !== id),
    edges: state.edges.filter((e) => e.sourceId !== id && e.targetId !== id),
    selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
  })),
  
  addEdge: (edge) => set((state) => ({
    edges: [...state.edges, edge],
  })),
  
  updateEdge: (id, updates) => set((state) => ({
    edges: state.edges.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    ),
  })),
  
  deleteEdge: (id) => set((state) => ({
    edges: state.edges.filter((e) => e.id !== id),
    selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
  })),
  
  addUser: (user) => set((state) => ({
    users: state.users.some((u) => u.id === user.id)
      ? state.users
      : [...state.users, user],
  })),
  
  removeUser: (userId) => set((state) => ({
    users: state.users.filter((u) => u.id !== userId),
    cursors: (() => {
      const newCursors = new Map(state.cursors);
      newCursors.delete(userId);
      return newCursors;
    })(),
  })),
  
  updateCursor: (userId, x, y) => set((state) => {
    const newCursors = new Map(state.cursors);
    newCursors.set(userId, { userId, x, y });
    return { cursors: newCursors };
  }),
  
  selectNode: (id) => set({ selectedNodeId: id, selectedEdgeId: id ? null : undefined }),
  selectEdge: (id) => set({ selectedEdgeId: id, selectedNodeId: id ? null : undefined }),
  
  setSnapshots: (snapshots) => set({ snapshots }),
  addSnapshot: (snapshot) => set((state) => ({
    snapshots: [snapshot, ...state.snapshots.filter((s) => s.id !== snapshot.id)],
  })),
  
  setIsReadOnly: (isReadOnly) => set({ isReadOnly }),
  
  setViewport: (viewport) => set({ viewport }),
  
  setIsRestoreAnimating: (isRestoreAnimating) => set({ isRestoreAnimating }),
  
  reset: () => set({
    nodes: [],
    edges: [],
    users: [],
    cursors: new Map(),
    selectedNodeId: null,
    selectedEdgeId: null,
    viewport: { x: 0, y: 0, scale: 1 },
  }),
}));
