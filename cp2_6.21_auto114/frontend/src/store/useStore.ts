import { create } from 'zustand';
import type {
  NodeData,
  RelationData,
  ToolMode,
  Collaborator,
  FamilyTreeStats,
  ShareInfo,
} from '../types';
import { FamilyGraph } from '../moduleB/FamilyGraph';

interface AppState {
  graph: FamilyGraph;
  treeName: string;
  treeId: string | null;
  shareToken: string | null;
  isReadonly: boolean;
  toolMode: ToolMode;
  selectedNodeId: string | null;
  selectedRelationId: string | null;
  collaborators: Collaborator[];
  currentUsername: string;
  currentUserColor: string;
  stats: FamilyTreeStats;
  canUndo: boolean;
  canRedo: boolean;
  showShareModal: boolean;
  shareInfo: ShareInfo | null;
  error: string | null;

  setTreeName: (name: string) => void;
  setTreeId: (id: string | null) => void;
  setReadonly: (v: boolean) => void;
  setToolMode: (mode: ToolMode) => void;
  selectNode: (id: string | null) => void;
  selectRelation: (id: string | null) => void;
  setUsername: (name: string) => void;
  setCurrentUserColor: (color: string) => void;
  setCollaborators: (list: Collaborator[]) => void;
  addCollaborator: (c: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  updateCollaboratorCursor: (id: string, x: number, y: number) => void;
  refreshState: () => void;
  undo: () => void;
  redo: () => void;
  addNode: (params: { name: string; photoUrl?: string; generation?: number }) => NodeData;
  removeNode: (id: string) => boolean;
  updateNode: (id: string, changes: Partial<Omit<NodeData, 'id'>>) => boolean;
  addRelation: (params: {
    fromNodeId: string;
    toNodeId: string;
    type: 'blood' | 'marriage';
    label?: string;
  }) => RelationData | null;
  removeRelation: (id: string) => boolean;
  updateRelation: (id: string, changes: Partial<Omit<RelationData, 'id'>>) => boolean;
  toggleCollapse: (nodeId: string) => boolean;
  loadData: (nodes: NodeData[], relations: RelationData[]) => void;
  setShowShareModal: (v: boolean) => void;
  setShareInfo: (info: ShareInfo | null) => void;
  setError: (err: string | null) => void;
}

const USER_COLORS = [
  '#e74c3c',
  '#3498db',
  '#27ae60',
  '#f39c12',
  '#8e44ad',
  '#16a085',
  '#2980b9',
  '#d35400',
];

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

const graphInstance = new FamilyGraph();
graphInstance.addNode({ name: '祖先', generation: 0 });
graphInstance.addNode({ name: '长子', generation: 1 });
graphInstance.addNode({ name: '次子', generation: 1 });
graphInstance.addNode({ name: '长孙', generation: 2 });
graphInstance.addRelation({
  fromNodeId: graphInstance.getNodes()[0].id,
  toNodeId: graphInstance.getNodes()[1].id,
  type: 'blood',
  label: '长子',
});
graphInstance.addRelation({
  fromNodeId: graphInstance.getNodes()[0].id,
  toNodeId: graphInstance.getNodes()[2].id,
  type: 'blood',
  label: '次子',
});
graphInstance.addRelation({
  fromNodeId: graphInstance.getNodes()[1].id,
  toNodeId: graphInstance.getNodes()[3].id,
  type: 'blood',
  label: '长子',
});

export const useStore = create<AppState>((set, get) => ({
  graph: graphInstance,
  treeName: '我的家谱',
  treeId: null,
  shareToken: null,
  isReadonly: false,
  toolMode: 'select',
  selectedNodeId: null,
  selectedRelationId: null,
  collaborators: [],
  currentUsername: '访客' + Math.floor(Math.random() * 1000),
  currentUserColor: '',
  stats: graphInstance.getStats(),
  canUndo: graphInstance.canUndo(),
  canRedo: graphInstance.canRedo(),
  showShareModal: false,
  shareInfo: null,
  error: null,

  setTreeName: (name) => set({ treeName: name }),
  setTreeId: (id) => set({ treeId: id }),
  setReadonly: (v) => set({ isReadonly: v }),
  setToolMode: (mode) => set({ toolMode: mode }),
  selectNode: (id) => set({ selectedNodeId: id, selectedRelationId: id ? null : get().selectedRelationId }),
  selectRelation: (id) => set({ selectedRelationId: id, selectedNodeId: id ? null : get().selectedNodeId }),
  setUsername: (name) => set({ currentUsername: name, currentUserColor: pickColor(name) }),
  setCurrentUserColor: (color) => set({ currentUserColor: color }),
  setCollaborators: (list) => set({ collaborators: list }),
  addCollaborator: (c) =>
    set((state) => ({
      collaborators: state.collaborators.some((x) => x.id === c.id)
        ? state.collaborators
        : [...state.collaborators, c],
    })),
  removeCollaborator: (id) =>
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.id !== id),
    })),
  updateCollaboratorCursor: (id, x, y) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.id === id ? { ...c, cursorX: x, cursorY: y } : c,
      ),
    })),

  refreshState: () => {
    const { graph } = get();
    set({
      stats: graph.getStats(),
      canUndo: graph.canUndo(),
      canRedo: graph.canRedo(),
    });
  },

  undo: () => {
    const { graph } = get();
    if (graph.undo()) {
      get().refreshState();
    }
  },
  redo: () => {
    const { graph } = get();
    if (graph.redo()) {
      get().refreshState();
    }
  },

  addNode: (params) => {
    const node = get().graph.addNode(params);
    get().refreshState();
    return node;
  },
  removeNode: (id) => {
    const ok = get().graph.removeNode(id);
    if (ok) {
      if (get().selectedNodeId === id) set({ selectedNodeId: null });
      get().refreshState();
    }
    return ok;
  },
  updateNode: (id, changes) => {
    const ok = get().graph.updateNode(id, changes);
    if (ok) get().refreshState();
    return ok;
  },
  addRelation: (params) => {
    const rel = get().graph.addRelation(params);
    if (rel) get().refreshState();
    return rel;
  },
  removeRelation: (id) => {
    const ok = get().graph.removeRelation(id);
    if (ok) {
      if (get().selectedRelationId === id) set({ selectedRelationId: null });
      get().refreshState();
    }
    return ok;
  },
  updateRelation: (id, changes) => {
    const ok = get().graph.updateRelation(id, changes);
    if (ok) get().refreshState();
    return ok;
  },
  toggleCollapse: (nodeId) => {
    const ok = get().graph.toggleCollapse(nodeId);
    if (ok) get().refreshState();
    return ok;
  },
  loadData: (nodes, relations) => {
    get().graph.loadData(nodes, relations);
    set({ selectedNodeId: null, selectedRelationId: null });
    get().refreshState();
  },
  setShowShareModal: (v) => set({ showShareModal: v }),
  setShareInfo: (info) => set({ shareInfo: info }),
  setError: (err) => set({ error: err }),
}));

useStore.setState({
  currentUserColor: pickColor(useStore.getState().currentUsername),
});
