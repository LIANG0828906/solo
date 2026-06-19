import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { KnowledgeNode, NodeCreationPayload, PanelKey, KnowledgeLink } from '@/types';
import { nodeBackgroundColor } from '@/types';

interface NodeStore {
  nodes: KnowledgeNode[];
  selectedIds: string[];
  lastAddedId: string | null;
  activePanel: PanelKey;
  nodeModalOpen: boolean;
  editingNode: KnowledgeNode | null;
  forceLayoutRunning: boolean;

  addNode: (data: NodeCreationPayload) => KnowledgeNode;
  updateNode: (id: string, data: Partial<KnowledgeNode>) => void;
  deleteNode: (id: string) => void;
  deleteNodes: (ids: string[]) => void;
  selectNode: (id: string, multi?: boolean) => void;
  clearSelection: () => void;
  setNodePosition: (id: string, x: number, y: number) => void;
  setNodeVelocity: (id: string, vx: number, vy: number) => void;
  setBatchPositions: (updates: { id: string; x: number; y: number }[]) => void;
  getNode: (id: string) => KnowledgeNode | undefined;
  clearLastAdded: () => void;

  togglePanel: (key: PanelKey) => void;
  openNodeModal: (node?: KnowledgeNode | null) => void;
  closeNodeModal: () => void;
  setForceLayoutRunning: (v: boolean) => void;
}

export const useNodeStore = create<NodeStore>()(
  persist(
    (set, get) => ({
      nodes: [],
      selectedIds: [],
      lastAddedId: null,
      activePanel: null,
      nodeModalOpen: false,
      editingNode: null,
      forceLayoutRunning: false,

      addNode: (data) => {
        const now = Date.now();
        const color = nodeBackgroundColor(data.tags);
        const existingCount = get().nodes.length;
        const angle = existingCount * 0.8;
        const radius = 180 + Math.min(existingCount * 20, 200);
        const newNode: KnowledgeNode = {
          id: uuidv4(),
          title: data.title.trim(),
          summary: data.summary.trim(),
          tags: data.tags,
          content: data.content,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
          color,
          progress: 0,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
          __animAppear: now,
        };
        set((state) => ({
          nodes: [...state.nodes, newNode],
          selectedIds: [newNode.id],
          lastAddedId: newNode.id,
        }));
        return newNode;
      },

      updateNode: (id, data) => {
        const now = Date.now();
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  ...data,
                  color: data.tags ? nodeBackgroundColor(data.tags) : n.color,
                  updatedAt: now,
                }
              : n,
          ),
        }));
      },

      deleteNode: (id) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== id),
          selectedIds: state.selectedIds.filter((sid) => sid !== id),
        }));
      },

      deleteNodes: (ids) => {
        const idSet = new Set(ids);
        set((state) => ({
          nodes: state.nodes.filter((n) => !idSet.has(n.id)),
          selectedIds: state.selectedIds.filter((sid) => !idSet.has(sid)),
        }));
      },

      selectNode: (id, multi = false) => {
        set((state) => {
          if (multi) {
            const exists = state.selectedIds.includes(id);
            return {
              selectedIds: exists
                ? state.selectedIds.filter((sid) => sid !== id)
                : [...state.selectedIds, id],
            };
          }
          return { selectedIds: [id] };
        });
      },

      clearSelection: () => set({ selectedIds: [] }),

      setNodePosition: (id, x, y) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, x, y, vx: 0, vy: 0 } : n)),
        }));
      },

      setNodeVelocity: (id, vx, vy) => {
        set((state) => ({
          nodes: state.nodes.map((n) => (n.id === id ? { ...n, vx, vy } : n)),
        }));
      },

      setBatchPositions: (updates) => {
        const map = new Map(updates.map((u) => [u.id, u]));
        set((state) => ({
          nodes: state.nodes.map((n) => {
            const u = map.get(n.id);
            if (!u) return n;
            return { ...n, x: u.x, y: u.y };
          }),
        }));
      },

      getNode: (id) => get().nodes.find((n) => n.id === id),

      clearLastAdded: () => set({ lastAddedId: null }),

      togglePanel: (key) =>
        set((state) => ({ activePanel: state.activePanel === key ? null : key })),

      openNodeModal: (node = null) =>
        set({ nodeModalOpen: true, editingNode: node }),

      closeNodeModal: () => set({ nodeModalOpen: false, editingNode: null }),

      setForceLayoutRunning: (v) => set({ forceLayoutRunning: v }),
    }),
    {
      name: 'knowledge-node-store',
      partialize: (state) => ({ nodes: state.nodes }),
    },
  ),
);
