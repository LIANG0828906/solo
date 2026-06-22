import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { MindNode, Connection, HistorySnapshot, NodeShape } from './types';
import { COLOR_PALETTE } from './types';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const deepClone = <T>(obj: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
};

const MAX_HISTORY = 50;

interface MindMapState {
  nodes: MindNode[];
  connections: Connection[];
  selectedNodeId: string | null;
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  roomCode: string | null;
  clientId: string;
  socket: Socket | null;
  _moveThrottleTimer: ReturnType<typeof setTimeout> | null;
  _pendingNodeIds: Set<string>;

  initSocket: () => void;
  pushHistory: () => void;
  addNode: (parentId: string, text?: string) => void;
  updateNode: (id: string, changes: Partial<MindNode>, pushHis?: boolean) => void;
  moveNode: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  undo: () => void;
  redo: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  markNodeRendered: (id: string) => void;
  isNodeNew: (id: string) => boolean;
}

const createRootNode = (): MindNode => ({
  id: generateId(),
  text: '中心主题',
  parentId: null,
  x: 0,
  y: 0,
  color: '#4FC3F7',
  shape: 'rounded-rect',
  fontSize: 16,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const useStore = create<MindMapState>((set, get) => {
  const rootNode = createRootNode();
  return {
    nodes: [rootNode],
    connections: [],
    selectedNodeId: null,
    undoStack: [],
    redoStack: [],
    roomCode: null,
    clientId: generateId(),
    socket: null,
    _moveThrottleTimer: null,
    _pendingNodeIds: new Set(),

    initSocket: () => {
      const socket = io('http://localhost:3000', {
        withCredentials: true,
        autoConnect: true,
        transports: ['websocket', 'polling'],
      });
      set({ socket });

      socket.on('connect', () => {
        console.log('Socket connected:', socket.id);
      });

      socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      socket.on('room-created', (data: { roomCode: string }) => {
        set({ roomCode: data.roomCode });
      });

      socket.on('join-error', (data: { error: string }) => {
        console.error('Join error:', data.error);
        alert(data.error);
      });

      socket.on('room-state', (data: { nodes: MindNode[]; connections: Connection[] }) => {
        if (data.nodes && data.nodes.length > 0) {
          set({
            nodes: data.nodes,
            connections: data.connections || [],
          });
        }
      });

      socket.on('node-added', (data: { node: MindNode; connection: Connection; clientId: string }) => {
        if (data.clientId === get().clientId) return;
        const pending = new Set(get()._pendingNodeIds);
        pending.add(data.node.id);
        set((state) => ({
          nodes: [...state.nodes, data.node],
          connections: [...state.connections, data.connection],
          _pendingNodeIds: pending,
        }));
      });

      socket.on('node-updated', (data: { id: string; changes: Partial<MindNode>; clientId: string }) => {
        if (data.clientId === get().clientId) return;
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === data.id ? { ...n, ...data.changes, updatedAt: Date.now() } : n
          ),
        }));
      });

      socket.on('node-deleted', (data: { nodeIds: string[]; connectionIds: string[]; clientId: string }) => {
        if (data.clientId === get().clientId) return;
        set((state) => ({
          nodes: state.nodes.filter((n) => !data.nodeIds.includes(n.id)),
          connections: state.connections.filter((c) => !data.connectionIds.includes(c.id)),
          selectedNodeId: data.nodeIds.includes(state.selectedNodeId || '') ? null : state.selectedNodeId,
        }));
      });

      socket.on('undo-performed', (data: { snapshot: HistorySnapshot; clientId: string }) => {
        if (data.clientId === get().clientId) return;
        set({
          nodes: data.snapshot.nodes,
          connections: data.snapshot.connections,
        });
      });

      socket.on('redo-performed', (data: { snapshot: HistorySnapshot; clientId: string }) => {
        if (data.clientId === get().clientId) return;
        set({
          nodes: data.snapshot.nodes,
          connections: data.snapshot.connections,
        });
      });
    },

    pushHistory: () => {
      const state = get();
      const snapshot: HistorySnapshot = {
        nodes: deepClone(state.nodes),
        connections: deepClone(state.connections),
        timestamp: Date.now(),
      };
      const newUndoStack = [...state.undoStack, snapshot].slice(-MAX_HISTORY);
      set({ undoStack: newUndoStack, redoStack: [] });
    },

    addNode: (parentId: string, text?: string) => {
      const state = get();
      const parent = state.nodes.find((n) => n.id === parentId);
      if (!parent) return;

      const siblingCount = state.nodes.filter((n) => n.parentId === parentId).length;
      const colorIndex = siblingCount % COLOR_PALETTE.length;

      const newNode: MindNode = {
        id: generateId(),
        text: text || '新节点',
        parentId,
        x: parent.x + 220,
        y: parent.y + siblingCount * 70,
        color: COLOR_PALETTE[colorIndex],
        shape: 'rounded-rect' as NodeShape,
        fontSize: 14,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newConnection: Connection = {
        id: generateId(),
        from: parentId,
        to: newNode.id,
      };

      get().pushHistory();
      const pending = new Set(get()._pendingNodeIds);
      pending.add(newNode.id);
      set((s) => ({
        nodes: [...s.nodes, newNode],
        connections: [...s.connections, newConnection],
        selectedNodeId: newNode.id,
        _pendingNodeIds: pending,
      }));

      const { socket, roomCode, clientId } = get();
      if (roomCode && socket && socket.connected) {
        socket.emit('node-added', { roomCode, node: newNode, connection: newConnection, clientId });
      }
    },

    updateNode: (id: string, changes: Partial<MindNode>, pushHis: boolean = true) => {
      if (pushHis) {
        get().pushHistory();
      }
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, ...changes, updatedAt: Date.now() } : n
        ),
      }));

      const { socket, roomCode, clientId } = get();
      if (roomCode && socket && socket.connected) {
        socket.emit('node-updated', { roomCode, id, changes, clientId });
      }
    },

    moveNode: (id: string, x: number, y: number) => {
      set((state) => ({
        nodes: state.nodes.map((n) =>
          n.id === id ? { ...n, x, y, updatedAt: Date.now() } : n
        ),
      }));

      const { socket, roomCode, clientId, _moveThrottleTimer } = get();
      if (roomCode && socket && socket.connected) {
        if (_moveThrottleTimer) {
          clearTimeout(_moveThrottleTimer);
        }
        const timer = setTimeout(() => {
          const currentSocket = get().socket;
          const currentRoomCode = get().roomCode;
          if (currentRoomCode && currentSocket && currentSocket.connected) {
            currentSocket.emit('node-updated', {
              roomCode: currentRoomCode,
              id,
              changes: { x, y },
              clientId,
            });
          }
          set({ _moveThrottleTimer: null });
        }, 80);
        set({ _moveThrottleTimer: timer });
      }
    },

    deleteNode: (id: string) => {
      const state = get();
      const rootNode = state.nodes.find((n) => n.parentId === null);
      if (rootNode && rootNode.id === id) {
        return;
      }

      const nodeIdsToDelete: string[] = [];
      const collectChildren = (nodeId: string) => {
        nodeIdsToDelete.push(nodeId);
        state.nodes
          .filter((n) => n.parentId === nodeId)
          .forEach((child)