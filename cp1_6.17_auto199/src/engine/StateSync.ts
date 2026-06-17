import { create } from 'zustand';
import { emitEvent, onEvent } from './EventBus';
import { mazeGenerator } from './MazeGenerator';

export interface GameState {
  score: number;
  displayScore: number;
  level: number;
  maxLevel: number;
  mazeSize: number;
  gameOver: boolean;
  levelComplete: boolean;
  isPlaying: boolean;
  energy: number;
  maxEnergy: number;
  playerX: number;
  playerZ: number;
  playerRadius: number;
  isPowered: boolean;
  isSlowed: boolean;
  shake: { duration: number; amplitude: number; startTime: number } | null;
  flashRed: { duration: number; startTime: number } | null;
}

interface GameActions {
  startGame: () => void;
  restartGame: () => void;
  nextLevel: () => void;
  setDisplayScore: (score: number) => void;
  setShake: (data: { duration: number; amplitude: number } | null) => void;
  setFlashRed: (data: { duration: number } | null) => void;
  setPlayerPos: (x: number, z: number) => void;
  setPlayerState: (radius: number, isPowered: boolean, isSlowed: boolean) => void;
  setEnergy: (energy: number, maxEnergy: number) => void;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  score: 100,
  displayScore: 100,
  level: 1,
  maxLevel: 5,
  mazeSize: 10,
  gameOver: false,
  levelComplete: false,
  isPlaying: false,
  energy: 0,
  maxEnergy: 5,
  playerX: -4.5,
  playerZ: -4.5,
  playerRadius: 0.3,
  isPowered: false,
  isSlowed: false,
  shake: null,
  flashRed: null,

  startGame: () => {
    const state = get();
    set({
      score: 100,
      displayScore: 100,
      level: 1,
      mazeSize: 10,
      gameOver: false,
      levelComplete: false,
      isPlaying: true,
      energy: 0,
      playerX: -4.5,
      playerZ: -4.5,
    });
    emitEvent('levelStart', { level: 1, mazeSize: 10 });
  },

  restartGame: () => {
    get().startGame();
  },

  nextLevel: () => {
    const state = get();
    if (state.level >= state.maxLevel) {
      set({ isPlaying: false, levelComplete: true });
      return;
    }
    const newLevel = state.level + 1;
    const newSize = 10 + (newLevel - 1) * 2;
    const newMazeSize = Math.min(newSize, 18);
    set({
      level: newLevel,
      mazeSize: newMazeSize,
      levelComplete: false,
      energy: 0,
    });
    emitEvent('levelStart', { level: newLevel, mazeSize: newMazeSize });
  },

  setDisplayScore: (score) => set({ displayScore: score }),

  setShake: (data) =>
    set({
      shake: data ? { ...data, startTime: performance.now() } : null,
    }),

  setFlashRed: (data) =>
    set({
      flashRed: data ? { ...data, startTime: performance.now() } : null,
    }),

  setPlayerPos: (x, z) => set({ playerX: x, playerZ: z }),

  setPlayerState: (radius, isPowered, isSlowed) =>
    set({ playerRadius: radius, isPowered, isSlowed }),

  setEnergy: (energy, maxEnergy) => set({ energy, maxEnergy }),
}));

export class StateSync {
  private scoreTween: { from: number; to: number; startTime: number; duration: number } | null = null;
  private animationFrameId: number = 0;

  constructor() {
    this.setupListeners();
    this.animateScore();
  }

  private setupListeners(): void {
    onEvent('energyCollect', (data) => {
      const state = useGameStore.getState();
      if (state.gameOver) return;
      
      let points = 10;
      if (data.sameColor) {
        points += 5;
      }
      const newScore = state.score + points;
      this.updateScore(newScore);
    });

    onEvent('interferenceHit', () => {
      const state = useGameStore.getState();
      if (state.gameOver) return;
      
      const newScore = state.score - 20;
      this.updateScore(newScore);

      if (newScore < 0) {
        useGameStore.getState().setShake(null);
        useGameStore.getState().setFlashRed(null);
        useGameStore.setState({ gameOver: true, isPlaying: false });
        emitEvent('gameOver', { score: 0 });
      }
    });

    onEvent('levelComplete', () => {
      const state = useGameStore.getState();
      if (state.levelComplete || state.gameOver) return;
      
      const newScore = state.score + 50;
      this.updateScore(newScore);
      useGameStore.setState({ levelComplete: true });
    });

    onEvent('playerMove', (data) => {
      useGameStore.getState().setPlayerPos(data.x, data.z);
    });

    onEvent('playerState', (data) => {
      useGameStore.getState().setPlayerState(
        data.radius,
        data.isPowered,
        data.isSlowed
      );
    });

    onEvent('shake', (data) => {
      useGameStore.getState().setShake(data);
      setTimeout(() => {
        useGameStore.getState().setShake(null);
      }, data.duration);
    });

    onEvent('flashRed', (data) => {
      useGameStore.getState().setFlashRed(data);
      setTimeout(() => {
        useGameStore.getState().setFlashRed(null);
      }, data.duration * 1000);
    });

    onEvent('energyUpdate', (data) => {
      useGameStore.getState().setEnergy(data.energy, data.maxEnergy);
    });
  }

  private updateScore(newScore: number): void {
    const state = useGameStore.getState();
    this.scoreTween = {
      from: state.displayScore,
      to: newScore,
      startTime: performance.now(),
      duration: 500,
    };
    useGameStore.setState({ score: newScore });
  }

  private animateScore = (): void => {
    if (this.scoreTween) {
      const elapsed = performance.now() - this.scoreTween.startTime;
      const progress = Math.min(elapsed / this.scoreTween.duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current =
        this.scoreTween.from +
        (this.scoreTween.to - this.scoreTween.from) * eased;
      useGameStore.getState().setDisplayScore(Math.round(current));
      if (progress >= 1) {
        this.scoreTween = null;
      }
    }
    this.animationFrameId = requestAnimationFrame(this.animateScore);
  };

  destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }
}

export const stateSync = new StateSync();
