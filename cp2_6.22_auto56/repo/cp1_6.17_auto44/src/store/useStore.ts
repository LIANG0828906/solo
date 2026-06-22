import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface BrowsingRecord {
  id: string;
  timestamp: number;
  url: string;
  title: string;
  duration: number;
  source?: string;
}

export interface SceneNode {
  id: string;
  url: string;
  title: string;
  position: [number, number, number];
  duration: number;
  visitCount: number;
}

export interface SceneEdge {
  id: string;
  from: string;
  to: string;
  order: number;
  duration: number;
}

interface AppState {
  records: BrowsingRecord[];
  nodes: SceneNode[];
  edges: SceneEdge[];
  selectedNodeId: string | null;
  rotationSpeed: number;
  nodeSpacing: number;
  trajectoryOpacity: number;
  cameraView: 'top' | 'free';
  statsExpanded: boolean;

  addRecord: (record: Omit<BrowsingRecord, 'id'>) => void;
  removeRecord: (id: string) => void;
  reorderRecords: (records: BrowsingRecord[]) => void;
  importRecords: (records: Omit<BrowsingRecord, 'id'>[]) => void;
  clearRecords: () => void;

  setSelectedNode: (id: string | null) => void;
  setRotationSpeed: (speed: number) => void;
  setNodeSpacing: (spacing: number) => void;
  setTrajectoryOpacity: (opacity: number) => void;
  setCameraView: (view: 'top' | 'free') => void;
  setStatsExpanded: (expanded: boolean) => void;
  resetView: () => void;

  computeSceneGraph: () => void;
}

const generateSampleData = (): BrowsingRecord[] => {
  const baseTime = Date.now() - 3600000;
  const pages = [
    { url: 'https://example.com/home', title: '首页 - Example' },
    { url: 'https://example.com/products', title: '产品列表 - Example' },
    { url: 'https://example.com/product/1', title: '产品详情 A - Example' },
    { url: 'https://example.com/product/2', title: '产品详情 B - Example' },
    { url: 'https://example.com/about', title: '关于我们 - Example' },
    { url: 'https://example.com/contact', title: '联系我们 - Example' },
    { url: 'https://example.com/blog', title: '博客 - Example' },
    { url: 'https://example.com/blog/post-1', title: '技术文章 1 - Example' },
  ];

  const sequence = [0, 1, 2, 1, 3, 1, 0, 4, 5, 4, 0, 6, 7, 6, 0];
  const durations = [15, 25, 45, 8, 30, 10, 20, 12, 18, 5, 22, 35, 60, 15, 10];

  return sequence.map((pageIdx, i) => ({
    id: uuidv4(),
    timestamp: baseTime + i * 60000,
    url: pages[pageIdx].url,
    title: pages[pageIdx].title,
    duration: durations[i],
    source: i > 0 ? pages[sequence[i - 1]].url : undefined,
  }));
};

const computeGraph = (records: BrowsingRecord[]): { nodes: SceneNode[]; edges: SceneEdge[] } => {
  const urlMap = new Map<string, SceneNode>();
  const edges: SceneEdge[] = [];
  const visitCounts = new Map<string, number>();
  const totalDurations = new Map<string, number>();

  records.forEach((r) => {
    visitCounts.set(r.url, (visitCounts.get(r.url) || 0) + 1);
    totalDurations.set(r.url, (totalDurations.get(r.url) || 0) + r.duration);
  });

  const uniqueUrls = Array.from(visitCounts.keys());
  const nodeCount = uniqueUrls.length;

  uniqueUrls.forEach((url, i) => {
    const record = records.find((r) => r.url === url)!;
    const angle = (i / Math.max(nodeCount, 1)) * Math.PI * 2;
    const radius = nodeCount > 1 ? 3 + Math.floor(i / 7) * 2 : 0;
    const height = (i % 3 - 1) * 1.5;

    urlMap.set(url, {
      id: `node-${i}`,
      url,
      title: record.title,
      position: [Math.cos(angle) * radius, height, Math.sin(angle) * radius],
      duration: totalDurations.get(url) || 0,
      visitCount: visitCounts.get(url) || 0,
    });
  });

  for (let i = 0; i < records.length - 1; i++) {
    const from = records[i].url;
    const to = records[i + 1].url;
    if (from !== to) {
      edges.push({
        id: `edge-${i}`,
        from: urlMap.get(from)!.id,
        to: urlMap.get(to)!.id,
        order: i,
        duration: records[i + 1].duration,
      });
    }
  }

  return { nodes: Array.from(urlMap.values()), edges };
};

export const useStore = create<AppState>((set, get) => {
  const initialRecords = generateSampleData();
  const { nodes, edges } = computeGraph(initialRecords);

  return {
    records: initialRecords,
    nodes,
    edges,
    selectedNodeId: null,
    rotationSpeed: 50,
    nodeSpacing: 100,
    trajectoryOpacity: 80,
    cameraView: 'free',
    statsExpanded: true,

    addRecord: (record) => {
      const newRecord = { ...record, id: uuidv4() };
      set((state) => {
        const records = [...state.records, newRecord];
        const { nodes, edges } = computeGraph(records);
        return { records, nodes, edges };
      });
    },

    removeRecord: (id) => {
      set((state) => {
        const records = state.records.filter((r) => r.id !== id);
        const { nodes, edges } = computeGraph(records);
        return { records, nodes, edges };
      });
    },

    reorderRecords: (records) => {
      const { nodes, edges } = computeGraph(records);
      set({ records, nodes, edges });
    },

    importRecords: (newRecords) => {
      const records = newRecords.map((r) => ({ ...r, id: uuidv4() }));
      const { nodes, edges } = computeGraph(records);
      set({ records, nodes, edges });
    },

    clearRecords: () => {
      set({ records: [], nodes: [], edges: [], selectedNodeId: null });
    },

    setSelectedNode: (id) => set({ selectedNodeId: id }),
    setRotationSpeed: (speed) => set({ rotationSpeed: speed }),
    setNodeSpacing: (spacing) => set({ nodeSpacing: spacing }),
    setTrajectoryOpacity: (opacity) => set({ trajectoryOpacity: opacity }),
    setCameraView: (view) => set({ cameraView: view }),
    setStatsExpanded: (expanded) => set({ statsExpanded: expanded }),
    resetView: () => set({ rotationSpeed: 50, nodeSpacing: 100, trajectoryOpacity: 80, cameraView: 'free' }),

    computeSceneGraph: () => {
      const { records } = get();
      const { nodes, edges } = computeGraph(records);
      set({ nodes, edges });
    },
  };
});
