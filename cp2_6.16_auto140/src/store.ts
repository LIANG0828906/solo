import { create } from 'zustand';
import type { GameState, PowerUpType } from './types';
import { POWERUP_DURATIONS } from './types';

interface GameStore {
  gameState: GameState;
  score: number;
  highScore: number;
  lives: number;
  distance: number;
  speed: number;
  baseSpeed: number;

  heldPowerUps: PowerUpType[];
  speedBoostActive: boolean;
  shieldActive: boolean;
  doubleScoreActive: boolean;
  speedBoostTimer: number;
  shieldTimer: number;
  doubleScoreTimer: number;

  leaderboard: number[];
  screenShake: number;

  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
  goToMenu: () => void;
  addScore: (points: number) => void;
  decrementLife: () => void;
  collectPowerUp: (type: PowerUpType) => void;
  usePowerUp: () => void;
  updateActivePowerUps: (delta: number) => void;
  updateDistance: (delta: number) => void;
  updateHighScore: () => void;
  triggerScreenShake: (duration: number) => void;
  updateScreenShake: (delta: number) => void;
}

const loadHighScore = (): number => {
  try {
    return parseInt(localStorage.getItem('htr_highscore') || '0', 10) || 0;
  } catch {
    return 0;
  }
};

const loadLeaderboard = (): number[] => {
  try {
    const data = localStorage.getItem('htr_leaderboard');
    return data ? (JSON.parse(data) as number[]) : [];
  } catch {
    return [];
  }
};

const saveHighScore = (score: number): void => {
  try {
    localStorage.setItem('htr_highscore', String(score));
  } catch {
    /* ignore */
  }
};

const saveLeaderboard = (scores: number[]): void => {
  try {
    localStorage.setItem('htr_leaderboard', JSON.stringify(scores));
  } catch {
    /* ignore */
  }
};

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  score: 0,
  highScore: loadHighScore(),
  lives: 3,
  distance: 0,
  speed: 40,
  baseSpeed: 40,

  heldPowerUps: [],
  speedBoostActive: false,
  shieldActive: false,
  doubleScoreActive: false,
  speedBoostTimer: 0,
  shieldTimer: 0,
  doubleScoreTimer: 0,

  leaderboard: loadLeaderboard(),
  screenShake: 0,

  startGame: () => {
    set({
      gameState: 'playing',
      score: 0,
      lives: 3,
      distance: 0,
      speed: 40,
      baseSpeed: 40,
      heldPowerUps: [],
      speedBoostActive: false,
      shieldActive: false,
      doubleScoreActive: false,
      speedBoostTimer: 0,
      shieldTimer: 0,
      doubleScoreTimer: 0,
      screenShake: 0,
    });
  },

  endGame: () => {
    const { score, highScore, leaderboard } = get();
    const newHighScore = Math.max(score, highScore);
    const newLeaderboard = [...leaderboard, score].sort((a, b) => b - a).slice(0, 10);
    saveHighScore(newHighScore);
    saveLeaderboard(newLeaderboard);
    set({
      gameState: 'gameover',
      highScore: newHighScore,
      leaderboard: newLeaderboard,
    });
  },

  resetGame: () => {
    const { startGame } = get();
    startGame();
  },

  goToMenu: () => {
    set({ gameState: 'menu' });
  },

  addScore: (points: number) => {
    const { doubleScoreActive } = get();
    const multiplier = doubleScoreActive ? 2 : 1;
    set((state) => ({ score: state.score + points * multiplier }));
  },

  decrementLife: () => {
    set((state) => {
      const newLives = state.lives - 1;
      if (newLives <= 0) {
        setTimeout(() => get().endGame(), 100);
      }
      return { lives: newLives };
    });
  },

  collectPowerUp: (type: PowerUpType) => {
    set((state) => {
      const powerUps = [...state.heldPowerUps];
      if (powerUps.length >= 3) {
        powerUps.shift();
      }
      powerUps.push(type);
      return { heldPowerUps: powerUps };
    });
  },

  usePowerUp: () => {
    set((state) => {
      if (state.heldPowerUps.length === 0) return {};
      const [first, ...rest] = state.heldPowerUps;
      const duration = POWERUP_DURATIONS[first];
      const updates: Partial<GameStore> = { heldPowerUps: rest };
      if (first === 'speed') {
        updates.speedBoostActive = true;
        updates.speedBoostTimer = duration;
      } else if (first === 'shield') {
        updates.shieldActive = true;
        updates.shieldTimer = duration;
      } else if (first === 'double') {
        updates.doubleScoreActive = true;
        updates.doubleScoreTimer = duration;
      }
      return updates;
    });
  },

  updateActivePowerUps: (delta: number) => {
    set((state) => {
      const updates: Partial<GameStore> = {};
      if (state.speedBoostTimer > 0) {
        updates.speedBoostTimer = Math.max(0, state.speedBoostTimer - delta);
        if (updates.speedBoostTimer === 0) updates.speedBoostActive = false;
      }
      if (state.shieldTimer > 0) {
        updates.shieldTimer = Math.max(0, state.shieldTimer - delta);
        if (updates.shieldTimer === 0) updates.shieldActive = false;
      }
      if (state.doubleScoreTimer > 0) {
        updates.doubleScoreTimer = Math.max(0, state.doubleScoreTimer - delta);
        if (updates.doubleScoreTimer === 0) updates.doubleScoreActive = false;
      }
      return updates;
    });
  },

  updateDistance: (delta: number) => {
    set((state) => {
      const speedMultiplier = state.speedBoostActive ? 1.5 : 1;
      const currentSpeed = state.speed * speedMultiplier;
      const newDistance = state.distance + currentSpeed * delta;
      const levelUps = Math.floor(newDistance / 1000) - Math.floor(state.distance / 1000);
      let newBaseSpeed = state.baseSpeed;
      if (levelUps > 0) {
        newBaseSpeed = state.baseSpeed * Math.pow(1.1, levelUps);
      }
      return {
        distance: newDistance,
        speed: newBaseSpeed,
        baseSpeed: newBaseSpeed,
      };
    });
  },

  updateHighScore: () => {
    const { score, highScore } = get();
    if (score > highScore) {
      saveHighScore(score);
      set({ highScore: score });
    }
  },

  triggerScreenShake: (duration: number) => {
    set({ screenShake: duration });
  },

  updateScreenShake: (delta: number) => {
    set((state) => ({
      screenShake: Math.max(0, state.screenShake - delta),
    }));
  },
}));
