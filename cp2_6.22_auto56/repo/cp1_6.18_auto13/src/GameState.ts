import { create } from 'zustand';
import {
  GameState,
  GameConfig,
  DEFAULT_CONFIG,
  createShip,
  createEnergyBalls,
  createAsteroids,
  createStars,
  resetLevel,
} from './GameLogic';

interface GameStore extends GameState {
  config: GameConfig;
  setConfig: (config: Partial<GameConfig>) => void;
  setShipPosition: (x: number, y: number) => void;
  activateGravity: () => void;
  deactivateGravity: () => void;
  fireRepulsionWave: () => void;
  collectEnergy: (amount: number) => void;
  incrementLevel: () => void;
  setPaused: (paused: boolean) => void;
  resetGame: () => void;
  setMobile: (isMobile: boolean) => void;
  updateState: (updates: Partial<GameState>) => void;
}

const initialState = (config: GameConfig): GameState => {
  const reset = resetLevel(config);
  return {
    ...reset,
    stars: createStars(config.width, config.height),
    repulsionWave: {
      x: 0,
      y: 0,
      radius: 0,
      maxRadius: 200,
      alpha: 0,
      active: false,
    },
    portal: {
      x: config.width / 2,
      y: config.height / 2,
      radius: 0,
      rotation: 0,
      expanding: false,
      alpha: 0,
      active: false,
    },
    level: 1,
    isGravityActive: false,
    gravityHoldTime: 0,
    isPaused: false,
    gameOver: false,
    levelComplete: false,
    shakeTime: 0,
    lastTrapSpawn: 0,
    targetEnergy: config.targetEnergyBase,
    isMobile: false,
  };
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(DEFAULT_CONFIG),
  config: DEFAULT_CONFIG,

  setConfig: (config) =>
    set((state) => ({
      config: { ...state.config, ...config },
    })),

  setShipPosition: (x, y) =>
    set((state) => ({
      ship: { ...state.ship, x, y },
    })),

  activateGravity: () =>
    set({ isGravityActive: true }),

  deactivateGravity: () =>
    set({ isGravityActive: false, gravityHoldTime: 0 }),

  fireRepulsionWave: () => {
    const { ship } = get();
    set({
      repulsionWave: {
        x: ship.x,
        y: ship.y,
        radius: 20,
        maxRadius: 200,
        alpha: 1,
        active: true,
      },
    });
  },

  collectEnergy: (amount) =>
    set((state) => {
      const newScore = state.score + amount;
      const newCollected = state.collectedSinceUpgrade + amount;
      let newRadius = state.gravityRadius;
      let remainingCollected = newCollected;

      while (remainingCollected >= 5 && newRadius < state.config.maxGravityRadius) {
        newRadius += state.config.gravityRadiusIncrease;
        remainingCollected -= 5;
      }

      const levelComplete = newScore >= state.targetEnergy;

      return {
        score: newScore,
        gravityRadius: Math.min(state.config.maxGravityRadius, newRadius),
        collectedSinceUpgrade: remainingCollected,
        levelComplete,
        portal: levelComplete
          ? {
              ...state.portal,
              active: true,
              expanding: true,
              radius: 10,
              alpha: 0,
            }
          : state.portal,
      };
    }),

  incrementLevel: () =>
    set((state) => {
      const newLevel = state.level + 1;
      const newTarget = state.config.targetEnergyBase + (newLevel - 1) * 5;
      const reset = resetLevel(state.config);
      return {
        ...reset,
        level: newLevel,
        targetEnergy: newTarget,
        stars: state.stars,
        repulsionWave: state.repulsionWave,
        portal: {
          ...state.portal,
          active: false,
          expanding: false,
          radius: 0,
          alpha: 0,
        },
        levelComplete: false,
        isPaused: false,
      };
    }),

  setPaused: (paused) => set({ isPaused: paused }),

  resetGame: () =>
    set((state) => ({
      ...initialState(state.config),
      stars: createStars(state.config.width, state.config.height),
    })),

  setMobile: (isMobile) => set({ isMobile }),

  updateState: (updates) => set((state) => ({ ...state, ...updates })),
}));
