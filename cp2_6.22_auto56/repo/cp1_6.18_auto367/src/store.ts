import { create } from 'zustand';
import {
  StarNode,
  PathSegment,
  FireworkParticle,
  generateStarMap,
  calculatePathSegments,
  calculateShieldFromSegments,
  createFireworkParticles,
} from './GameMap';

interface GameStore {
  nodes: StarNode[];
  startNodeId: string;
  endNodeId: string;
  adjacencyMatrix: Record<string, Record<string, number>>;
  shortestPathDistance: number;
  selectedPath: string[];
  segments: PathSegment[];
  totalDistance: number;
  totalShieldCost: number;
  remainingShield: number;
  gameStatus: 'idle' | 'planning' | 'warned' | 'success' | 'failed';
  warningVisible: boolean;
  fireworkParticles: FireworkParticle[];
  pathAnimationIndex: number;
  hoveredNodeId: string | null;
  initializeGame: () => void;
  resetGame: () => void;
  clickNode: (nodeId: string) => void;
  clearWarning: () => void;
  updateFireworks: (deltaMs: number) => boolean;
  incrementPathAnimationIndex: () => void;
  setHoveredNode: (nodeId: string | null) => void;
  undoLastStep: () => void;
}

export const useGameStore = create<GameStore>((set, get) => {
  function computeFullPath(path: string[]) {
    const { nodes, adjacencyMatrix } = get();
    const segs = calculatePathSegments(path, nodes, adjacencyMatrix);
    const { totalShieldCost, remainingShield, totalDistance } = calculateShieldFromSegments(
      segs,
      path,
      nodes,
    );
    return { segments: segs, totalShieldCost, remainingShield, totalDistance };
  }

  return {
    nodes: [],
    startNodeId: '',
    endNodeId: '',
    adjacencyMatrix: {},
    shortestPathDistance: 0,
    selectedPath: [],
    segments: [],
    totalDistance: 0,
    totalShieldCost: 0,
    remainingShield: 100,
    gameStatus: 'idle',
    warningVisible: false,
    fireworkParticles: [],
    pathAnimationIndex: -1,
    hoveredNodeId: null,

    initializeGame: () => {
      const result = generateStarMap();
      set({
        nodes: result.nodes,
        startNodeId: result.startNodeId,
        endNodeId: result.endNodeId,
        adjacencyMatrix: result.adjacencyMatrix,
        shortestPathDistance: result.shortestPathDistance,
        selectedPath: [],
        segments: [],
        totalDistance: 0,
        totalShieldCost: 0,
        remainingShield: 100,
        gameStatus: 'idle',
        warningVisible: false,
        fireworkParticles: [],
        pathAnimationIndex: -1,
        hoveredNodeId: null,
      });
    },

    resetGame: () => {
      get().initializeGame();
    },

    setHoveredNode: (nodeId: string | null) => {
      set({ hoveredNodeId: nodeId });
    },

    undoLastStep: () => {
      const { selectedPath, gameStatus } = get();
      if (gameStatus !== 'planning' || selectedPath.length <= 1) return;
      const newPath = selectedPath.slice(0, -1);
      const computed = computeFullPath(newPath);
      set({
        selectedPath: newPath,
        ...computed,
        gameStatus: newPath.length <= 1 ? 'idle' : 'planning',
      });
    },

    clearWarning: () => {
      set({ warningVisible: false, gameStatus: 'planning' });
    },

    clickNode: (nodeId: string) => {
      const {
        selectedPath,
        startNodeId,
        endNodeId,
        shortestPathDistance,
        adjacencyMatrix,
        nodes,
        gameStatus,
      } = get();

      if (gameStatus === 'success') return;

      if (selectedPath.length === 0) {
        if (nodeId !== startNodeId) return;
        const computed = computeFullPath([startNodeId]);
        set({
          selectedPath: [startNodeId],
          ...computed,
          gameStatus: 'planning',
          pathAnimationIndex: -1,
        });
        return;
      }

      const lastId = selectedPath[selectedPath.length - 1];
      if (lastId === endNodeId) return;
      if (selectedPath.includes(nodeId)) {
        const idx = selectedPath.indexOf(nodeId);
        const newPath = selectedPath.slice(0, idx + 1);
        const computed = computeFullPath(newPath);
        set({
          selectedPath: newPath,
          ...computed,
          gameStatus: nodeId === endNodeId ? 'planning' : 'planning',
          pathAnimationIndex: -1,
        });
        return;
      }

      const lastNode = nodes.find(n => n.id === lastId);
      if (!lastNode || !lastNode.connections.includes(nodeId)) return;

      const newPath = [...selectedPath, nodeId];
      const computed = computeFullPath(newPath);

      if (nodeId === endNodeId) {
        if (shortestPathDistance > 0 && computed.totalDistance > shortestPathDistance * 1.5) {
          set({
            selectedPath: newPath,
            ...computed,
            gameStatus: 'warned',
            warningVisible: true,
            pathAnimationIndex: newPath.length - 2,
          });
          return;
        }

        if (computed.remainingShield <= 0) {
          set({
            selectedPath: newPath,
            ...computed,
            gameStatus: 'failed',
            warningVisible: true,
            pathAnimationIndex: newPath.length - 2,
          });
          return;
        }

        const endNode = nodes.find(n => n.id === endNodeId);
        const particles = endNode ? createFireworkParticles(endNode.x, endNode.y) : [];
        set({
          selectedPath: newPath,
          ...computed,
          gameStatus: 'success',
          fireworkParticles: particles,
          pathAnimationIndex: newPath.length - 2,
        });
        return;
      }

      set({
        selectedPath: newPath,
        ...computed,
        gameStatus: 'planning',
        pathAnimationIndex: newPath.length - 2,
      });
    },

    incrementPathAnimationIndex: () => {
      const { pathAnimationIndex, segments } = get();
      if (pathAnimationIndex < segments.length - 1) {
        set({ pathAnimationIndex: pathAnimationIndex + 1 });
      }
    },

    updateFireworks: (deltaMs: number) => {
      const { fireworkParticles } = get();
      if (fireworkParticles.length === 0) return false;
      const gravity = 40;
      const updated = fireworkParticles
        .map(p => ({
          ...p,
          x: p.x + (p.vx * deltaMs) / 1000,
          y: p.y + (p.vy * deltaMs) / 1000 + (gravity * deltaMs * deltaMs) / 2000000,
          life: p.life - deltaMs,
        }))
        .filter(p => p.life > 0);
      set({ fireworkParticles: updated });
      return updated.length > 0;
    },
  };
});
