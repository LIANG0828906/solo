import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BoardNode,
  Connection,
  Snapshot,
  ActionType,
  BoardState,
  BoardActions,
} from '@/types';
import { generateId } from '@/utils';

export type BoardStore = BoardState & BoardActions;

export const useBoardStore = create<BoardStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      connections: [],
      snapshots: [],
      selectedNodeId: null,
      selectedConnectionId: null,
      isReverting: false,

      takeSnapshot: (actionType: ActionType) => {
        const { nodes, connections, snapshots } = get();
        const snapshot: Snapshot = {
          id: generateId(),
          nodes: JSON.parse(JSON.stringify(nodes)),
          connections: JSON.parse(JSON.stringify(connections)),
          actionType,
          timestamp: new Date().toISOString(),
        };
        const newSnapshots = [...snapshots, snapshot];
        if (newSnapshots.length > 30) {
          newSnapshots.shift();
        }
        set({ snapshots: newSnapshots });
      },

      addNode: (node: Omit<BoardNode, 'id' | 'createdAt' | 'updatedAt'>) => {
        const now = new Date().toISOString();
        const newNode: BoardNode = {
          ...node,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          nodes: [...state.nodes, newNode],
        }));
        get().takeSnapshot('create_node');
      },

      deleteNode: (nodeId: string) => {
        set((state) => ({
          nodes: state.nodes.filter((node) => node.id !== nodeId),
          connections: state.connections.filter(
            (conn) => conn.fromNodeId !== nodeId && conn.toNodeId !== nodeId
          ),
        }));
        get().takeSnapshot('delete_node');
      },

      updateNode: (nodeId: string, updates: Partial<BoardNode>) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, ...updates, updatedAt: new Date().toISOString() }
              : node
          ),
        }));
        get().takeSnapshot('update_node');
      },

      moveNode: (nodeId: string, x: number, y: number) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId ? { ...node, x, y } : node
          ),
        }));
      },

      addConnection: (connection: Omit<Connection, 'id' | 'createdAt'>) => {
        const newConnection: Connection = {
          ...connection,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          connections: [...state.connections, newConnection],
        }));
        get().takeSnapshot('create_connection');
      },

      deleteConnection: (connectionId: string) => {
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== connectionId),
        }));
        get().takeSnapshot('delete_connection');
      },

      updateConnection: (connectionId: string, updates: Partial<Connection>) => {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId
              ? { ...conn, ...updates }
              : conn
          ),
        }));
        get().takeSnapshot('update_connection');
      },

      revertToSnapshot: (snapshotId: string) => {
        const { snapshots } = get();
        const snapshotIndex = snapshots.findIndex((s) => s.id === snapshotId);
        if (snapshotIndex === -1) return;

        const snapshot = snapshots[snapshotIndex];
        set({ isReverting: true });

        set({
          nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
          connections: JSON.parse(JSON.stringify(snapshot.connections)),
          snapshots: snapshots.slice(0, snapshotIndex + 1),
          selectedNodeId: null,
          selectedConnectionId: null,
        });

        get().takeSnapshot('update_node');
        set({ isReverting: false });
      },

      selectNode: (nodeId: string | null) => {
        set({
          selectedNodeId: nodeId,
          selectedConnectionId: null,
        });
      },

      selectConnection: (connectionId: string | null) => {
        set({
          selectedConnectionId: connectionId,
          selectedNodeId: null,
        });
      },
    }),
    {
      name: 'inspiration-board-storage',
    }
  )
);
