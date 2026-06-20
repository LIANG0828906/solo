import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TimelineState, TimelineNode, ConnectionType, ThemeType } from '@/types';

export const useTimelineStore = create<TimelineState>((set, get) => ({
  nodes: [],
  connections: [],
  selectedNodeId: null,
  currentTheme: 'minimal',

  addNode: (nodeData) => {
    const newNode: TimelineNode = {
      id: uuidv4(),
      title: '新事件',
      date: new Date().toISOString().split('T')[0],
      description: '请在此输入事件描述...',
      x: 50,
      y: 50,
      expanded: false,
      isNew: true,
      ...nodeData,
    };
    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: newNode.id,
    }));
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      connections: state.connections.filter(
        (conn) => conn.fromId !== id && conn.toId !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  selectNode: (id) => {
    set({ selectedNodeId: id });
  },

  toggleExpand: (id) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, expanded: !node.expanded } : node
      ),
    }));
  },

  addConnection: (fromId, toId, type) => {
    const state = get();
    const exists = state.connections.some(
      (c) =>
        (c.fromId === fromId && c.toId === toId) ||
        (c.fromId === toId && c.toId === fromId)
    );
    if (exists || fromId === toId) return;

    const newConnection = {
      id: uuidv4(),
      fromId,
      toId,
      type: type as ConnectionType,
    };
    set((state) => ({
      connections: [...state.connections, newConnection],
    }));
  },

  deleteConnection: (id) => {
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id),
    }));
  },

  setTheme: (theme: ThemeType) => {
    set({ currentTheme: theme });
  },

  clearNewFlag: (id) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, isNew: false } : node
      ),
    }));
  },
}));
