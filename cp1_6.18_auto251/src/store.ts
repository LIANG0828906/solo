import { create } from 'zustand';
import type { CellCoord, WallState, BallPosition, FragmentData, GameState } from './types';

export const MAZE_SIZE = 8;
export const REBUILD_INTERVAL = 30;
export const FRAGMENT_COUNT = 8;

function generateMazeWalls(): WallState[] {
  const walls: WallState[] = [];
  for (let x = 0; x < MAZE_SIZE; x++) {
    for (let z = 0; z < MAZE_SIZE; z++) {
      const isOuter = x === 0 || x === MAZE_SIZE - 1 || z === 0 || z === MAZE_SIZE - 1;
      const isStart = x === 0 && z === 0;
      const isEnd = x === MAZE_SIZE - 1 && z === MAZE_SIZE - 1;
      let active = isOuter;
      if (!isOuter && !isStart && !isEnd) {
        active = Math.random() < 0.35;
      }
      if (isStart || isEnd) {
        active = false;
      }
      walls.push({
        coord: { x, z },
        active,
        transition: 'idle',
        transitionProgress: 1,
      });
    }
  }
  return walls;
}

function generateFragments(walls: WallState[]): FragmentData[] {
  const fragments: FragmentData[] = [];
  const emptyCells: CellCoord[] = [];
  for (const wall of walls) {
    if (!wall.active && !(wall.coord.x === 0 && wall.coord.z === 0) && !(wall.coord.x === MAZE_SIZE - 1 && wall.coord.z === MAZE_SIZE - 1)) {
      emptyCells.push(wall.coord);
    }
  }
  const shuffled = emptyCells.sort(() => Math.random() - 0.5);
  const count = Math.min(FRAGMENT_COUNT, shuffled.length);
  for (let i = 0; i < count; i++) {
    fragments.push({
      id: i,
      coord: shuffled[i],
      collected: false,
    });
  }
  return fragments;
}

interface MazeStore {
  walls: WallState[];
  ballPosition: BallPosition;
  fragments: FragmentData[];
  collectedCount: number;
  totalFragments: number;
  countdown: number;
  gameState: GameState;
  isTransitioning: boolean;

  rebuildMaze: () => void;
  setBallPosition: (pos: BallPosition) => void;
  collectFragment: (id: number) => void;
  tickCountdown: (dt: number) => void;
  resetGame: () => void;
  setTransitioning: (t: boolean) => void;
  setWallTransitionProgress: (progress: number) => void;
}

const initialWalls = generateMazeWalls();
const initialFragments = generateFragments(initialWalls);

export const useMazeStore = create<MazeStore>((set, get) => ({
  walls: initialWalls,
  ballPosition: { x: 0, y: 0.3, z: 0 },
  fragments: initialFragments,
  collectedCount: 0,
  totalFragments: initialFragments.length,
  countdown: REBUILD_INTERVAL,
  gameState: 'playing',
  isTransitioning: false,

  rebuildMaze: () => {
    const oldWalls = get().walls;
    const newWalls = generateMazeWalls();
    const merged: WallState[] = newWalls.map((nw, i) => {
      const ow = oldWalls[i];
      if (ow.active && !nw.active) {
        return { ...nw, transition: 'disappearing' as const, transitionProgress: 0 };
      }
      if (!ow.active && nw.active) {
        return { ...nw, transition: 'appearing' as const, transitionProgress: 0 };
      }
      return { ...nw, transition: 'idle' as const, transitionProgress: 1 };
    });
    const newFragments = generateFragments(merged.filter(w => w.transition !== 'disappearing' || !w.active));
    set({
      walls: merged,
      fragments: newFragments,
      collectedCount: 0,
      totalFragments: newFragments.length,
      countdown: REBUILD_INTERVAL,
      isTransitioning: true,
    });
  },

  setBallPosition: (pos) => set({ ballPosition: pos }),

  collectFragment: (id) => {
    const state = get();
    const frag = state.fragments.find(f => f.id === id);
    if (frag && !frag.collected) {
      const newCollected = state.collectedCount + 1;
      set({
        fragments: state.fragments.map(f => f.id === id ? { ...f, collected: true } : f),
        collectedCount: newCollected,
      });
    }
  },

  tickCountdown: (dt) => {
    const state = get();
    if (state.isTransitioning) return;
    const newCd = state.countdown - dt;
    if (newCd <= 0) {
      get().rebuildMaze();
    } else {
      set({ countdown: newCd });
    }
  },

  resetGame: () => {
    const walls = generateMazeWalls();
    const fragments = generateFragments(walls);
    set({
      walls,
      ballPosition: { x: 0, y: 0.3, z: 0 },
      fragments,
      collectedCount: 0,
      totalFragments: fragments.length,
      countdown: REBUILD_INTERVAL,
      gameState: 'playing',
      isTransitioning: false,
    });
  },

  setTransitioning: (t) => set({ isTransitioning: t }),

  setWallTransitionProgress: (progress) => {
    set(state => ({
      walls: state.walls.map(w => {
        if (w.transition === 'idle') return w;
        if (progress >= 1) {
          return { ...w, transition: 'idle' as const, transitionProgress: 1 };
        }
        return { ...w, transitionProgress: progress };
      }),
    }));
  },
}));
