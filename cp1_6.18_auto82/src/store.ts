import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { TimelineNode, Branch, FilterState, TimeConfig, NodeType, NodeStatus } from '@/shared/types';
import { STATUS_CYCLE } from '@/shared/types';

interface TimelineState {
  nodes: TimelineNode[];
  branches: Branch[];
  filter: FilterState;
  timeConfig: TimeConfig;
  selectedNodeId: string | null;
  editingNodeId: string | null;

  addNode: (type: NodeType, description: string, dayOffset: number, parentId: string | null) => void;
  updateNodeStatus: (nodeId: string) => void;
  updateNodeEstimatedDays: (nodeId: string, days: number) => void;
  updateNodeDescription: (nodeId: string, description: string) => void;
  deleteNode: (nodeId: string) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilter: () => void;
  setTimeConfig: (config: Partial<TimeConfig>) => void;
  setSelectedNodeId: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  importData: (nodes: TimelineNode[], branches: Branch[]) => void;
}

const defaultFilter: FilterState = {
  typeFilter: null,
  statusFilter: null,
  keyword: '',
};

const defaultTimeConfig: TimeConfig = {
  startDate: new Date().getTime(),
  zoomLevel: 1,
  offsetX: 0,
};

export const useStore = create<TimelineState>((set) => ({
  nodes: [],
  branches: [],
  filter: { ...defaultFilter },
  timeConfig: { ...defaultTimeConfig },
  selectedNodeId: null,
  editingNodeId: null,

  addNode: (type, description, dayOffset, parentId) => {
    const nodeId = uuidv4();
    const branchId = parentId
      ? (set.getState().nodes.find((n) => n.id === parentId)?.branchId ?? uuidv4())
      : uuidv4();

    const newNode: TimelineNode = {
      id: nodeId,
      type,
      description,
      status: 'not_started',
      estimatedDays: type === 'milestone' ? 0 : 7,
      parentId,
      branchId,
      createdAt: Date.now(),
      dayOffset,
    };

    const needNewBranch = parentId !== null;
    const newBranch: Branch | null = needNewBranch
      ? { id: branchId, parentNodeId: parentId }
      : null;

    set((state) => ({
      nodes: [...state.nodes, newNode],
      branches: newBranch && !state.branches.find((b) => b.id === newBranch.id)
        ? [...state.branches, newBranch]
        : state.branches,
    }));
  },

  updateNodeStatus: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const currentIdx = STATUS_CYCLE.indexOf(n.status);
        const nextIdx = (currentIdx + 1) % STATUS_CYCLE.length;
        return { ...n, status: STATUS_CYCLE[nextIdx] };
      }),
    }));
  },

  updateNodeEstimatedDays: (nodeId, days) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, estimatedDays: days } : n
      ),
    }));
  },

  updateNodeDescription: (nodeId, description) => {
    set((state) => ({
      nodes: state.nodes.map((n) =>
        n.id === nodeId ? { ...n, description } : n
      ),
    }));
  },

  deleteNode: (nodeId) => {
    const idsToDelete = new Set<string>();
    const collectChildren = (id: string) => {
      idsToDelete.add(id);
      set.getState().nodes
        .filter((n) => n.parentId === id)
        .forEach((n) => collectChildren(n.id));
    };
    collectChildren(nodeId);

    set((state) => ({
      nodes: state.nodes.filter((n) => !idsToDelete.has(n.id)),
      branches: state.branches.filter(
        (b) => !idsToDelete.has(b.parentNodeId) || b.parentNodeId === nodeId
      ),
      selectedNodeId: state.selectedNodeId && idsToDelete.has(state.selectedNodeId)
        ? null
        : state.selectedNodeId,
    }));
  },

  setFilter: (filter) => {
    set((state) => ({
      filter: { ...state.filter, ...filter },
    }));
  },

  clearFilter: () => {
    set({ filter: { ...defaultFilter } });
  },

  setTimeConfig: (config) => {
    set((state) => ({
      timeConfig: { ...state.timeConfig, ...config },
    }));
  },

  setSelectedNodeId: (id) => {
    set({ selectedNodeId: id });
  },

  setEditingNodeId: (id) => {
    set({ editingNodeId: id });
  },

  importData: (nodes, branches) => {
    set({
      nodes,
      branches,
      selectedNodeId: null,
      editingNodeId: null,
      filter: { ...defaultFilter },
      timeConfig: { ...defaultTimeConfig },
    });
  },
}));
