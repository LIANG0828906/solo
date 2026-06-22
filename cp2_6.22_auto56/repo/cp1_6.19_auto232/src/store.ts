import { create } from 'zustand';
import type { Bubble, Connection, Report, InteractionState, ToolMode } from './types';
import {
  COLOR_PALETTE,
  DEFAULT_BUBBLE_DIAMETER,
  DEFAULT_OPACITY,
  CONNECTION_COLOR,
  CONNECTION_WIDTH,
  LABEL_PRESETS,
} from './constants';

interface AppState extends InteractionState {
  bubbles: Bubble[];
  connections: Connection[];
  report: Report | null;

  addBubble: (x: number, y: number) => void;
  updateBubble: (id: string, patch: Partial<Bubble>) => void;
  removeBubble: (id: string) => void;

  addConnection: (sourceId: string, targetId: string) => void;
  updateConnection: (id: string, patch: Partial<Connection>) => void;
  removeConnection: (id: string) => void;

  setReport: (report: Report | null) => void;

  setToolMode: (mode: ToolMode) => void;
  selectBubble: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  setDragging: (v: boolean) => void;
  setResizing: (v: boolean) => void;
  setConnectingFromId: (id: string | null) => void;
}

const generateId = () => Math.random().toString(36).slice(2, 10);

export const useAppStore = create<AppState>((set, get) => ({
  bubbles: [],
  connections: [],
  report: null,

  toolMode: 'select',
  selectedBubbleId: null,
  selectedConnectionId: null,
  isDragging: false,
  isResizing: false,
  connectingFromId: null,

  addBubble: (x: number, y: number) => {
    const createdAt = Date.now();
    const colorIndex = createdAt % COLOR_PALETTE.length;
    const newBubble: Bubble = {
      id: generateId(),
      x,
      y,
      diameter: DEFAULT_BUBBLE_DIAMETER,
      name: '气泡',
      color: COLOR_PALETTE[colorIndex],
      opacity: DEFAULT_OPACITY,
      rotation: 0,
      createdAt,
    };
    set((state) => ({
      bubbles: [...state.bubbles, newBubble],
      selectedBubbleId: newBubble.id,
      selectedConnectionId: null,
    }));
  },

  updateBubble: (id: string, patch: Partial<Bubble>) => {
    set((state) => ({
      bubbles: state.bubbles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  },

  removeBubble: (id: string) => {
    set((state) => ({
      bubbles: state.bubbles.filter((b) => b.id !== id),
      connections: state.connections.filter(
        (c) => c.sourceId !== id && c.targetId !== id
      ),
      selectedBubbleId: state.selectedBubbleId === id ? null : state.selectedBubbleId,
      selectedConnectionId: state.connections.some(
        (c) =>
          c.id === state.selectedConnectionId &&
          (c.sourceId === id || c.targetId === id)
      )
        ? null
        : state.selectedConnectionId,
      connectingFromId: state.connectingFromId === id ? null : state.connectingFromId,
    }));
  },

  addConnection: (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const exists = get().connections.some(
      (c) =>
        (c.sourceId === sourceId && c.targetId === targetId) ||
        (c.sourceId === targetId && c.targetId === sourceId)
    );
    if (exists) return;
    const newConnection: Connection = {
      id: generateId(),
      sourceId,
      targetId,
      label: LABEL_PRESETS[0],
      style: 'straight',
      color: CONNECTION_COLOR,
      width: CONNECTION_WIDTH,
    };
    set((state) => ({
      connections: [...state.connections, newConnection],
      selectedConnectionId: newConnection.id,
      selectedBubbleId: null,
      connectingFromId: null,
    }));
  },

  updateConnection: (id: string, patch: Partial<Connection>) => {
    set((state) => ({
      connections: state.connections.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    }));
  },

  removeConnection: (id: string) => {
    set((state) => ({
      connections: state.connections.filter((c) => c.id !== id),
      selectedConnectionId:
        state.selectedConnectionId === id ? null : state.selectedConnectionId,
    }));
  },

  setReport: (report: Report | null) => {
    set({ report });
  },

  setToolMode: (mode: ToolMode) => {
    set({
      toolMode: mode,
      selectedBubbleId: null,
      selectedConnectionId: null,
      connectingFromId: null,
    });
  },

  selectBubble: (id: string | null) => {
    set({ selectedBubbleId: id, selectedConnectionId: null });
  },

  selectConnection: (id: string | null) => {
    set({ selectedConnectionId: id, selectedBubbleId: null });
  },

  setDragging: (v: boolean) => {
    set({ isDragging: v });
  },

  setResizing: (v: boolean) => {
    set({ isResizing: v });
  },

  setConnectingFromId: (id: string | null) => {
    set({ connectingFromId: id });
  },
}));
