import { create } from 'zustand';
import type { AppState, Artwork, InspirationFragment, GraphNode, GraphEdge, HistoryRecord } from '../utils/types';
import { randomPick, parseFragments, extractNodes, generateEdges } from '../utils/dataEngine';
import { runForceLayout } from '../utils/inspirationGraph';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;

const initialState: AppState = {
  isCardFlipped: false,
  currentArtwork: null,
  currentFragments: [],
  showStoryCard: false,
  graphNodes: [],
  graphEdges: [],
  history: [],
  showHistory: false,
  showResetDialog: false,
  isTransitioning: false,
  particlePosition: null,
};

interface AppActions {
  flipCard: () => void;
  flipCardBack: () => void;
  unpackArtwork: (particlePos: { x: number; y: number }) => void;
  completeUnpack: () => void;
  addGraphNodes: (fragments: InspirationFragment[]) => void;
  updateNodePosition: (id: string, x: number, y: number) => void;
  setNodeDragging: (id: string, dragging: boolean) => void;
  clearNewNodeFlag: (id: string) => void;
  toggleHistory: () => void;
  reconnectArtwork: (record: HistoryRecord) => void;
  showReset: () => void;
  hideReset: () => void;
  resetAll: () => Promise<void>;
  setParticlePosition: (pos: { x: number; y: number } | null) => void;
}

export const useStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,

  flipCard: () => {
    set({ isCardFlipped: true });
  },

  flipCardBack: () => {
    set({ isCardFlipped: false, showStoryCard: false });
  },

  unpackArtwork: (particlePos) => {
    const artwork = randomPick();
    const fragments = parseFragments(artwork);

    set({
      currentArtwork: artwork,
      currentFragments: fragments,
      particlePosition: particlePos,
    });
  },

  completeUnpack: () => {
    const { currentFragments, graphNodes, graphEdges } = get();

    const rawNodes = extractNodes(currentFragments, CANVAS_WIDTH, CANVAS_HEIGHT);
    const newNodes: GraphNode[] = rawNodes.map(n => ({
      ...n,
      x: n.x,
      y: n.y,
      vx: 0,
      vy: 0,
      isDragging: false,
    }));

    const newEdges = generateEdges(newNodes, graphNodes);

    const allNodes = [...graphNodes, ...newNodes];
    const allEdges = [...graphEdges, ...newEdges];

    runForceLayout(allNodes, allEdges, CANVAS_WIDTH, CANVAS_HEIGHT, 30);

    const historyRecord: HistoryRecord = {
      id: `hist-${Date.now()}`,
      artworkId: get().currentArtwork!.id,
      artworkTitle: get().currentArtwork!.title,
      thumbnail: get().currentArtwork!.thumbnail,
      timestamp: Date.now(),
      fragments: currentFragments,
    };

    const currentHistory = get().history;
    const newHistory = [historyRecord, ...currentHistory].slice(0, 10);

    set({
      graphNodes: allNodes,
      graphEdges: allEdges,
      showStoryCard: true,
      particlePosition: null,
      history: newHistory,
    });

    setTimeout(() => {
      set(state => ({
        graphNodes: state.graphNodes.map(n => ({ ...n, isNew: false })),
      }));
    }, 1000);
  },

  addGraphNodes: (fragments) => {
    const { graphNodes, graphEdges } = get();

    const rawNodes = extractNodes(fragments, CANVAS_WIDTH, CANVAS_HEIGHT);
    const newNodes: GraphNode[] = rawNodes.map(n => ({
      ...n,
      x: n.x,
      y: n.y,
      vx: 0,
      vy: 0,
      isDragging: false,
    }));

    const newEdges = generateEdges(newNodes, graphNodes);

    const allNodes = [...graphNodes, ...newNodes];
    const allEdges = [...graphEdges, ...newEdges];

    runForceLayout(allNodes, allEdges, CANVAS_WIDTH, CANVAS_HEIGHT, 30);

    set({
      graphNodes: allNodes,
      graphEdges: allEdges,
    });

    setTimeout(() => {
      set(state => ({
        graphNodes: state.graphNodes.map(n => ({ ...n, isNew: false })),
      }));
    }, 1000);
  },

  updateNodePosition: (id, x, y) => {
    set(state => ({
      graphNodes: state.graphNodes.map(n =>
        n.id === id ? { ...n, x, y, vx: 0, vy: 0 } : n
      ),
    }));
  },

  setNodeDragging: (id, dragging) => {
    set(state => ({
      graphNodes: state.graphNodes.map(n =>
        n.id === id ? { ...n, isDragging: dragging } : n
      ),
    }));
  },

  clearNewNodeFlag: (id) => {
    set(state => ({
      graphNodes: state.graphNodes.map(n =>
        n.id === id ? { ...n, isNew: false } : n
      ),
    }));
  },

  toggleHistory: () => {
    set(state => ({ showHistory: !state.showHistory }));
  },

  reconnectArtwork: (record) => {
    get().addGraphNodes(record.fragments);
  },

  showReset: () => {
    set({ showResetDialog: true });
  },

  hideReset: () => {
    set({ showResetDialog: false });
  },

  resetAll: async () => {
    set({ isTransitioning: true, showResetDialog: false });

    await new Promise(resolve => setTimeout(resolve, 300));

    set({
      ...initialState,
      isTransitioning: true,
    });

    await new Promise(resolve => setTimeout(resolve, 300));

    set({ isTransitioning: false });
  },

  setParticlePosition: (pos) => {
    set({ particlePosition: pos });
  },
}));
