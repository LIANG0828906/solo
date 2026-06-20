import { create } from 'zustand';
import type { RawGraphData, GraphNode, GraphEdge, GraphStats } from '../../types';

interface GraphStore {
  rawData: RawGraphData | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
  filterKeyword: string;
  error: string | null;
  fileName: string | null;
  setRawData: (data: RawGraphData | null) => void;
  setNodes: (nodes: GraphNode[]) => void;
  setEdges: (edges: GraphEdge[]) => void;
  setStats: (stats: GraphStats) => void;
  setFilterKeyword: (keyword: string) => void;
  setError: (error: string | null) => void;
  setFileName: (name: string | null) => void;
  applyFilter: () => void;
  resetHighlight: () => void;
  highlightNode: (nodeId: string) => void;
}

const initialStats: GraphStats = {
  nodeCount: 0,
  edgeCount: 0,
  averageDegree: 0,
  maxCentrality: 0,
  maxCentralityNode: '',
};

export const useGraphStore = create<GraphStore>((set, get) => ({
  rawData: null,
  nodes: [],
  edges: [],
  stats: initialStats,
  filterKeyword: '',
  error: null,
  fileName: null,
  setRawData: (data) => set({ rawData: data }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setStats: (stats) => set({ stats }),
  setFilterKeyword: (keyword) => {
    set({ filterKeyword: keyword });
    get().applyFilter();
  },
  setError: (error) => set({ error }),
  setFileName: (name) => set({ fileName: name }),
  applyFilter: () => {
    const { nodes, edges, filterKeyword, rawData } = get();
    if (!rawData) return;

    const keyword = filterKeyword.trim().toLowerCase();
    if (!keyword) {
      set({
        nodes: nodes.map((n) => ({ ...n, visible: true })),
        edges: edges.map((e) => ({ ...e, visible: true })),
      });
      return;
    }

    const matchedNodeIds = new Set<string>();
    rawData.nodes.forEach((n) => {
      const name = (n.name || n.id).toLowerCase();
      if (name.includes(keyword)) {
        matchedNodeIds.add(n.id);
      }
    });

    edges.forEach((e) => {
      if (matchedNodeIds.has(e.source) || matchedNodeIds.has(e.target)) {
        matchedNodeIds.add(e.source);
        matchedNodeIds.add(e.target);
      }
    });

    set({
      nodes: nodes.map((n) => ({ ...n, visible: matchedNodeIds.has(n.id) })),
      edges: edges.map((e) => ({
        ...e,
        visible: matchedNodeIds.has(e.source) && matchedNodeIds.has(e.target),
      })),
    });
  },
  resetHighlight: () => {
    set((state) => ({
      nodes: state.nodes.map((n) => ({ ...n, highlighted: false })),
    }));
  },
  highlightNode: (nodeId) => {
    const { nodes, edges } = get();
    const connectedIds = new Set<string>([nodeId]);

    edges.forEach((e) => {
      if (e.source === nodeId) connectedIds.add(e.target);
      if (e.target === nodeId) connectedIds.add(e.source);
    });

    set({
      nodes: nodes.map((n) => ({
        ...n,
        highlighted: connectedIds.has(n.id),
      })),
    });
  },
}));
