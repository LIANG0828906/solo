import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ELEMENT_COLORS } from '@/utils/colors';

export type GamePhase = 'loading' | 'playing' | 'matrix' | 'complete';

export interface Fragment {
  id: string;
  position: [number, number, number];
  originalPosition: [number, number, number];
  elementColor: string;
  matchedNodeId: string;
  isMatched: boolean;
  isDragging: boolean;
}

export interface EnergyNode {
  id: string;
  position: [number, number, number];
  acceptElement: string;
  isLit: boolean;
  isError: boolean;
}

export interface MatrixRune {
  id: number;
  symbol: string;
  correctOrder: number;
  isActivated: boolean;
  isError: boolean;
  pulsePhase: number;
}

export interface TrailPoint {
  id: string;
  position: [number, number, number];
  color: string;
  life: number;
}

export interface BurstParticle {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  color: string;
  life: number;
}

interface GameState {
  phase: GamePhase;
  fragments: Fragment[];
  nodes: EnergyNode[];
  runes: MatrixRune[];
  currentRuneIndex: number;
  collectedCount: number;
  totalCount: number;
  levelName: string;
  showSettings: boolean;
  draggingFragmentId: string | null;
  trailPoints: TrailPoint[];
  burstParticles: BurstParticle[];
  successBurstNodeId: string | null;
  showRift: boolean;
  victoryBurstActive: boolean;

  setPhase: (phase: GamePhase) => void;
  initLevel: () => void;
  toggleSettings: () => void;
  startDrag: (fragmentId: string) => void;
  updateFragmentPosition: (fragmentId: string, pos: [number, number, number]) => void;
  addTrailPoint: (pos: [number, number, number], color: string) => void;
  cullTrailPoints: () => void;
  endDrag: (fragmentId: string, matched: boolean, nodeId?: string) => void;
  triggerNodeBurst: (nodeId: string) => void;
  clearNodeBurst: () => void;
  setFragmentMatched: (fragmentId: string, nodeId: string) => void;
  setNodeError: (nodeId: string) => void;
  clearNodeError: (nodeId: string) => void;
  showVoidRift: () => void;
  initMatrix: () => void;
  activateRune: (runeId: number, correct: boolean) => void;
  setRuneError: (runeId: number) => void;
  clearRuneError: (runeId: number) => void;
  spawnVictoryBurst: () => void;
  updateBurstParticles: (dt: number) => void;
  resetGame: () => void;
}

const RUNE_SYMBOLS = ['☉', '☽', '★', '◈', '⟁', '⚚', '♆', '☌', '✦'];

const generateLevelData = () => {
  const nodeCount = 4;
  const platformPositions: [number, number, number][] = [
    [-6, -0.5, -2],
    [6, -0.5, -2],
    [-4, -0.5, 5],
    [4, -0.5, 5],
  ];
  const fragmentOffsets: [number, number, number][] = [
    [-1.8, 0.8, 0],
    [1.8, 0.8, 0],
    [-1.8, 0.8, 0],
    [1.8, 0.8, 0],
  ];

  const nodes: EnergyNode[] = [];
  const fragments: Fragment[] = [];

  for (let i = 0; i < nodeCount; i++) {
    const nodeId = uuidv4();
    const color = ELEMENT_COLORS[i % ELEMENT_COLORS.length];
    const platformPos = platformPositions[i];
    const nodePos: [number, number, number] = [platformPos[0], platformPos[1] + 1.5, platformPos[2]];
    const fragPos: [number, number, number] = [
      platformPos[0] + fragmentOffsets[i][0],
      platformPos[1] + fragmentOffsets[i][1] + 0.5,
      platformPos[2] + fragmentOffsets[i][2],
    ];

    nodes.push({
      id: nodeId,
      position: nodePos,
      acceptElement: color,
      isLit: false,
      isError: false,
    });

    fragments.push({
      id: uuidv4(),
      position: [...fragPos] as [number, number, number],
      originalPosition: [...fragPos] as [number, number, number],
      elementColor: color,
      matchedNodeId: nodeId,
      isMatched: false,
      isDragging: false,
    });
  }

  const shuffledFragments = [...fragments].sort(() => Math.random() - 0.5);
  const originalPositions = fragments.map(f => f.originalPosition);
  shuffledFragments.forEach((f, i) => {
    f.originalPosition = originalPositions[i];
    f.position = [...originalPositions[i]] as [number, number, number];
  });

  return { nodes, fragments: shuffledFragments };
};

const generateRunes = (): MatrixRune[] => {
  const symbols = [...RUNE_SYMBOLS].sort(() => Math.random() - 0.5);
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(() => Math.random() - 0.5);
  return symbols.slice(0, 9).map((symbol, i) => ({
    id: i,
    symbol,
    correctOrder: order[i],
    isActivated: false,
    isError: false,
    pulsePhase: Math.random() * Math.PI * 2,
  }));
};

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'loading',
  fragments: [],
  nodes: [],
  runes: [],
  currentRuneIndex: 0,
  collectedCount: 0,
  totalCount: 4,
  levelName: '第一章 · 虚空觉醒',
  showSettings: false,
  draggingFragmentId: null,
  trailPoints: [],
  burstParticles: [],
  successBurstNodeId: null,
  showRift: false,
  victoryBurstActive: false,

  setPhase: (phase) => set({ phase }),

  initLevel: () => {
    const { nodes, fragments } = generateLevelData();
    set({
      fragments,
      nodes,
      collectedCount: 0,
      totalCount: fragments.length,
      currentRuneIndex: 0,
      showRift: false,
      victoryBurstActive: false,
      burstParticles: [],
      trailPoints: [],
    });
  },

  toggleSettings: () => set((s) => ({ showSettings: !s.showSettings })),

  startDrag: (fragmentId) =>
    set((s) => ({
      draggingFragmentId: fragmentId,
      fragments: s.fragments.map((f) =>
        f.id === fragmentId ? { ...f, isDragging: true } : f
      ),
    })),

  updateFragmentPosition: (fragmentId, pos) =>
    set((s) => ({
      fragments: s.fragments.map((f) =>
        f.id === fragmentId ? { ...f, position: pos } : f
      ),
    })),

  addTrailPoint: (pos, color) =>
    set((s) => ({
      trailPoints: [
        ...s.trailPoints.slice(-50),
        { id: uuidv4(), position: pos, color, life: 1 },
      ],
    })),

  cullTrailPoints: () =>
    set((s) => ({
      trailPoints: s.trailPoints
        .map((t) => ({ ...t, life: t.life - 0.05 }))
        .filter((t) => t.life > 0),
    })),

  endDrag: (fragmentId) =>
    set((s) => ({
      draggingFragmentId: null,
      fragments: s.fragments.map((f) =>
        f.id === fragmentId ? { ...f, isDragging: false } : f
      ),
    })),

  triggerNodeBurst: (nodeId) => set({ successBurstNodeId: nodeId }),
  clearNodeBurst: () => set({ successBurstNodeId: null }),

  setFragmentMatched: (fragmentId, nodeId) =>
    set((s) => {
      const node = s.nodes.find((n) => n.id === nodeId);
      const newCount = s.collectedCount + 1;
      return {
        fragments: s.fragments.map((f) =>
          f.id === fragmentId
            ? { ...f, isMatched: true, position: node ? [...node.position] as [number, number, number] : f.position }
            : f
        ),
        nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, isLit: true } : n)),
        collectedCount: newCount,
      };
    }),

  setNodeError: (nodeId) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, isError: true } : n)),
    })),

  clearNodeError: (nodeId) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, isError: false } : n)),
    })),

  showVoidRift: () => set({ showRift: true, phase: 'matrix' }),

  initMatrix: () => {
    const runes = generateRunes();
    set({ runes, currentRuneIndex: 0 });
  },

  activateRune: (runeId) =>
    set((s) => {
      const rune = s.runes.find((r) => r.id === runeId);
      if (!rune) return {};
      const newIndex = s.currentRuneIndex + 1;
      const isComplete = newIndex >= s.runes.length;
      return {
        currentRuneIndex: newIndex,
        runes: s.runes.map((r) => (r.id === runeId ? { ...r, isActivated: true } : r)),
        phase: isComplete ? 'complete' : s.phase,
      };
    }),

  setRuneError: (runeId) =>
    set((s) => ({
      runes: s.runes.map((r) => (r.id === runeId ? { ...r, isError: true } : r)),
    })),

  clearRuneError: (runeId) =>
    set((s) => ({
      runes: s.runes.map((r) => (r.id === runeId ? { ...r, isError: false } : r)),
    })),

  spawnVictoryBurst: () => {
    const particles: BurstParticle[] = [];
    const colors = ['#d4af37', '#00d4ff', '#ff00ff', '#00ff88', '#ff9500'];
    for (let i = 0; i < 150; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 2 + Math.random() * 4;
      particles.push({
        id: uuidv4(),
        position: [0, 1, 1.5],
        velocity: [
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.cos(phi) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
        ],
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
      });
    }
    set({ victoryBurstActive: true, burstParticles: particles });
  },

  updateBurstParticles: (dt) =>
    set((s) => ({
      burstParticles: s.burstParticles
        .map((p) => ({
          ...p,
          position: [
            p.position[0] + p.velocity[0] * dt,
            p.position[1] + p.velocity[1] * dt,
            p.position[2] + p.velocity[2] * dt,
          ],
          velocity: [p.velocity[0], p.velocity[1] - 2 * dt, p.velocity[2]],
          life: p.life - dt * 0.5,
        }))
        .filter((p) => p.life > 0),
    })),

  resetGame: () => {
    const { nodes, fragments } = generateLevelData();
    set({
      phase: 'playing',
      fragments,
      nodes,
      runes: [],
      currentRuneIndex: 0,
      collectedCount: 0,
      totalCount: fragments.length,
      showSettings: false,
      draggingFragmentId: null,
      trailPoints: [],
      burstParticles: [],
      successBurstNodeId: null,
      showRift: false,
      victoryBurstActive: false,
    });
    void get();
  },
}));
