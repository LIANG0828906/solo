import { create } from 'zustand';
import { IdeaNode, CanvasState, EditingState, NODE_COLORS } from '../types';

interface IdeaStore {
  nodes: IdeaNode[];
  canvas: CanvasState;
  editingNodes: EditingState[];
  selectedNodeIds: string[];
  searchQuery: string;
  setNodes: (nodes: IdeaNode[]) => void;
  addNode: (node: IdeaNode) => void;
  updateNode: (id: string, updates: Partial<IdeaNode>) => void;
  deleteNode: (id: string) => void;
  connectNodes: (sourceId: string, targetId: string) => void;
  setCanvas: (canvas: Partial<CanvasState>) => void;
  setEditingNode: (nodeId: string | null, userId: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  setSearchQuery: (query: string) => void;
  getRandomColor: () => string;
  groupNodes: (nodeIds: string[], groupId: string) => void;
  ungroupNode: (groupId: string) => void;
  toggleCollapse: (groupId: string) => void;
}

export const useIdeaStore = create<IdeaStore>((set, get) => ({
  nodes: [],
  canvas: { scale: 1, offsetX: 0, offsetY: 0 },
  editingNodes: [],
  selectedNodeIds: [],
  searchQuery: '',

  setNodes: (nodes) => set({ nodes }),

  addNode: (node) => set((state) => ({ nodes: [...state.nodes, node] })),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
      )
    })),

  deleteNode: (id) =>
    set((state) => ({
      nodes: state.nodes
        .filter((n) => n.id !== id)
        .map((n) => ({
          ...n,
          connectedIds: n.connectedIds.filter((cid) => cid !== id)
        }))
    })),

  connectNodes: (sourceId, targetId) =>
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id === sourceId && !n.connectedIds.includes(targetId)) {
          return { ...n, connectedIds: [...n.connectedIds, targetId] };
        }
        return n;
      })
    })),

  setCanvas: (canvas) =>
    set((state) => ({ canvas: { ...state.canvas, ...canvas } })),

  setEditingNode: (nodeId, userId) =>
    set((state) => {
      if (nodeId === null) {
        return {
          editingNodes: state.editingNodes.filter((e) => e.userId !== userId)
        };
      }
      const existing = state.editingNodes.find((e) => e.userId === userId);
      if (existing) {
        return {
          editingNodes: state.editingNodes.map((e) =>
            e.userId === userId ? { ...e, nodeId } : e
          )
        };
      }
      return { editingNodes: [...state.editingNodes, { nodeId, userId }] };
    }),

  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  getRandomColor: () => {
    const colors = NODE_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  },

  groupNodes: (nodeIds, groupId) =>
    set((state) => {
      const groupNodes = state.nodes.filter((n) => nodeIds.includes(n.id));
      if (groupNodes.length === 0) return state;

      const avgX = groupNodes.reduce((sum, n) => sum + n.x, 0) / groupNodes.length;
      const avgY = groupNodes.reduce((sum, n) => sum + n.y, 0) / groupNodes.length;

      const groupNode: IdeaNode = {
        id: groupId,
        title: '分组',
        description: '',
        color: '#6C63FF',
        tags: [],
        x: avgX,
        y: avgY,
        connectedIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isGroup: true,
        groupNodeIds: nodeIds,
        isCollapsed: false
      };

      return {
        nodes: [
          ...state.nodes.map((n) =>
            nodeIds.includes(n.id) ? { ...n, parentGroupId: groupId } : n
          ),
          groupNode
        ]
      };
    }),

  ungroupNode: (groupId) =>
    set((state) => ({
      nodes: state.nodes
        .filter((n) => n.id !== groupId)
        .map((n) =>
          n.parentGroupId === groupId ? { ...n, parentGroupId: undefined } : n
        )
    })),

  toggleCollapse: (groupId) =>
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === groupId ? { ...n, isCollapsed: !n.isCollapsed } : n
      )
    }))
}));
