import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MindMapNode, NodesMap, EditHistory } from './types';

interface MindMapState {
  nodes: NodesMap;
  selectedNodeId: string | null;
  history: EditHistory[];
  undoIndex: number;
  highlightNodeId: string | null;
  searchQuery: string;
  scale: number;
  offsetX: number;
  offsetY: number;

  initStore: () => void;
  selectNode: (id: string | null) => void;
  addNode: (parentId: string, text?: string) => string;
  removeNode: (id: string) => void;
  moveNode: (id: string, x: number, y: number) => void;
  editNode: (id: string, text: string) => void;
  changeNodeColor: (id: string, color: string) => void;
  setNodeNote: (id: string, note: string) => void;
  setHighlightNode: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setScale: (scale: number) => void;
  setOffset: (x: number, y: number) => void;

  saveSnapshot: (description: string) => void;
  restore: (historyId: string) => void;
  undo: () => void;
  redo: () => void;

  applyRemoteState: (nodes: NodesMap) => void;
}

const DEFAULT_COLORS = ['#e94560', '#0f3460', '#533483', '#16213e', '#f39c12', '#27ae60'];

const createRootNode = (): MindMapNode => {
  const now = Date.now();
  return {
    id: uuidv4(),
    text: '中心主题',
    x: 0,
    y: 0,
    color: '#e94560',
    parentId: null,
    childrenIds: [],
    createdAt: now,
    updatedAt: now,
  };
};

export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: {},
  selectedNodeId: null,
  history: [],
  undoIndex: -1,
  highlightNodeId: null,
  searchQuery: '',
  scale: 1,
  offsetX: 0,
  offsetY: 0,

  initStore: () => {
    const root = createRootNode();
    const initialNodes: NodesMap = { [root.id]: root };
    const snapshot: EditHistory = {
      id: uuidv4(),
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(initialNodes)),
      description: '初始化画布',
    };
    set({
      nodes: initialNodes,
      selectedNodeId: root.id,
      history: [snapshot],
      undoIndex: 0,
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  addNode: (parentId, text = '新节点') => {
    const { nodes } = get();
    const parent = nodes[parentId];
    if (!parent) return '';

    const childIndex = parent.childrenIds.length;
    const offsetY = 50 + childIndex * 80;
    const now = Date.now();
    const newNode: MindMapNode = {
      id: uuidv4(),
      text,
      x: parent.x,
      y: parent.y + offsetY,
      color: DEFAULT_COLORS[(childIndex + 1) % DEFAULT_COLORS.length],
      parentId,
      childrenIds: [],
      createdAt: now,
      updatedAt: now,
    };

    const updatedNodes = {
      ...nodes,
      [newNode.id]: newNode,
      [parentId]: {
        ...parent,
        childrenIds: [...parent.childrenIds, newNode.id],
        updatedAt: now,
      },
    };

    set({ nodes: updatedNodes, selectedNodeId: newNode.id });
    get().saveSnapshot(`添加节点: ${text}`);
    return newNode.id;
  },

  removeNode: (id) => {
    const { nodes } = get();
    const node = nodes[id];
    if (!node || !node.parentId) return;

    const collectIds = (nodeId: string, acc: string[]): void => {
      acc.push(nodeId);
      const n = nodes[nodeId];
      if (n) n.childrenIds.forEach((cid) => collectIds(cid, acc));
    };

    const toRemove: string[] = [];
    collectIds(id, toRemove);

    const updatedNodes: NodesMap = { ...nodes };
    toRemove.forEach((rid) => delete updatedNodes[rid]);

    const parent = updatedNodes[node.parentId];
    if (parent) {
      updatedNodes[node.parentId] = {
        ...parent,
        childrenIds: parent.childrenIds.filter((cid) => cid !== id),
        updatedAt: Date.now(),
      };
    }

    set({ nodes: updatedNodes, selectedNodeId: null });
    get().saveSnapshot(`删除节点: ${node.text}`);
  },

  moveNode: (id, x, y) => {
    const { nodes } = get();
    if (!nodes[id]) return;
    const updatedNodes = {
      ...nodes,
      [id]: { ...nodes[id], x, y, updatedAt: Date.now() },
    };
    set({ nodes: updatedNodes });
  },

  editNode: (id, text) => {
    const { nodes } = get();
    if (!nodes[id]) return;
    const updatedNodes = {
      ...nodes,
      [id]: { ...nodes[id], text, updatedAt: Date.now() },
    };
    set({ nodes: updatedNodes });
    get().saveSnapshot(`编辑节点: ${text}`);
  },

  changeNodeColor: (id, color) => {
    const { nodes } = get();
    if (!nodes[id]) return;
    const updatedNodes = {
      ...nodes,
      [id]: { ...nodes[id], color, updatedAt: Date.now() },
    };
    set({ nodes: updatedNodes });
    get().saveSnapshot(`更改节点颜色`);
  },

  setNodeNote: (id, note) => {
    const { nodes } = get();
    if (!nodes[id]) return;
    const updatedNodes = {
      ...nodes,
      [id]: { ...nodes[id], note, updatedAt: Date.now() },
    };
    set({ nodes: updatedNodes });
    get().saveSnapshot(`更新节点备注`);
  },

  setHighlightNode: (id) => set({ highlightNodeId: id }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setScale: (scale) => set({ scale: Math.max(0.5, Math.min(2.0, scale)) }),

  setOffset: (x, y) => set({ offsetX: x, offsetY: y }),

  saveSnapshot: (description) => {
    const { nodes, history, undoIndex } = get();
    const newHistory = history.slice(0, undoIndex + 1);
    const snapshot: EditHistory = {
      id: uuidv4(),
      timestamp: Date.now(),
      nodes: JSON.parse(JSON.stringify(nodes)),
      description,
    };
    newHistory.push(snapshot);
    set({ history: newHistory, undoIndex: newHistory.length - 1 });
  },

  restore: (historyId) => {
    const { history } = get();
    const entry = history.find((h) => h.id === historyId);
    if (!entry) return;
    set({
      nodes: JSON.parse(JSON.stringify(entry.nodes)),
      selectedNodeId: null,
    });
  },

  undo: () => {
    const { history, undoIndex } = get();
    if (undoIndex <= 0) return;
    const newIndex = undoIndex - 1;
    set({
      nodes: JSON.parse(JSON.stringify(history[newIndex].nodes)),
      undoIndex: newIndex,
      selectedNodeId: null,
    });
  },

  redo: () => {
    const { history, undoIndex } = get();
    if (undoIndex >= history.length - 1) return;
    const newIndex = undoIndex + 1;
    set({
      nodes: JSON.parse(JSON.stringify(history[newIndex].nodes)),
      undoIndex: newIndex,
      selectedNodeId: null,
    });
  },

  applyRemoteState: (remoteNodes) => {
    set({ nodes: remoteNodes });
  },
}));
