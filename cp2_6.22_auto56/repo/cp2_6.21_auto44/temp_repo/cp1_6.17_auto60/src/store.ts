import { create } from 'zustand';
import type { DepGraph, FileNode } from './types';
import { parseDeps, generateDemoGraph } from './modules/parser/parseDeps';

interface GraphState {
  graph: DepGraph | null;
  selectedFileId: string | null;
  breadcrumbs: string[];
  searchQuery: string;
  showFileTree: boolean;
  showCycleModal: boolean;
  loading: boolean;
  expandedDirs: Set<string>;

  setGraph: (g: DepGraph) => void;
  selectFile: (id: string | null) => void;
  drillDown: (id: string) => void;
  goBack: (level?: number) => void;
  setSearch: (q: string) => void;
  toggleFileTree: () => void;
  toggleCycleModal: () => void;
  toggleDir: (id: string) => void;
  parseProject: (rootPath: string) => Promise<void>;
  loadDemo: () => void;
  getNodeById: (id: string) => FileNode | undefined;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  graph: null,
  selectedFileId: null,
  breadcrumbs: [],
  searchQuery: '',
  showFileTree: true,
  showCycleModal: false,
  loading: false,
  expandedDirs: new Set<string>(),

  setGraph: (graph) => set({ graph }),

  selectFile: (id) => set({ selectedFileId: id }),

  drillDown: (id) =>
    set((state) => ({
      breadcrumbs: [...state.breadcrumbs, id],
      selectedFileId: id,
    })),

  goBack: (level) =>
    set((state) => {
      const targetLevel = level ?? state.breadcrumbs.length - 1;
      const newBreadcrumbs = state.breadcrumbs.slice(0, Math.max(0, targetLevel));
      return {
        breadcrumbs: newBreadcrumbs,
        selectedFileId: newBreadcrumbs[newBreadcrumbs.length - 1] ?? null,
      };
    }),

  setSearch: (searchQuery) => set({ searchQuery }),

  toggleFileTree: () => set((s) => ({ showFileTree: !s.showFileTree })),

  toggleCycleModal: () => set((s) => ({ showCycleModal: !s.showCycleModal })),

  toggleDir: (id) =>
    set((s) => {
      const next = new Set(s.expandedDirs);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedDirs: next };
    }),

  parseProject: async (rootPath) => {
    set({ loading: true });
    try {
      const graph = await parseDeps(rootPath);
      set({ graph, loading: false });
    } catch (e) {
      console.error('parse failed', e);
      set({ loading: false });
    }
  },

  loadDemo: () => {
    const graph = generateDemoGraph();
    set({ graph });
    const rootDir = graph.nodes.find((n) => n.isDirectory && n.parentId === undefined);
    if (rootDir) {
      set((s) => ({ expandedDirs: new Set([...s.expandedDirs, rootDir.id]) }));
    }
  },

  getNodeById: (id) => get().graph?.nodes.find((n) => n.id === id),
}));
