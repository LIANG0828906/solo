import { create } from 'zustand';
import type { DreamNode, DreamConnection, LogEntry, RippleData } from '@/types/dream';

const DREAM_COLORS = [
  { main: '#9b59b6', glow: '#c084fc' },
  { main: '#ff6b6b', glow: '#fca5a5' },
  { main: '#06b6d4', glow: '#67e8f9' },
  { main: '#a855f7', glow: '#d8b4fe' },
  { main: '#ec4899', glow: '#f472b6' },
  { main: '#22d3ee', glow: '#67e8f9' },
];

interface DreamState {
  nodes: DreamNode[];
  connections: DreamConnection[];
  dreamIntensity: number;
  logs: LogEntry[];
  selectedNodeId: string | null;
  ripples: RippleData[];
  cameraRef: { current: any | null };
  controlsRef: { current: any | null };

  addNode: (position: [number, number, number]) => void;
  updateNodePosition: (id: string, position: [number, number, number]) => void;
  setDreamIntensity: (intensity: number) => void;
  addLog: (type: 'create' | 'drag' | 'click', message: string, nodeId?: string) => void;
  setSelectedNode: (id: string | null) => void;
  addRipple: (position: [number, number, number], color: string) => void;
  removeRipple: (id: string) => void;
  resetCamera: () => void;
  setCameraRef: (ref: any) => void;
  setControlsRef: (ref: any) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const findNearestNodes = (
  newNode: DreamNode,
  existingNodes: DreamNode[],
  count: number = 2
): DreamNode[] => {
  return [...existingNodes]
    .filter((n) => n.id !== newNode.id)
    .sort((a, b) => {
      const distA = Math.sqrt(
        Math.pow(a.position[0] - newNode.position[0], 2) +
        Math.pow(a.position[1] - newNode.position[1], 2) +
        Math.pow(a.position[2] - newNode.position[2], 2)
      );
      const distB = Math.sqrt(
        Math.pow(b.position[0] - newNode.position[0], 2) +
        Math.pow(b.position[1] - newNode.position[1], 2) +
        Math.pow(b.position[2] - newNode.position[2], 2)
      );
      return distA - distB;
    })
    .slice(0, count);
};

export const useDreamStore = create<DreamState>((set, get) => ({
  nodes: [],
  connections: [],
  dreamIntensity: 50,
  logs: [],
  selectedNodeId: null,
  ripples: [],
  cameraRef: { current: null },
  controlsRef: { current: null },

  addNode: (position) => {
    const colorPair = DREAM_COLORS[Math.floor(Math.random() * DREAM_COLORS.length)];
    const newNode: DreamNode = {
      id: generateId(),
      position: [...position] as [number, number, number],
      basePosition: [...position] as [number, number, number],
      color: colorPair.main,
      glowColor: colorPair.glow,
      createdAt: Date.now(),
    };

    const state = get();
    const nearestNodes = findNearestNodes(newNode, state.nodes);
    const newConnections: DreamConnection[] = nearestNodes.map((node) => ({
      id: generateId(),
      from: newNode.id,
      to: node.id,
    }));

    set((state) => ({
      nodes: [...state.nodes, newNode],
      connections: [...state.connections, ...newConnections],
    }));

    get().addLog('create', `创建梦境节点 #${newNode.id.slice(0, 4)}`, newNode.id);
  },

  updateNodePosition: (id, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id
          ? { ...node, position: [...position] as [number, number, number], basePosition: [...position] as [number, number, number] }
          : node
      ),
    }));
  },

  setDreamIntensity: (intensity) => {
    set({ dreamIntensity: Math.max(0, Math.min(100, intensity)) });
  },

  addLog: (type, message, nodeId) => {
    const entry: LogEntry = {
      id: generateId(),
      type,
      message,
      timestamp: new Date(),
      nodeId,
    };
    set((state) => ({
      logs: [entry, ...state.logs].slice(0, 5),
    }));
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  addRipple: (position, color) => {
    const ripple: RippleData = {
      id: generateId(),
      position: [...position] as [number, number, number],
      color,
      startTime: Date.now(),
    };
    set((state) => ({
      ripples: [...state.ripples, ripple],
    }));

    setTimeout(() => {
      get().removeRipple(ripple.id);
    }, 2000);
  },

  removeRipple: (id) => {
    set((state) => ({
      ripples: state.ripples.filter((r) => r.id !== id),
    }));
  },

  resetCamera: () => {
    const { controlsRef } = get();
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  },

  setCameraRef: (ref) => {
    set((state) => ({
      cameraRef: { ...state.cameraRef, current: ref },
    }));
  },

  setControlsRef: (ref) => {
    set((state) => ({
      controlsRef: { ...state.controlsRef, current: ref },
    }));
  },
}));
