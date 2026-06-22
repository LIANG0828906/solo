import { create } from 'zustand';
import {
  TimelineEngine,
  Timeline,
  TimelineNode,
  ViewportState,
  TimelineSnapshot,
  ThemeMode,
  Timeline as TimelineType,
} from '../modules/timeline/TimelineEngine';

interface HoverInfo {
  nodeId: string | null;
  screenX: number;
  screenY: number;
}

interface TimelineStore {
  engine: TimelineEngine;
  theme: ThemeMode;
  selectedNodeId: string | null;
  hoverInfo: HoverInfo;
  isDragging: boolean;

  timelines: TimelineType[];
  viewport: ViewportState;

  initEngine: () => void;
  addTimeline: (title?: string) => Timeline | undefined;
  removeTimeline: (id: string) => boolean;
  updateTimeline: (id: string, patch: Partial<Timeline>) => Timeline | undefined;

  addNode: (timelineId: string, data?: Partial<TimelineNode>) => TimelineNode | undefined;
  removeNode: (nodeId: string) => boolean;
  updateNode: (nodeId: string, patch: Partial<TimelineNode>) => TimelineNode | undefined;

  handlePan: (deltaX: number, deltaY: number) => void;
  handleZoom: (delta: number, centerX: number, centerY: number) => void;
  setViewport: (patch: Partial<ViewportState>) => void;

  setSelectedNode: (id: string | null) => void;
  setHoveredNode: (node: TimelineNode | null, screenX?: number, screenY?: number) => void;
  setDragging: (dragging: boolean) => void;
  setTheme: (mode: ThemeMode) => void;

  refreshState: () => void;

  exportSnapshot: () => TimelineSnapshot;
  importSnapshot: (snapshot: TimelineSnapshot) => { success: boolean; error?: string };

  formatDate: (timestamp: number) => string;
  getTotalNodes: () => number;
  getNodeById: (id: string) => { node: TimelineNode; timeline: Timeline } | undefined;
}

const STORAGE_KEY = 'timeline-editor-theme';

const loadThemeFromStorage = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* ignore */
  }
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  engine: new TimelineEngine(),
  theme: loadThemeFromStorage(),
  selectedNodeId: null,
  hoverInfo: { nodeId: null, screenX: 0, screenY: 0 },
  isDragging: false,
  timelines: [],
  viewport: { offsetX: 100, offsetY: 100, zoom: 1, centerTime: Date.now() },

  initEngine: () => {
    const engine = new TimelineEngine();
    set({ engine });
    get().refreshState();
  },

  addTimeline: (title) => {
    const { engine } = get();
    const timeline = engine.addTimeline(title);
    get().refreshState();
    return timeline;
  },

  removeTimeline: (id) => {
    const { engine, selectedNodeId } = get();
    const timeline = engine.getTimelineById(id);
    const hasSelected = timeline?.nodes.some(n => n.id === selectedNodeId);
    const result = engine.removeTimeline(id);
    if (hasSelected) {
      set({ selectedNodeId: null });
    }
    get().refreshState();
    return result;
  },

  updateTimeline: (id, patch) => {
    const { engine } = get();
    const result = engine.updateTimeline(id, patch);
    get().refreshState();
    return result;
  },

  addNode: (timelineId, data) => {
    const { engine } = get();
    const node = engine.addNode(timelineId, data);
    get().refreshState();
    return node;
  },

  removeNode: (nodeId) => {
    const { engine, selectedNodeId } = get();
    const result = engine.removeNode(nodeId);
    if (selectedNodeId === nodeId) {
      set({ selectedNodeId: null });
    }
    get().refreshState();
    return result;
  },

  updateNode: (nodeId, patch) => {
    const { engine } = get();
    const result = engine.updateNode(nodeId, patch);
    get().refreshState();
    return result;
  },

  handlePan: (deltaX, deltaY) => {
    const { engine } = get();
    const vp = engine.getViewport();
    engine.setViewport({
      offsetX: vp.offsetX + deltaX,
      offsetY: vp.offsetY + deltaY,
    });
    get().refreshState();
  },

  handleZoom: (delta, centerX, centerY) => {
    const { engine } = get();
    const vp = engine.getViewport();
    const newZoom = Math.max(0.5, Math.min(3, vp.zoom + delta));
    if (newZoom === vp.zoom) return;

    const worldXBefore = engine.screenToWorldX(centerX);
    const worldYBefore = engine.screenToWorldY(centerY);
    const ratio = newZoom / vp.zoom;
    const newOffsetX = centerX - worldXBefore * newZoom;
    const newOffsetY = centerY - worldYBefore * newZoom;

    void ratio;
    engine.setViewport({
      zoom: newZoom,
      offsetX: newOffsetX,
      offsetY: newOffsetY,
    });
    get().refreshState();
  },

  setViewport: (patch) => {
    const { engine } = get();
    engine.setViewport(patch);
    get().refreshState();
  },

  setSelectedNode: (id) => {
    set({ selectedNodeId: id });
  },

  setHoveredNode: (node, screenX = 0, screenY = 0) => {
    set({
      hoverInfo: {
        nodeId: node ? node.id : null,
        screenX,
        screenY,
      },
    });
  },

  setDragging: (dragging) => {
    set({ isDragging: dragging });
  },

  setTheme: (mode) => {
    set({ theme: mode });
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode);
    }
  },

  refreshState: () => {
    const { engine } = get();
    set({
      timelines: engine.getTimelines(),
      viewport: engine.getViewport(),
    });
  },

  exportSnapshot: () => {
    const { engine } = get();
    return engine.exportSnapshot();
  },

  importSnapshot: (snapshot) => {
    const { engine, selectedNodeId } = get();
    const result = engine.importSnapshot(snapshot);
    if (result.success) {
      const stillExists = selectedNodeId
        ? engine.getNodeById(selectedNodeId) !== undefined
        : false;
      set({ selectedNodeId: stillExists ? selectedNodeId : null });
      get().refreshState();
    }
    return result;
  },

  formatDate: (timestamp) => {
    return get().engine.formatDate(timestamp);
  },

  getTotalNodes: () => {
    return get().engine.getTotalNodes();
  },

  getNodeById: (id) => {
    return get().engine.getNodeById(id);
  },
}));

export const selectTimelines = (state: TimelineStore) => state.timelines;
export const selectViewport = (state: TimelineStore) => state.viewport;
export const selectTheme = (state: TimelineStore) => state.theme;
export const selectSelectedNodeId = (state: TimelineStore) => state.selectedNodeId;
export const selectHoverInfo = (state: TimelineStore) => state.hoverInfo;
export const selectIsDragging = (state: TimelineStore) => state.isDragging;
export const selectEngine = (state: TimelineStore) => state.engine;
