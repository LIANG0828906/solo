import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { TimelineNode, Branch, TimelineState } from '../types';
import { getInitialTemplate } from '../api/mockApi';

interface TimelineActions {
  addNode: (parentId?: string, branchIndex?: number) => void;
  updateNode: (id: string, data: Partial<TimelineNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string | null) => void;
  togglePlay: () => void;
  setProgress: (progress: number) => void;
  undo: () => void;
  redo: () => void;
  createBranch: (parentId: string) => void;
  setActiveBranch: (branchId: string | null) => void;
  exportJSON: () => Promise<string>;
  importJSON: (data: string) => { success: boolean; error?: string };
  setExporting: (exporting: boolean) => void;
}

type TimelineStore = TimelineState & TimelineActions;

const initialData = getInitialTemplate();

const saveToHistory = (state: TimelineState): TimelineState => {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(JSON.parse(JSON.stringify(state.nodes)));
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  };
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  nodes: initialData.nodes,
  branches: initialData.branches,
  selectedNodeId: null,
  isPlaying: false,
  currentProgress: 0,
  history: [JSON.parse(JSON.stringify(initialData.nodes))],
  historyIndex: 0,
  activeBranchId: null,
  isExporting: false,

  addNode: (parentId?: string, branchIndex?: number) => {
    set((state) => {
      const newNode: TimelineNode = {
        id: uuidv4(),
        title: '',
        content: '',
        imageUrl: '',
        date: new Date().toISOString().split('T')[0],
        isBranch: !!parentId,
        parentId,
        branchIndex,
        edited: false,
        order: state.nodes.length,
      };

      let newNodes = [...state.nodes, newNode];
      let newBranches = [...state.branches];

      if (parentId) {
        const existingBranch = state.branches.find((b) => b.parentId === parentId);
        if (existingBranch) {
          newBranches = state.branches.map((b) =>
            b.parentId === parentId
              ? { ...b, nodeIds: [...b.nodeIds, newNode.id] }
              : b
          );
        }
      }

      const newState = {
        ...state,
        nodes: newNodes,
        branches: newBranches,
        selectedNodeId: newNode.id,
      };

      return saveToHistory(newState);
    });
  },

  updateNode: (id: string, data: Partial<TimelineNode>) => {
    set((state) => {
      const newNodes = state.nodes.map((node) =>
        node.id === id
          ? { ...node, ...data, edited: data.title || data.content ? true : node.edited }
          : node
      );
      const newState = { ...state, nodes: newNodes };
      return saveToHistory(newState);
    });
  },

  deleteNode: (id: string) => {
    set((state) => {
      const newNodes = state.nodes.filter((n) => n.id !== id);
      const newBranches = state.branches
        .map((b) => ({
          ...b,
          nodeIds: b.nodeIds.filter((nid) => nid !== id),
        }))
        .filter((b) => b.nodeIds.length > 0);

      const newState = {
        ...state,
        nodes: newNodes,
        branches: newBranches,
        selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      };
      return saveToHistory(newState);
    });
  },

  selectNode: (id: string | null) => {
    set({ selectedNodeId: id });
  },

  togglePlay: () => {
    set((state) => ({ isPlaying: !state.isPlaying, currentProgress: state.isPlaying ? state.currentProgress : 0 }));
  },

  setProgress: (progress: number) => {
    set({ currentProgress: Math.max(0, Math.min(1, progress)) });
  },

  undo: () => {
    set((state) => {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        nodes: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        nodes: JSON.parse(JSON.stringify(state.history[newIndex])),
        historyIndex: newIndex,
      };
    });
  },

  createBranch: (parentId: string) => {
    set((state) => {
      const parentNode = state.nodes.find((n) => n.id === parentId);
      if (!parentNode) return state;

      const mainNodes = state.nodes.filter((n) => !n.isBranch);
      const parentOrder = mainNodes.findIndex((n) => n.id === parentId);
      const mergeTarget = mainNodes[parentOrder + 1];

      const branchNode1Id = uuidv4();
      const branchNode2Id = uuidv4();

      const branchNodes: TimelineNode[] = [
        {
          id: branchNode1Id,
          title: '',
          content: '',
          imageUrl: '',
          date: new Date().toISOString().split('T')[0],
          isBranch: true,
          parentId,
          branchIndex: 0,
          edited: false,
          order: state.nodes.length,
        },
        {
          id: branchNode2Id,
          title: '',
          content: '',
          imageUrl: '',
          date: new Date().toISOString().split('T')[0],
          isBranch: true,
          parentId,
          branchIndex: 1,
          edited: false,
          order: state.nodes.length + 1,
        },
      ];

      const existingBranch = state.branches.find((b) => b.parentId === parentId);
      let newBranches: Branch[];

      if (existingBranch) {
        newBranches = state.branches.map((b) =>
          b.parentId === parentId
            ? { ...b, nodeIds: [...b.nodeIds, branchNode1Id, branchNode2Id] }
            : b
        );
      } else {
        newBranches = [
          ...state.branches,
          {
            parentId,
            nodeIds: [branchNode1Id, branchNode2Id],
            mergeTargetId: mergeTarget?.id || '',
          },
        ];
      }

      const newState = {
        ...state,
        nodes: [...state.nodes, ...branchNodes],
        branches: newBranches,
      };
      return saveToHistory(newState);
    });
  },

  setActiveBranch: (branchId: string | null) => {
    set({ activeBranchId: branchId });
  },

  exportJSON: async () => {
    set({ isExporting: true });
    await new Promise((resolve) => setTimeout(resolve, 300));
    const state = get();
    const data = {
      nodes: state.nodes,
      branches: state.branches,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    set({ isExporting: false });
    return jsonStr;
  },

  importJSON: (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);

      if (!data.nodes || !Array.isArray(data.nodes)) {
        return { success: false, error: '缺少 nodes 字段或格式不正确' };
      }

      if (!data.branches || !Array.isArray(data.branches)) {
        return { success: false, error: '缺少 branches 字段或格式不正确' };
      }

      for (const node of data.nodes) {
        if (typeof node.id !== 'string' || typeof node.order !== 'number') {
          return { success: false, error: `节点数据格式错误: ${JSON.stringify(node)}` };
        }
      }

      set((state) => {
        const newState = {
          ...state,
          nodes: data.nodes,
          branches: data.branches,
        };
        return saveToHistory(newState);
      });

      return { success: true };
    } catch (e) {
      return { success: false, error: `JSON 解析失败: ${(e as Error).message}` };
    }
  },

  setExporting: (exporting: boolean) => {
    set({ isExporting: exporting });
  },
}));
