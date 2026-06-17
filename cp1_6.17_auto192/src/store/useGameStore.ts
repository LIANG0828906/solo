import { create } from 'zustand';
import { eventBus } from '../game/EventBus';
import { GAME_DURATION, TARGET_RADIUS } from '../game/types';

interface GameState {
  score: number;
  fusionCount: number;
  progress: number;
  maxRadius: number;
  targetRadius: number;
  timeLeft: number;
  isGameOver: boolean;
  isWin: boolean;
  showHint: boolean;
  mouseX: number;
  mouseY: number;
  isMouseDown: boolean;
  isHighlighting: boolean;
  setMousePos: (x: number, y: number) => void;
  setMouseDown: (down: boolean) => void;
  setHighlighting: (v: boolean) => void;
  hideHint: () => void;
  decrementTime: () => void;
  resetGame: () => void;
  triggerWin: () => void;
  triggerLose: () => void;
}

export const useGameStore = create<GameState>((set, get) => {
  eventBus.on('scoreUpdated', ({ score, fusionCount, progress }) => {
    set({ score, fusionCount, progress });
  });

  eventBus.on('gameWon', () => {
    get().triggerWin();
  });

  return {
    score: 0,
    fusionCount: 0,
    progress: 0,
    maxRadius: 0,
    targetRadius: TARGET_RADIUS,
    timeLeft: GAME_DURATION,
    isGameOver: false,
    isWin: false,
    showHint: true,
    mouseX: 0,
    mouseY: 0,
    isMouseDown: false,
    isHighlighting: false,

    setMousePos: (x, y) => set({ mouseX: x, mouseY: y }),
    setMouseDown: (down) => set({ isMouseDown: down }),
    setHighlighting: (v) => set({ isHighlighting: v }),
    hideHint: () => set({ showHint: false }),

    decrementTime: () => {
      const { timeLeft, isGameOver, isWin } = get();
      if (isGameOver || isWin) return;
      const newTime = timeLeft - 1;
      if (newTime <= 0) {
        set({ timeLeft: 0 });
        get().triggerLose();
      } else {
        set({ timeLeft: newTime });
      }
    },

    resetGame: () => {
      set({
        score: 0,
        fusionCount: 0,
        progress: 0,
        maxRadius: 0,
        timeLeft: GAME_DURATION,
        isGameOver: false,
        isWin: false,
        showHint: true,
      });
    },

    triggerWin: () => {
      set({ isWin: true, isGameOver: true });
    },

    triggerLose: () => {
      set({ isGameOver: true, isWin: false });
      eventBus.emit('gameLost', undefined as unknown as void);
    },
  };
});
