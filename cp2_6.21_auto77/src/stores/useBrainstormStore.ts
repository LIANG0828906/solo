import { create } from 'zustand';
import type { BrainstormNode, Connection, SemanticGroup, User, RoomState } from '@/types';

export type EmitAction = (event: string, data: unknown) => void;

interface BrainstormState {
  nodes: BrainstormNode[];
  connections: Connection[];
  groups: SemanticGroup[];
  users: User[];
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  currentUserId: string | null;
  currentUserName: string;
  roomId: string | null;
  viewScale: number;
  viewOffset: { x: number; y: number };
  isPanning: boolean;
  emitAction: EmitAction | null;

  setEmitAction: (emitAction: EmitAction) => void;
  setRoomState: (roomState: RoomState) => void;
  setRoomId: (roomId: string) => void;
  setCurrentUser: (id: string, name: string) => void;
  addNode: (node: BrainstormNode) => void;
  updateNode: (node: Partial<BrainstormNode> & { id: string }) => void;
  moveNode: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;
  addConnection: (conn: Connection) => void;
  removeConnection: (id: string) => void;
  updateGroups: (groups: SemanticGroup[]) => void;
  selectNode: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUserCursor: (userId: string, x: number, y: number) => void;
  setViewScale: (scale: number) => void;
  setViewOffset: (x: number, y: number) => void;
  setPanning: (bool: boolean) => void;
  resetRoom: () => void;
}

export const useBrainstormStore = create<BrainstormState>((set, get) => ({
  nodes: [],
  connections: [],
  groups: [],
  users: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  currentUserId: null,
  currentUserName: '',
  roomId: null,
  viewScale: 1,
  viewOffset: { x: 0, y: 0 },
  isPanning: false,
  emitAction: null,

  setEmitAction: (emitAction) => set({ emitAction }),

  setRoomState: (roomState) => set({
    nodes: roomState.nodes,
    connections: roomState.connections,
    groups: roomState.groups,
    users: roomState.users,
  }),

  setRoomId: (roomId) => set({ roomId }),

  setCurrentUser: (id, name) => set({ currentUserId: id, currentUserName: name }),

  addNode: (node) => {
    const { emitAction, nodes } = get();
    const exists = nodes.find((n) => n.id === node.id);
    if (!exists) {
      set({ nodes: [...nodes, node] });
    }
    emitAction?.('nodeCreate', node);
  },

  updateNode: (node) => {
    const { emitAction, nodes } = get();
    set({
      nodes: nodes.map((n) => (n.id === node.id ? { ...n, ...node } : n)),
    });
    emitAction?.('nodeUpdate', node);
  },

  moveNode: (id, x, y) => {
    const { emitAction, nodes } = get();
    set({
      nodes: nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    });
    emitAction?.('nodeMove', { id, x, y });
  },

  deleteNode: (id) => {
    const { emitAction, nodes, connections } = get();
    set({
      nodes: nodes.filter((n) => n.id !== id),
      connections: connections.filter(
        (c) => c.fromNodeId !== id && c.toNodeId !== id
      ),
      selectedNodeId: null,
    });
    emitAction?.('nodeDelete', { id });
  },

  addConnection: (conn) => {
    const { emitAction, connections } = get();
    const exists = connections.find((c) => c.id === conn.id);
    if (!exists) {
      set({ connections: [...connections, conn] });
    }
    emitAction?.('connectionCreate', conn);
  },

  removeConnection: (id) => {
    const { emitAction, connections } = get();
    set({
      connections: connections.filter((c) => c.id !== id),
      selectedConnectionId: null,
    });
    emitAction?.('connectionDelete', { id });
  },

  updateGroups: (groups) => set({ groups }),

  selectNode: (id) => set({ selectedNodeId: id, selectedConnectionId: null }),

  selectConnection: (id) => set({ selectedConnectionId: id, selectedNodeId: null }),

  addUser: (user) => {
    const { users } = get();
    const exists = users.find((u) => u.id === user.id);
    if (!exists) {
      set({ users: [...users, user] });
    }
  },

  removeUser: (userId) => {
    const { users } = get();
    set({ users: users.filter((u) => u.id !== userId) });
  },

  updateUserCursor: (userId, x, y) => {
    const { users, currentUserId } = get();
    if (userId === currentUserId) return;
    set({
      users: users.map((u) =>
        u.id === userId ? { ...u, cursorX: x, cursorY: y } : u
      ),
    });
  },

  setViewScale: (scale) => set({ viewScale: Math.min(Math.max(scale, 0.1), 3) }),

  setViewOffset: (x, y) => set({ viewOffset: { x, y } }),

  setPanning: (bool) => set({ isPanning: bool }),

  resetRoom: () => set({
    nodes: [],
    connections: [],
    groups: [],
    users: [],
    selectedNodeId: null,
    selectedConnectionId: null,
    roomId: null,
    viewScale: 1,
    viewOffset: { x: 0, y: 0 },
    isPanning: false,
  }),
}));
