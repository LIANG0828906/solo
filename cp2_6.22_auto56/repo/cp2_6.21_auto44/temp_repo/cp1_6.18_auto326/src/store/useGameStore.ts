import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { GameStore, BlockType, BallState } from '../types/game';
import { LEVELS } from '../config/levels';

const getInitialBallState = (levelIndex: number): BallState => {
  const level = LEVELS[levelIndex];
  return {
    x: level.startX,
    y: level.startY,
    vx: 0,
    vy: 0,
    trail: [],
  };
};

const getInitialAvailableBlocks = (levelIndex: number) => {
  const level = LEVELS[levelIndex];
  return {
    'n-pole': level.availableBlocks['n-pole'],
    's-pole': level.availableBlocks['s-pole'],
    'neutral': level.availableBlocks['neutral'],
  };
};

const useGameStore = create<GameStore>((set, get) => ({
  currentLevel: 0,
  completedLevels: [],
  phase: 'editing',
  placedBlocks: [],
  availableBlocks: getInitialAvailableBlocks(0),
  ball: getInitialBallState(0),
  timer: 0,
  moveCount: 0,
  isDragging: false,
  draggingBlockType: null,
  fireworksActive: false,

  startSimulation: () => {
    set({ phase: 'simulating' });
  },

  resetLevel: () => {
    const { currentLevel } = get();
    set({
      phase: 'editing',
      placedBlocks: [],
      availableBlocks: getInitialAvailableBlocks(currentLevel),
      ball: getInitialBallState(currentLevel),
      timer: 0,
      moveCount: 0,
      isDragging: false,
      draggingBlockType: null,
      fireworksActive: false,
    });
  },

  placeBlock: (type: BlockType, gridX: number, gridY: number) => {
    const { availableBlocks, placedBlocks, moveCount, phase } = get();
    if (phase !== 'editing' || availableBlocks[type] <= 0) return;

    const existingBlock = placedBlocks.find(
      (b) => b.gridX === gridX && b.gridY === gridY
    );
    if (existingBlock) return;

    set((state) => ({
      placedBlocks: [
        ...state.placedBlocks,
        {
          id: uuidv4(),
          type,
          gridX,
          gridY,
        },
      ],
      availableBlocks: {
        ...state.availableBlocks,
        [type]: state.availableBlocks[type] - 1,
      },
      moveCount: moveCount + 1,
    }));
  },

  removeBlock: (blockId: string) => {
    const { placedBlocks, phase } = get();
    if (phase !== 'editing') return;

    const block = placedBlocks.find((b) => b.id === blockId);
    if (!block) return;

    set((state) => ({
      placedBlocks: state.placedBlocks.filter((b) => b.id !== blockId),
      availableBlocks: {
        ...state.availableBlocks,
        [block.type]: state.availableBlocks[block.type] + 1,
      },
    }));
  },

  updateBall: (x: number, y: number, vx: number, vy: number) => {
    set((state) => ({
      ball: {
        ...state.ball,
        x,
        y,
        vx,
        vy,
      },
    }));
  },

  addTrailPoint: (x: number, y: number) => {
    set((state) => ({
      ball: {
        ...state.ball,
        trail: [...state.ball.trail, { x, y }].slice(-5),
      },
    }));
  },

  incrementTimer: () => {
    set((state) => ({
      timer: state.timer + 1,
    }));
  },

  incrementMoveCount: () => {
    set((state) => ({
      moveCount: state.moveCount + 1,
    }));
  },

  setDragging: (isDragging: boolean, type: BlockType | null) => {
    set({
      isDragging,
      draggingBlockType: type,
    });
  },

  completeLevel: () => {
    const { currentLevel, completedLevels } = get();
    set({
      phase: 'won',
      fireworksActive: true,
      completedLevels: completedLevels.includes(currentLevel)
        ? completedLevels
        : [...completedLevels, currentLevel],
    });
  },

  nextLevel: () => {
    const { currentLevel } = get();
    const nextLevelIndex = (currentLevel + 1) % LEVELS.length;
    get().loadLevel(nextLevelIndex);
  },

  loadLevel: (levelIndex: number) => {
    if (levelIndex < 0 || levelIndex >= LEVELS.length) return;

    set({
      currentLevel: levelIndex,
      phase: 'editing',
      placedBlocks: [],
      availableBlocks: getInitialAvailableBlocks(levelIndex),
      ball: getInitialBallState(levelIndex),
      timer: 0,
      moveCount: 0,
      isDragging: false,
      draggingBlockType: null,
      fireworksActive: false,
    });
  },
}));

export default useGameStore;
