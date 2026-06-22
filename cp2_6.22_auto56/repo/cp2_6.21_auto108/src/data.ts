import { create } from 'zustand';
import type { Prism, Crystal, Obstacle, LightSource } from './core';

export interface Level {
  id: number;
  name: string;
  lightSource: LightSource;
  prisms: Prism[];
  crystals: Crystal[];
  obstacles: Obstacle[];
}

export interface PlayerProgress {
  unlockedLevels: number[];
  bestScores: Record<number, number>;
  totalScore: number;
}

export interface CrystalHit {
  crystalId: string;
  color: string;
  intensity: number;
}

export interface GameState {
  currentLevel: number;
  score: number;
  prisms: Prism[];
  crystals: Crystal[];
  obstacles: Obstacle[];
  lightSource: LightSource;
  isVictory: boolean;
  isTransitioning: boolean;
  transitionAlpha: number;
  transitionPhase: 'idle' | 'fade-out' | 'loading' | 'fade-in';
  _pendingLevel?: { levelId: number; level: Level };
  showHint: boolean;
  playerProgress: PlayerProgress;
  levels: Level[];
  setPrismRotation: (prismId: string, rotation: number) => void;
  updateCrystalStates: (hits: CrystalHit[], deltaTime: number) => void;
  loadLevel: (levelId: number) => void;
  resetLevel: () => void;
  nextLevel: () => void;
  toggleHint: () => void;
  updateTransition: (deltaTime: number) => void;
  onCrystalLit: ((crystalId: string) => void) | null;
  setOnCrystalLit: (callback: ((crystalId: string) => void) | null) => void;
}

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const COLOR_MAP: Record<string, 'red' | 'green' | 'blue'> = {
  '#FF4500': 'red',
  '#32CD32': 'green',
  '#1E90FF': 'blue',
};

export const LEVELS: Level[] = [
  {
    id: 1,
    name: '初识光影',
    lightSource: { position: { x: 50, y: 300 }, direction: 0 },
    prisms: [
      { id: 'p1', position: { x: 300, y: 300 }, rotation: 0, size: 30 },
    ],
    crystals: [
      { id: 'c1', position: { x: 600, y: 200 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c2', position: { x: 600, y: 400 }, color: 'blue', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
    ],
    obstacles: [],
  },
  {
    id: 2,
    name: '折射之道',
    lightSource: { position: { x: 50, y: 200 }, direction: 0 },
    prisms: [
      { id: 'p1', position: { x: 250, y: 250 }, rotation: Math.PI / 6, size: 30 },
    ],
    crystals: [
      { id: 'c1', position: { x: 500, y: 150 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c2', position: { x: 550, y: 300 }, color: 'green', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c3', position: { x: 500, y: 450 }, color: 'blue', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
    ],
    obstacles: [
      { id: 'o1', position: { x: 400, y: 400 }, width: 100, height: 20, rotation: 0 },
    ],
  },
  {
    id: 3,
    name: '迷雾重重',
    lightSource: { position: { x: 50, y: 300 }, direction: 0 },
    prisms: [
      { id: 'p1', position: { x: 200, y: 300 }, rotation: 0, size: 30 },
    ],
    crystals: [
      { id: 'c1', position: { x: 700, y: 100 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c2', position: { x: 750, y: 250 }, color: 'green', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c3', position: { x: 700, y: 400 }, color: 'blue', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c4', position: { x: 650, y: 500 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
    ],
    obstacles: [
      { id: 'o1', position: { x: 350, y: 200 }, width: 100, height: 20, rotation: Math.PI / 4 },
      { id: 'o2', position: { x: 450, y: 350 }, width: 100, height: 20, rotation: -Math.PI / 6 },
      { id: 'o3', position: { x: 550, y: 150 }, width: 100, height: 20, rotation: Math.PI / 3 },
      { id: 'o4', position: { x: 500, y: 500 }, width: 100, height: 20, rotation: 0 },
    ],
  },
  {
    id: 4,
    name: '双镜齐舞',
    lightSource: { position: { x: 50, y: 150 }, direction: 0 },
    prisms: [
      { id: 'p1', position: { x: 250, y: 200 }, rotation: 0, size: 30 },
      { id: 'p2', position: { x: 500, y: 400 }, rotation: 0, size: 30 },
    ],
    crystals: [
      { id: 'c1', position: { x: 750, y: 100 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c2', position: { x: 800, y: 250 }, color: 'green', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c3', position: { x: 750, y: 400 }, color: 'blue', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c4', position: { x: 700, y: 500 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c5', position: { x: 650, y: 200 }, color: 'green', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
    ],
    obstacles: [
      { id: 'o1', position: { x: 380, y: 100 }, width: 100, height: 20, rotation: 0 },
      { id: 'o2', position: { x: 380, y: 300 }, width: 100, height: 20, rotation: Math.PI / 4 },
      { id: 'o3', position: { x: 600, y: 250 }, width: 100, height: 20, rotation: -Math.PI / 4 },
      { id: 'o4', position: { x: 400, y: 500 }, width: 100, height: 20, rotation: 0 },
      { id: 'o5', position: { x: 650, y: 550 }, width: 100, height: 20, rotation: Math.PI / 6 },
    ],
  },
  {
    id: 5,
    name: '光影大师',
    lightSource: { position: { x: 50, y: 300 }, direction: 0 },
    prisms: [
      { id: 'p1', position: { x: 200, y: 200 }, rotation: 0, size: 30 },
      { id: 'p2', position: { x: 450, y: 450 }, rotation: 0, size: 30 },
    ],
    crystals: [
      { id: 'c1', position: { x: 700, y: 80 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c2', position: { x: 780, y: 180 }, color: 'green', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c3', position: { x: 750, y: 300 }, color: 'blue', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c4', position: { x: 780, y: 420 }, color: 'red', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c5', position: { x: 700, y: 520 }, color: 'green', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
      { id: 'c6', position: { x: 620, y: 300 }, color: 'blue', isLit: false, litTime: 0, requiredTime: 1000, accumulatedTime: 0 },
    ],
    obstacles: [
      { id: 'o1', position: { x: 320, y: 150 }, width: 100, height: 20, rotation: Math.PI / 4 },
      { id: 'o2', position: { x: 350, y: 350 }, width: 100, height: 20, rotation: -Math.PI / 6 },
      { id: 'o3', position: { x: 500, y: 200 }, width: 100, height: 20, rotation: Math.PI / 3 },
      { id: 'o4', position: { x: 550, y: 380 }, width: 100, height: 20, rotation: 0 },
      { id: 'o5', position: { x: 400, y: 550 }, width: 100, height: 20, rotation: -Math.PI / 4 },
      { id: 'o6', position: { x: 650, y: 180 }, width: 100, height: 20, rotation: Math.PI / 6 },
    ],
  },
];

function loadProgress(): PlayerProgress {
  try {
    const saved = localStorage.getItem('lightCatcherProgress');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return {
    unlockedLevels: [1],
    bestScores: {},
    totalScore: 0,
  };
}

function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem('lightCatcherProgress', JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save progress:', e);
  }
}

function cloneLevel(level: Level): { prisms: Prism[]; crystals: Crystal[]; obstacles: Obstacle[]; lightSource: LightSource } {
  return {
    prisms: level.prisms.map(p => ({ ...p, position: { ...p.position } })),
    crystals: level.crystals.map(c => ({ ...c, position: { ...c.position }, isLit: false, litTime: 0, accumulatedTime: 0 })),
    obstacles: level.obstacles.map(o => ({ ...o, position: { ...o.position } })),
    lightSource: { ...level.lightSource, position: { ...level.lightSource.position } },
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const initialLevel = LEVELS[0];
  const initialState = cloneLevel(initialLevel);

  return {
    currentLevel: 1,
    score: 0,
    prisms: initialState.prisms,
    crystals: initialState.crystals,
    obstacles: initialState.obstacles,
    lightSource: initialState.lightSource,
    isVictory: false,
    isTransitioning: false,
    transitionAlpha: 0,
    transitionPhase: 'idle',
    _pendingLevel: undefined,
    showHint: false,
    playerProgress: loadProgress(),
    levels: LEVELS,
    onCrystalLit: null,

    setOnCrystalLit: (callback) => set({ onCrystalLit: callback }),

    setPrismRotation: (prismId: string, rotation: number) => {
      set(state => ({
        prisms: state.prisms.map(p =>
          p.id === prismId ? { ...p, rotation } : p
        ),
      }));
    },

    updateCrystalStates: (hits: CrystalHit[], deltaTime: number) => {
      const state = get();
      const hitMap = new Map<string, CrystalHit>();
      hits.forEach(hit => hitMap.set(hit.crystalId, hit));

      let newScore = state.score;
      let newlyLitIds: string[] = [];

      const newCrystals = state.crystals.map(crystal => {
        if (crystal.isLit) return crystal;

        const hit = hitMap.get(crystal.id);
        if (!hit) {
          return { ...crystal, accumulatedTime: 0, litTime: 0 };
        }

        const crystalColor = COLOR_MAP[hit.color] || crystal.color;
        if (crystalColor !== crystal.color) {
          return { ...crystal, accumulatedTime: 0, litTime: 0 };
        }

        const effectiveDelta = deltaTime * hit.intensity;
        const newAccumulatedTime = crystal.accumulatedTime + effectiveDelta;
        const requiredTime = crystal.requiredTime;

        if (newAccumulatedTime >= requiredTime) {
          newlyLitIds.push(crystal.id);
          newScore += 100;
          return { ...crystal, isLit: true, accumulatedTime: requiredTime, litTime: requiredTime };
        }

        return { ...crystal, accumulatedTime: newAccumulatedTime, litTime: newAccumulatedTime };
      });

      const allLit = newCrystals.every(c => c.isLit);

      let newProgress = state.playerProgress;
      if (newlyLitIds.length > 0 && allLit) {
        const levelScore = Math.max(
          state.playerProgress.bestScores[state.currentLevel] || 0,
          newScore
        );
        newProgress = {
          ...state.playerProgress,
          bestScores: {
            ...state.playerProgress.bestScores,
            [state.currentLevel]: levelScore,
          },
          totalScore: state.playerProgress.totalScore + newlyLitIds.length * 100,
          unlockedLevels: state.playerProgress.unlockedLevels.includes(state.currentLevel + 1)
            ? state.playerProgress.unlockedLevels
            : [...state.playerProgress.unlockedLevels, state.currentLevel + 1],
        };
        saveProgress(newProgress);
      }

      newlyLitIds.forEach(id => {
        if (state.onCrystalLit) {
          state.onCrystalLit(id);
        }
      });

      set({
        crystals: newCrystals,
        score: newScore,
        isVictory: allLit,
        playerProgress: newProgress,
      });
    },

    loadLevel: (levelId: number) => {
      const level = LEVELS.find(l => l.id === levelId);
      if (!level) return;

      set({
        isTransitioning: true,
        transitionPhase: 'fade-out',
        transitionAlpha: 0,
        _pendingLevel: { levelId, level },
      });
    },

    resetLevel: () => {
      const state = get();
      get().loadLevel(state.currentLevel);
    },

    nextLevel: () => {
      const state = get();
      const nextLevelId = state.currentLevel + 1;
      if (nextLevelId <= LEVELS.length) {
        get().loadLevel(nextLevelId);
      }
    },

    toggleHint: () => {
      set(state => ({ showHint: !state.showHint }));
    },

    updateTransition: (deltaTime: number) => {
      const state = get();
      if (!state.isTransitioning) return;

      const transitionDuration = 300;
      const speed = 1 / transitionDuration;

      if (state.transitionPhase === 'fade-out') {
        const newAlpha = state.transitionAlpha + speed * deltaTime;
        if (newAlpha >= 1) {
          const pending = state._pendingLevel;
          if (pending) {
            const cloned = cloneLevel(pending.level);
            set({
              transitionAlpha: 1,
              transitionPhase: 'loading',
              currentLevel: pending.levelId,
              score: 0,
              prisms: cloned.prisms,
              crystals: cloned.crystals,
              obstacles: cloned.obstacles,
              lightSource: cloned.lightSource,
              isVictory: false,
              showHint: false,
            });
            setTimeout(() => {
              set({ transitionPhase: 'fade-in' });
            }, 50);
          }
        } else {
          set({ transitionAlpha: newAlpha });
        }
      } else if (state.transitionPhase === 'fade-in') {
        const newAlpha = state.transitionAlpha - speed * deltaTime;
        if (newAlpha <= 0) {
          set({
            transitionAlpha: 0,
            transitionPhase: 'idle',
            isTransitioning: false,
            _pendingLevel: undefined,
          });
        } else {
          set({ transitionAlpha: newAlpha });
        }
      }
    },
  };
});

export { CANVAS_WIDTH, CANVAS_HEIGHT };
