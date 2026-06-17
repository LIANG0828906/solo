import { create } from 'zustand';
import {
  Ball,
  Paddle,
  FlashEffect,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_Y_OFFSET,
  INITIAL_LIVES,
} from './physics/types';
import { createBall } from './physics/engine';

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
  flashEffects: FlashEffect[];

  setBalls: (balls: Ball[]) => void;
  addBall: () => void;
  removeBall: (id: string) => void;
  setPaddle: (paddle: Paddle) => void;
  setPaddleVelocity: (v: number) => void;
  addScore: (delta: number) => void;
  loseLife: () => void;
  setGameOver: (v: boolean) => void;
  setPerformance: (p: PerformanceData) => void;
  addFlashEffects: (effects: FlashEffect[]) => void;
  cleanupFlashEffects: (now: number) => void;
  reset: () => void;
}

function createInitialBalls(): Ball[] {
  const balls: Ball[] = [];
  for (let i = 0; i < 5; i++) {
    const radius = Math.floor(Math.random() * 8) + 8;
    const x = 100 + Math.random() * (CANVAS_WIDTH - 200);
    const y = 200 + Math.random() * 200;
    const ball = createBall(x, y, radius);
    ball.spawning = false;
    ball.vy = Math.abs(ball.vy) * (Math.random() > 0.5 ? -1 : 1);
    balls.push(ball);
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
  flashEffects: [],

  setBalls: (balls) => set({ balls }),
  addBall: () => {
    const state = get();
    if (state.balls.length >= 15) return;
    const paddle = state.paddle;
    const x = paddle.x + paddle.width / 2;
    const y = paddle.y - 50;
    const newBall = createBall(x, y);
    newBall.vx = 0;
    newBall.vy = 0;
    newBall.spawnTime = performance.now();
    newBall.spawning = true;
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
  addFlashEffects: (effects) =>
    set((s) => ({ flashEffects: [...s.flashEffects, ...effects] })),
  cleanupFlashEffects: (now) =>
    set((s) => ({
      flashEffects: s.flashEffects.filter((f) => f.until > now),
    })),
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
      flashEffects: [],
    }),
}));
