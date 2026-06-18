import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Snake, Food, GameStage, Point, Direction } from './types';
import { COLOR_PALETTE, AI_NAMES, CANVAS_SIZE, GRID_SIZE } from './types';

interface GameStore {
  snakes: Snake[];
  foods: Food[];
  gameStage: GameStage;
  winnerId: string | null;
  setSnakes: (snakes: Snake[]) => void;
  setFoods: (foods: Food[]) => void;
  addFood: (food: Food) => void;
  removeFood: (foodId: string) => void;
  updateSnake: (snakeId: string, updates: Partial<Snake>) => void;
  setGameStage: (stage: GameStage) => void;
  setWinnerId: (winnerId: string | null) => void;
  initGame: () => void;
  resetGame: () => void;
}

const createInitialSnakes = (): Snake[] => {
  const snakes: Snake[] = [];
  const center = CANVAS_SIZE / 2;
  const margin = 60;

  const playerSnake: Snake = {
    id: uuidv4(),
    name: '玩家',
    body: [
      { x: margin, y: center },
      { x: margin - GRID_SIZE, y: center },
      { x: margin - GRID_SIZE * 2, y: center },
    ],
    direction: 'right',
    alive: true,
    score: 0,
    color: COLOR_PALETTE[0],
    isPlayer: true,
  };
  snakes.push(playerSnake);

  const spawnPositions: { pos: Point; dir: Direction }[] = [
    { pos: { x: CANVAS_SIZE - margin, y: center }, dir: 'left' },
    { pos: { x: center, y: margin }, dir: 'down' },
    { pos: { x: center, y: CANVAS_SIZE - margin }, dir: 'up' },
    { pos: { x: margin, y: margin + 40 }, dir: 'right' },
  ];

  for (let i = 0; i < 4; i++) {
    const spawn = spawnPositions[i];
    const aiSnake: Snake = {
      id: uuidv4(),
      name: AI_NAMES[i],
      body: [
        spawn.pos,
        { x: spawn.pos.x - (spawn.dir === 'right' ? GRID_SIZE : spawn.dir === 'left' ? -GRID_SIZE : 0),
          y: spawn.pos.y - (spawn.dir === 'down' ? GRID_SIZE : spawn.dir === 'up' ? -GRID_SIZE : 0) },
        { x: spawn.pos.x - (spawn.dir === 'right' ? GRID_SIZE * 2 : spawn.dir === 'left' ? -GRID_SIZE * 2 : 0),
          y: spawn.pos.y - (spawn.dir === 'down' ? GRID_SIZE * 2 : spawn.dir === 'up' ? -GRID_SIZE * 2 : 0) },
      ],
      direction: spawn.dir,
      alive: true,
      score: 0,
      color: COLOR_PALETTE[i + 1],
      isPlayer: false,
      lastTurnTime: Date.now(),
    };
    snakes.push(aiSnake);
  }

  return snakes;
};

export const useGameStore = create<GameStore>((set, get) => ({
  snakes: createInitialSnakes(),
  foods: [],
  gameStage: 'waiting',
  winnerId: null,

  setSnakes: (snakes) => set({ snakes }),

  setFoods: (foods) => set({ foods }),

  addFood: (food) => set((state) => ({ foods: [...state.foods, food] })),

  removeFood: (foodId) => set((state) => ({
    foods: state.foods.filter((f) => f.id !== foodId),
  })),

  updateSnake: (snakeId, updates) => set((state) => ({
    snakes: state.snakes.map((s) =>
      s.id === snakeId ? { ...s, ...updates } : s
    ),
  })),

  setGameStage: (stage) => set({ gameStage: stage }),

  setWinnerId: (winnerId) => set({ winnerId }),

  initGame: () => set({
    snakes: createInitialSnakes(),
    foods: [],
    gameStage: 'waiting',
    winnerId: null,
  }),

  resetGame: () => set({
    snakes: createInitialSnakes(),
    foods: [],
    gameStage: 'waiting',
    winnerId: null,
  }),
}));

export const getGameState = () => useGameStore.getState();
export const setGameState = (partial: Partial<GameStore>) => useGameStore.setState(partial);
