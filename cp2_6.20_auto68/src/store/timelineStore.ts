import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TimelineState, TimelineNode, ConnectionType, ThemeType, HistorySnapshot } from '@/types';

const MAX_HISTORY = 50;

export const useTimelineStore = create<TimelineState>((set, get) => {
  const createSnapshot = (): HistorySnapshot => ({
    nodes: JSON.parse(JSON.stringify(get().nodes)),
    connections: JSON.parse(JSON.stringify(get().connections)),
  });

  const pushHistory = () => {
    const state = get();
    const snapshot = createSnapshot();

    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push(snapshot);

    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    const newIndex = newHistory.length - 1;
    set({
      history: newHistory,
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: false,
    });
  };

  return {
    nodes: [],
    connections: [],
    selectedNodeId: null,
    currentTheme: 'minimal',
    history: [{ nodes: [], connections: [] }],
    historyIndex: 0,
    canUndo: false,
    canRedo: false,

    undo: () => {
      const state = get();
      if (state.historyIndex <= 0) return;

      const newIndex = state.historyIndex - 1;
      const snapshot = state.history[newIndex];

      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        connections: JSON.parse(JSON.stringify(snapshot.connections)),
        historyIndex: newIndex,
        canUndo: newIndex > 0,
        canRedo: true,
        selectedNodeId: null,
      });
    },

    redo: () => {
      const state = get();
      if (state.historyIndex >= state.history.length - 1) return;

      const newIndex = state.historyIndex + 1;
      const snapshot = state.history[newIndex];

      set({
        nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
        connections: JSON.parse(JSON.stringify(snapshot.connections)),
        historyIndex: newIndex,
        canUndo: true,
        canRedo: newIndex < state.history.length - 1,
        selectedNodeId: null,
      });
    },

    addNode: (nodeData) => {
      pushHistory();

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
      pushHistory();

      set((state) => ({
        nodes: state.nodes.map((node) =>
          node.id === id ? { ...node, ...updates } : node
        ),
      }));
    },

    deleteNode: (id) => {
      pushHistory();

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

      pushHistory();

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
      pushHistory();

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
  };
});
