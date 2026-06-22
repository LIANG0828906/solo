import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type Vec3 = [number, number, number];
export type Euler3 = [number, number, number];

export interface Fragment {
  id: string;
  name: string;
  color: string;
  position: Vec3;
  rotation: Euler3;
  scale: Vec3;
  shapeType: 'box' | 'cylinder' | 'combo';
  shapeParams: {
    width?: number;
    height?: number;
    depth?: number;
    radius?: number;
    radialSegments?: number;
  };
  isMatched: boolean;
  matchScore: number;
  partnerId: string | null;
  targetPosition: Vec3;
  targetRotation: Euler3;
}

export interface FloatingScore {
  id: string;
  x: number;
  y: number;
  value: number;
  createdAt: number;
}

interface GameState {
  fragments: Fragment[];
  selectedId: string | null;
  hoveredId: string | null;
  progress: number;
  totalScore: number;
  isComplete: boolean;
  floatingScores: FloatingScore[];
  showCompleteCard: boolean;
  cameraResetSignal: number;

  selectFragment: (id: string | null) => void;
  setHoveredFragment: (id: string | null) => void;
  updateFragment: (id: string, updates: Partial<Fragment>) => void;
  matchFragments: (id1: string, id2: string, score: number) => void;
  addFloatingScore: (x: number, y: number, value: number) => void;
  removeFloatingScore: (id: string) => void;
  resetView: () => void;
  autoAlign: () => void;
  resetAll: () => void;
}

const FRAGMENT_COLORS = [
  '#B87333',
  '#C0A050',
  '#8B7355',
  '#A0522D',
  '#CD853F',
  '#D2691E',
  '#8B4513',
  '#BC8F8F',
];

const FRAGMENT_NAMES = [
  '青铜鼎残片A',
  '青铜鼎残片B',
  '陶罐口沿',
  '陶罐腹壁',
  '玉佩残件',
  '石斧刃部',
  '骨簪首部',
  '瓷碗底足',
];

function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateRandomFragments(): Fragment[] {
  const fragments: Fragment[] = [];
  const pairCount = 4;

  for (let i = 0; i < pairCount; i++) {
    const baseAngle = (i / pairCount) * Math.PI * 2;
    const targetRadius = 1.2;

    const targetPos1: Vec3 = [
      Math.cos(baseAngle) * targetRadius,
      0,
      Math.sin(baseAngle) * targetRadius,
    ];
    const targetPos2: Vec3 = [
      Math.cos(baseAngle + Math.PI) * targetRadius,
      0,
      Math.sin(baseAngle + Math.PI) * targetRadius,
    ];

    const angle1 = randomInRange(0, Math.PI * 2);
    const angle2 = randomInRange(0, Math.PI * 2);
    const scatterRadius = 5;

    const id1 = uuidv4();
    const id2 = uuidv4();

    const shapeTypes: Array<'box' | 'cylinder' | 'combo'> = ['box', 'cylinder', 'combo'];
    const shapeType = shapeTypes[i % 3];

    const commonParams = {
      box: { width: 1.2, height: 0.8, depth: 1.0 },
      cylinder: { radius: 0.7, height: 1.0, radialSegments: 16 },
      combo: { width: 1.0, height: 0.9, depth: 1.1, radius: 0.4 },
    }[shapeType];

    fragments.push({
      id: id1,
      name: FRAGMENT_NAMES[i * 2],
      color: FRAGMENT_COLORS[i * 2 % FRAGMENT_COLORS.length],
      position: [
        Math.cos(angle1) * scatterRadius,
        randomInRange(-1, 1),
        Math.sin(angle1) * scatterRadius,
      ],
      rotation: [
        randomInRange(0, Math.PI * 2),
        randomInRange(0, Math.PI * 2),
        randomInRange(0, Math.PI * 2),
      ],
      scale: [1, 1, 1],
      shapeType,
      shapeParams: commonParams,
      isMatched: false,
      matchScore: 0,
      partnerId: id2,
      targetPosition: targetPos1,
      targetRotation: [0, baseAngle, 0],
    });

    fragments.push({
      id: id2,
      name: FRAGMENT_NAMES[i * 2 + 1],
      color: FRAGMENT_COLORS[(i * 2 + 1) % FRAGMENT_COLORS.length],
      position: [
        Math.cos(angle2) * scatterRadius,
        randomInRange(-1, 1),
        Math.sin(angle2) * scatterRadius,
      ],
      rotation: [
        randomInRange(0, Math.PI * 2),
        randomInRange(0, Math.PI * 2),
        randomInRange(0, Math.PI * 2),
      ],
      scale: [1, 1, 1],
      shapeType,
      shapeParams: commonParams,
      isMatched: false,
      matchScore: 0,
      partnerId: id1,
      targetPosition: targetPos2,
      targetRotation: [0, baseAngle + Math.PI, 0],
    });
  }

  return fragments;
}

export const useGameStore = create<GameState>((set, get) => ({
  fragments: generateRandomFragments(),
  selectedId: null,
  hoveredId: null,
  progress: 0,
  totalScore: 0,
  isComplete: false,
  floatingScores: [],
  showCompleteCard: false,
  cameraResetSignal: 0,

  selectFragment: (id) => set({ selectedId: id }),

  setHoveredFragment: (id) => set({ hoveredId: id }),

  updateFragment: (id, updates) =>
    set((state) => ({
      fragments: state.fragments.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),

  matchFragments: (id1, id2, score) =>
    set((state) => {
      const updatedFragments = state.fragments.map((f) => {
        if (f.id === id1 || f.id === id2) {
          return {
            ...f,
            isMatched: true,
            matchScore: score,
            position: f.targetPosition,
            rotation: f.targetRotation,
          };
        }
        return f;
      });

      const matchedCount = updatedFragments.filter((f) => f.isMatched).length;
      const progress = (matchedCount / updatedFragments.length) * 100;
      const isComplete = matchedCount === updatedFragments.length;
      const newTotalScore = state.totalScore + score;

      return {
        fragments: updatedFragments,
        progress,
        totalScore: newTotalScore,
        isComplete,
        selectedId: null,
        showCompleteCard: isComplete,
      };
    }),

  addFloatingScore: (x, y, value) =>
    set((state) => ({
      floatingScores: [
        ...state.floatingScores,
        { id: uuidv4(), x, y, value, createdAt: Date.now() },
      ],
    })),

  removeFloatingScore: (id) =>
    set((state) => ({
      floatingScores: state.floatingScores.filter((s) => s.id !== id),
    })),

  resetView: () =>
    set((state) => ({
      cameraResetSignal: state.cameraResetSignal + 1,
    })),

  autoAlign: () => {
    const state = get();
    const updatedFragments = state.fragments.map((f) => ({
      ...f,
      isMatched: true,
      matchScore: 100,
      position: f.targetPosition,
      rotation: f.targetRotation,
    }));
    set({
      fragments: updatedFragments,
      progress: 100,
      totalScore: updatedFragments.length * 5,
      isComplete: true,
      selectedId: null,
      showCompleteCard: true,
    });
  },

  resetAll: () =>
    set({
      fragments: generateRandomFragments(),
      selectedId: null,
      hoveredId: null,
      progress: 0,
      totalScore: 0,
      isComplete: false,
      floatingScores: [],
      showCompleteCard: false,
      cameraResetSignal: 0,
    }),
}));
