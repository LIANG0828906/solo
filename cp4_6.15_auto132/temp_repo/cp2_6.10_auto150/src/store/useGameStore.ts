import { create } from 'zustand';
import { Pin, Ball, GameStatus, TOTAL_ROUNDS } from '../game/constants';
import { generatePinPositions, createInitialBall } from '../game/engine';

interface GameState {
  round: number;
  score: number;
  pins: Pin[];
  ball: Ball;
  aimAngle: number;
  power: number;
  isAiming: boolean;
  isCharging: boolean;
  gameStatus: GameStatus;
  lastScore: number;
  showScorePopup: boolean;
  scorePopupValue: number;
  chargeDirection: 'increase' | 'decrease';

  setAimAngle: (angle: number) => void;
  setIsAiming: (aiming: boolean) => void;
  startCharging: () => void;
  stopCharging: () => void;
  updatePower: () => void;
  shootBall: () => void;
  updateBall: (ball: Ball) => void;
  updatePins: (pins: Pin[]) => void;
  addScore: (delta: number) => void;
  endRound: () => void;
  nextRound: () => void;
  resetGame: () => void;
  setShowScorePopup: (show: boolean, value?: number) => void;
  setGameStatus: (status: GameStatus) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  round: 1,
  score: 0,
  pins: generatePinPositions(),
  ball: createInitialBall(),
  aimAngle: -90,
  power: 0,
  isAiming: false,
  isCharging: false,
  gameStatus: 'ready',
  lastScore: 0,
  showScorePopup: false,
  scorePopupValue: 0,
  chargeDirection: 'increase',

  setAimAngle: (angle) => set({ aimAngle: angle }),
  setIsAiming: (aiming) => set({ isAiming: aiming }),

  startCharging: () => set({ isCharging: true, power: 0, chargeDirection: 'increase' }),

  stopCharging: () => {
    const { power } = get();
    if (power > 0) {
      get().shootBall();
    }
    set({ isCharging: false });
  },

  updatePower: () => {
    const { isCharging, power, chargeDirection } = get();
    if (!isCharging) return;

    let newPower = power;
    let newDirection = chargeDirection;

    if (chargeDirection === 'increase') {
      newPower += 1.5;
      if (newPower >= 100) {
        newPower = 100;
        newDirection = 'decrease';
      }
    } else {
      newPower -= 1.5;
      if (newPower <= 0) {
        newPower = 0;
        newDirection = 'increase';
      }
    }

    set({ power: newPower, chargeDirection: newDirection });
  },

  shootBall: () => {
    const { aimAngle, power, ball } = get();
    const angleRad = (aimAngle * Math.PI) / 180;
    const speed = power * 0.28;

    set({
      ball: {
        ...ball,
        vx: Math.cos(angleRad) * speed,
        vy: Math.sin(angleRad) * speed,
        isMoving: true,
      },
      gameStatus: 'playing',
      power: 0,
    });
  },

  updateBall: (ball) => set({ ball }),
  updatePins: (pins) => set({ pins }),

  addScore: (delta) => {
    if (delta !== 0) {
      set((state) => ({
        score: state.score + delta,
        showScorePopup: true,
        scorePopupValue: delta,
      }));
      setTimeout(() => {
        set({ showScorePopup: false });
      }, 1000);
    }
  },

  endRound: () => {
    const { pins } = get();
    let roundScore = 0;
    pins.forEach((pin) => {
      if (pin.isDown) {
        roundScore += pin.type === 'red' ? 10 : -10;
      }
    });

    set({
      lastScore: roundScore,
      gameStatus: 'roundEnd',
    });
  },

  nextRound: () => {
    const { round } = get();
    const newRound = round + 1;

    if (newRound > TOTAL_ROUNDS) {
      set({ gameStatus: 'gameOver' });
    } else {
      set({
        round: newRound,
        pins: generatePinPositions(),
        ball: createInitialBall(),
        gameStatus: 'ready',
        aimAngle: -90,
        power: 0,
        isAiming: false,
        isCharging: false,
      });
    }
  },

  resetGame: () => {
    set({
      round: 1,
      score: 0,
      pins: generatePinPositions(),
      ball: createInitialBall(),
      aimAngle: -90,
      power: 0,
      isAiming: false,
      isCharging: false,
      gameStatus: 'ready',
      lastScore: 0,
      showScorePopup: false,
      scorePopupValue: 0,
    });
  },

  setShowScorePopup: (show, value) => {
    set({ showScorePopup: show, scorePopupValue: value ?? 0 });
  },

  setGameStatus: (status) => set({ gameStatus: status }),
}));
