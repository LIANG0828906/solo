import { create } from 'zustand';
import {
  Ball,
  Paddle,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y_OFFSET,
  INITIAL_LIVES,
  COLOR_PALETTE,
} from './physics/types';
import { createBall } from './physics/engine';
import { v4 as uuidv4 } from 'uuid';

interface PerformanceData {
  fps: number;
  particleCount: number;
  avgCollisionTime: number;
}

interface GameState {
  balls: Ball[];
  paddle: Paddle;
  score: number;
  lives: number;
  gameOver: boolean;
  performance: PerformanceData;
  paddleVelocity: number;

  setBalls: (balls: Ball[]) => void;
  addBall: () => void;
  removeBall: (id: string) => void;
  setPaddle: (paddle: Paddle) => void;
  setPaddleVelocity: (v: number) => void;
  addScore: (delta: number) => void;
  loseLife: () => void;
  setGameOver: (v: boolean) => void;
  setPerformance: (p: PerformanceData) => void;
  reset: () => void;
}

function createInitialBalls(): Ball[] {
  const balls: Ball[] = [];
  for (let i = 0; i < 5; i++) {
    const radius = Math.floor(Math.random() * 8) + 8;
    const x = 100 + Math.random() * (CANVAS_WIDTH - 200);
    const y = 50 + Math.random() * 150;
    balls.push(createBall(x, y, radius));
  }
  return balls;
}

export const useGameStore = create<GameState>((set, get) => ({
  balls: createInitialBalls(),
  paddle: {
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - PADDLE_Y_OFFSET,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  },
  score: 0,
  lives: INITIAL_LIVES,
  gameOver: false,
  performance: { fps: 0, particleCount: 0, avgCollisionTime: 0 },
  paddleVelocity: 0,

  setBalls: (balls) => set({ balls }),
  addBall: () => {
    const state = get();
    if (state.balls.length >= 15) return;
    const paddle = state.paddle;
    const x = paddle.x + paddle.width / 2;
    const y = paddle.y - 30;
    const newBall = createBall(x, y);
    newBall.vx = (Math.random() - 0.5) * 100;
    newBall.vy = -150;
    set({ balls: [...state.balls, newBall] });
  },
  removeBall: (id) =>
    set((s) => ({ balls: s.balls.filter((b) => b.id !== id) })),
  setPaddle: (paddle) => set({ paddle }),
  setPaddleVelocity: (v) => set({ paddleVelocity: v }),
  addScore: (delta) => set((s) => ({ score: s.score + delta })),
  loseLife: () =>
    set((s) => {
      const newLives = s.lives - 1;
      if (newLives <= 0) {
        return { lives: 0, gameOver: true };
      }
      return { lives: newLives };
    }),
  setGameOver: (v) => set({ gameOver: v }),
  setPerformance: (p) => set({ performance: p }),
  reset: () =>
    set({
      balls: createInitialBalls(),
      score: 0,
      lives: INITIAL_LIVES,
      gameOver: false,
      paddle: {
        x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
        y: CANVAS_HEIGHT - PADDLE_Y_OFFSET,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
      },
      performance: { fps: 0, particleCount: 0, avgCollisionTime: 0 },
    }),
}));
