import { create } from 'zustand';
import type { Cell, Totem, GameStatus } from '@/types';
import { generateMaze } from '@/utils/mazeGenerator';

const GRID_SIZE = 15;
const WALL_THICKNESS = 2;
const PASSAGE_WIDTH = 4;
const CELL_PIXEL_SIZE = WALL_THICKNESS + PASSAGE_WIDTH;
const CANVAS_SIZE = GRID_SIZE * CELL_PIXEL_SIZE;
const PLAYER_SPEED = 120;

const TOTEM_FREQUENCIES = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00];

interface GameState {
  gridSize: number;
  cellPixelSize: number;
  canvasSize: number;
  wallThickness: number;
  passageWidth: number;
  walls: Set<string>;
  playerPosition: { x: number; y: number };
  playerSpeed: number;
  totems: Totem[];
  collectedCount: number;
  exitPosition: Cell;
  exitActivated: boolean;
  startTime: number;
  timeElapsed: number;
  gameStatus: GameStatus;
  keys: Set<string>;
  initGame: () => void;
  setPlayerPosition: (x: number, y: number) => void;
  triggerTotem: (id: string) => void;
  updateTime: () => void;
  triggerVictory: () => void;
  setKey: (key: string, pressed: boolean) => void;
}

const cellToPixel = (cellX: number, cellY: number) => ({
  x: cellX * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
  y: cellY * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
});

const generateId = () => Math.random().toString(36).substring(2, 11);

const createInitialState = () => {
  const { walls, passages } = generateMaze(GRID_SIZE, GRID_SIZE, WALL_THICKNESS, PASSAGE_WIDTH);

  const passageList = Array.from(passages);
  const startPassage = passageList[0];
  const exitPassage = passageList[passageList.length - 1];

  const startCell = startPassage.split(',').map(Number);
  const exitCell = exitPassage.split(',').map(Number);

  const startPixel = cellToPixel(startCell[0], startCell[1]);
  const exitPixel = cellToPixel(exitCell[0], exitCell[1]);

  const midPassages = passageList.slice(1, -1);
  const step = Math.max(1, Math.floor(midPassages.length / 7));
  const totemPassages: string[] = [];
  for (let i = 1; i <= 6; i++) {
    const idx = Math.min(i * step, midPassages.length - 1);
    if (idx >= 0 && idx < midPassages.length) {
      totemPassages.push(midPassages[idx]);
    }
  }

  const totems: Totem[] = totemPassages.map((p, i) => {
    const [px, py] = p.split(',').map(Number);
    const pixel = cellToPixel(px, py);
    return {
      id: generateId(),
      position: { x: pixel.x, y: pixel.y },
      frequency: TOTEM_FREQUENCIES[i] ?? 440,
      status: 'idle',
      glowStart: 0,
    };
  });

  return {
    gridSize: GRID_SIZE,
    cellPixelSize: CELL_PIXEL_SIZE,
    canvasSize: CANVAS_SIZE,
    wallThickness: WALL_THICKNESS,
    passageWidth: PASSAGE_WIDTH,
    walls,
    playerPosition: { x: startPixel.x, y: startPixel.y },
    playerSpeed: PLAYER_SPEED,
    totems,
    collectedCount: 0,
    exitPosition: { x: exitPixel.x, y: exitPixel.y },
    exitActivated: false,
    startTime: performance.now(),
    timeElapsed: 0,
    gameStatus: 'playing' as GameStatus,
    keys: new Set<string>(),
  };
};

export const useGameStore = create<GameState>((set, get) => ({
  ...createInitialState(),

  initGame: () => {
    set(createInitialState());
  },

  setPlayerPosition: (x: number, y: number) => {
    set({ playerPosition: { x, y } });
  },

  triggerTotem: (id: string) => {
    const state = get();
    const newTotems = state.totems.map((t) =>
      t.id === id ? { ...t, status: 'collected' as const, glowStart: performance.now() } : t
    );
    const newCollectedCount = state.collectedCount + 1;
    const newExitActivated = newCollectedCount >= 6;
    set({
      totems: newTotems,
      collectedCount: newCollectedCount,
      exitActivated: newExitActivated,
    });
  },

  updateTime: () => {
    const state = get();
    if (state.gameStatus === 'playing') {
      set({ timeElapsed: (performance.now() - state.startTime) / 1000 });
    }
  },

  triggerVictory: () => {
    set({ gameStatus: 'victory' });
  },

  setKey: (key: string, pressed: boolean) => {
    const state = get();
    const newKeys = new Set(state.keys);
    if (pressed) {
      newKeys.add(key);
    } else {
      newKeys.delete(key);
    }
    set({ keys: newKeys });
  },
}));
