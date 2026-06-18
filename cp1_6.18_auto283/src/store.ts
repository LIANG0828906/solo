import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Node {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  fromId: string;
  toId: string;
}

const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#C084FC'];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface StoreState {
  nodes: Node[];
  connections: Connection[];
  addNode: (x: number, y: number) => void;
  deleteNode: (id: string) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  updateNodeText: (id: string, text: string) => void;
  addConnection: (fromId: string, toId: string) => void;
  deleteConnection: (id: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  nodes: [],
  connections: [],

  addNode: (x: number, y: number) =>
    set((state) => {
      if (state.nodes.length >= 30) return state;
      return {
        nodes: [
          ...state.nodes,
          {
            id: uuidv4(),
            text: '新想法',
            color: getRandomColor(),
            x: x - 60,
            y: y - 40
          }
        ]
      };
    }),

  deleteNode: (id: string) =>
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      connections: state.connections.filter(
        (conn) => conn.fromId !== id && conn.toId !== id
      )
    })),

  updateNodePosition: (id: string, x: number, y: number) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, x, y } : node
      )
    })),

  updateNodeText: (id: string, text: string) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, text: text.slice(0, 40) } : node
      )
    })),

  addConnection: (fromId: string, toId: string) =>
    set((state) => {
      if (fromId === toId) return state;
      if (state.connections.length >= 50) return state;
      const exists = state.connections.some(
        (conn) =>
          (conn.fromId === fromId && conn.toId === toId) ||
          (conn.fromId === toId && conn.toId === fromId)
      );
      if (exists) return state;
      return {
        connections: [
          ...state.connections,
          { id: uuidv4(), fromId, toId }
        ]
      };
    }),

  deleteConnection: (id: string) =>
    set((state) => ({
      connections: state.connections.filter((conn) => conn.id !== id)
    }))
}));
