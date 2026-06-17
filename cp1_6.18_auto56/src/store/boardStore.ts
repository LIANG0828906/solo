import { create } from 'zustand';
import type { IdeaNode, Connection, TempConnection } from '@/shared/types';

interface BoardStore {
  nodes: IdeaNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  zoom: number;
  pan: { x: number; y: number };
  isDraggingCanvas: boolean;
  dragStart: { x: number; y: number } | null;
  draggingNodeId: string | null;
  dragOffset: { x: number; y: number };
  isCreatingConnection: boolean;
  tempConnection: TempConnection | null;
  showNodePanel: boolean;
  panelNodeId: string | null;
  panelPosition: { x: number; y: number };
  showDeleteConfirm: boolean;
  deleteNodeId: string | null;
  showNodeList: boolean;
  searchQuery: string;
  sortType: 'time' | 'votes';
  animatingNodeIds: Set<string>;
  setNodes: (nodes: IdeaNode[]) => void;
  setConnections: (connections: Connection[]) => void;
  addNode: (node: IdeaNode) => void;
  updateNode: (id: string, updates: Partial<IdeaNode>) => void;
  removeNode: (id: string) => void;
  addConnection: (connection: Connection) => void;
  removeConnection: (id: string) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  selectNode: (id: string | null) => void;
  setIsDraggingCanvas: (dragging: boolean) => void;
  setDragStart: (point: { x: number; y: number } | null) => void;
  setDraggingNodeId: (id: string | null) => void;
  setDragOffset: (offset: { x: number; y: number }) => void;
  setIsCreatingConnection: (creating: boolean) => void;
  setTempConnection: (conn: TempConnection | null) => void;
  setShowNodePanel: (show: boolean) => void;
  setPanelNodeId: (id: string | null) => void;
  setPanelPosition: (pos: { x: number; y: number }) => void;
  setShowDeleteConfirm: (show: boolean) => void;
  setDeleteNodeId: (id: string | null) => void;
  toggleNodeList: () => void;
  setSearchQuery: (query: string) => void;
  setSortType: (type: 'time' | 'votes') => void;
  addAnimatingNode: (id: string) => void;
  removeAnimatingNode: (id: string) => void;
  resetView: () => void;
}

export const useBoardStore = create<BoardStore>((set) => ({
  nodes: [],
  connections: [],
  selectedNodeId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  isDraggingCanvas: false,
  dragStart: null,
  draggingNodeId: null,
  dragOffset: { x: 0, y: 0 },
  isCreatingConnection: false,
  tempConnection: null,
  showNodePanel: false,
  panelNodeId: null,
  panelPosition: { x: 0, y: 0 },
  showDeleteConfirm: false,
  deleteNodeId: null,
  showNodeList: false,
  searchQuery: '',
  sortType: 'time',
  animatingNodeIds: new Set(),

  setNodes: (nodes) => set({ nodes }),
  setConnections: (connections) => set({ connections }),
  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),
  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      connections: state.connections.filter(
        (c) => c.fromNodeId !== id && c.toNodeId !== id
      ),
    })),
  addConnection: (connection) =>
    set((state) => ({ connections: [...state.connections, connection] })),
  removeConnection: (id) =>
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
    })),
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  selectNode: (id) => set({ selectedNodeId: id }),
  setIsDraggingCanvas: (dragging) => set({ isDraggingCanvas: dragging }),
  setDragStart: (point) => set({ dragStart: point }),
  setDraggingNodeId: (id) => set({ draggingNodeId: id }),
  setDragOffset: (offset) => set({ dragOffset: offset }),
  setIsCreatingConnection: (creating) => set({ isCreatingConnection: creating }),
  setTempConnection: (conn) => set({ tempConnection: conn }),
  setShowNodePanel: (show) => set({ showNodePanel: show }),
  setPanelNodeId: (id) => set({ panelNodeId: id }),
  setPanelPosition: (pos) => set({ panelPosition: pos }),
  setShowDeleteConfirm: (show) => set({ showDeleteConfirm: show }),
  setDeleteNodeId: (id) => set({ deleteNodeId: id }),
  toggleNodeList: () => set((state) => ({ showNodeList: !state.showNodeList })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSortType: (type) => set({ sortType: type }),
  addAnimatingNode: (id) =>
    set((state) => {
      const newSet = new Set(state.animatingNodeIds);
      newSet.add(id);
      return { animatingNodeIds: newSet };
    }),
  removeAnimatingNode: (id) =>
    set((state) => {
      const newSet = new Set(state.animatingNodeIds);
      newSet.delete(id);
      return { animatingNodeIds: newSet };
    }),
  resetView: () => set({ zoom: 1, pan: { x: 0, y: 0 } }),
}));
