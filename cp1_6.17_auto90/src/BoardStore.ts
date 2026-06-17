import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Shape, ToolType, User } from './types';

type BroadcastFn = (type: 'add' | 'update' | 'delete', shape: Shape | { id: string }) => void;

interface BoardState {
  shapes: Shape[];
  selectedId: string | null;
  currentTool: ToolType;
  zoom: number;
  pan: { x: number; y: number };
  currentUser: User;
  onlineUsers: User[];
  isPanning: boolean;
  spacePressed: boolean;

  setTool: (tool: ToolType) => void;
  setSelectedId: (id: string | null) => void;
  addShape: (shapeData: Omit<Shape, 'id' | 'createdAt' | 'createdBy'>, broadcast?: boolean) => Shape;
  updateShape: (id: string, updates: Partial<Shape>, broadcast?: boolean) => void;
  deleteShape: (id: string, broadcast?: boolean) => void;
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  setSpacePressed: (pressed: boolean) => void;
  setIsPanning: (panning: boolean) => void;
  loadSnapshot: (shapes: Shape[]) => void;
  setPulseSync: (id: string, value: boolean) => void;
  setBroadcastFn: (fn: BroadcastFn) => void;
}

const DEFAULT_USER: User = {
  id: 'user-' + uuidv4().slice(0, 8),
  name: '用户' + Math.floor(Math.random() * 1000),
  avatar: '👤',
  color: '#4A90D9',
};

const MOCK_USERS: User[] = [
  { id: 'user-mock-1', name: '小A', avatar: '🧑', color: '#FF6B6B' },
  { id: 'user-mock-2', name: '小B', avatar: '👩', color: '#4ECDC4' },
];

let broadcastFn: BroadcastFn = () => {};

export const useBoardStore = create<BoardState>((set, get) => ({
  shapes: [],
  selectedId: null,
  currentTool: 'select',
  zoom: 1,
  pan: { x: 0, y: 0 },
  currentUser: DEFAULT_USER,
  onlineUsers: [DEFAULT_USER, ...MOCK_USERS],
  isPanning: false,
  spacePressed: false,

  setTool: (tool) => set({ currentTool: tool }),
  setSelectedId: (id) => set({ selectedId: id }),
  setZoom: (zoom) => set({ zoom: Math.max(0.3, Math.min(3.0, zoom)) }),
  setPan: (pan) => set({ pan }),
  setSpacePressed: (pressed) => set({ spacePressed: pressed }),
  setIsPanning: (panning) => set({ isPanning: panning }),

  addShape: (shapeData, broadcast = true) => {
    const newShape: Shape = {
      ...shapeData,
      id: uuidv4(),
      createdAt: Date.now(),
      createdBy: get().currentUser.id,
    };
    set((state) => ({ shapes: [...state.shapes, newShape] }));
    if (broadcast) {
      setTimeout(() => broadcastFn('add', newShape), 150);
    }
    return newShape;
  },

  updateShape: (id, updates, broadcast = true) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
    if (broadcast) {
      const shape = get().shapes.find((s) => s.id === id);
      if (shape) {
        setTimeout(() => broadcastFn('update', shape), 150);
      }
    }
  },

  deleteShape: (id, broadcast = true) => {
    const shape = get().shapes.find((s) => s.id === id);
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
    if (broadcast && shape) {
      setTimeout(() => broadcastFn('delete', { id }), 150);
    }
  },

  loadSnapshot: (shapes) => {
    set({ shapes, selectedId: null });
  },

  setPulseSync: (id, value) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, pulseSync: value } : s
      ),
    }));
  },

  setBroadcastFn: (fn) => {
    broadcastFn = fn;
  },
}));
