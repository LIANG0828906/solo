import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Ball,
  Player,
  Particle,
  Ripple,
  AimData,
  GamePhase,
  TableConfig,
  Pocket,
} from '../game/types';
import {
  updateBalls,
  checkBallCollisions,
  checkWallCollisions,
  checkPocketCollisions,
  allBallsStopped,
  getPockets,
} from '../game/physics';

const BALL_RADIUS = 10;
const BALL_COLORS: Record<number, string> = {
  0: '#FFFFFF',
  1: '#FFFF00',
  2: '#0000FF',
  3: '#FF0000',
  4: '#4B0082',
  5: '#FF4500',
  6: '#006400',
  7: '#8B0000',
  8: '#000000',
  9: '#FFD700',
  10: '#0000CD',
  11: '#DC143C',
  12: '#6A0DAD',
  13: '#FF6347',
  14: '#228B22',
  15: '#A52A2A',
};

const MAX_SPEED = 800;
const MAX_DRAG_DISTANCE = 200;

interface GameStore {
  balls: Ball[];
  players: Player[];
  currentPlayer: number;
  gamePhase: GamePhase;
  aimData: AimData;
  particles: Particle[];
  ripples: Ripple[];
  breakAnimationTime: number;
  cueStickProgress: number;
  winner: number | null;
  tableConfig: TableConfig | null;
  pockets: Pocket[];
  canvasSize: { width: number; height: number };

  setCanvasSize: (width: number, height: number) => void;
  initGame: () => void;
  startAiming: (x: number, y: number) => void;
  updateAiming: (x: number, y: number) => void;
  shoot: () => void;
  updateGame: (dt: number) => void;
  resetGame: () => void;
}

function createBall(
  number: number,
  x: number,
  y: number,
  radius: number = BALL_RADIUS
): Ball {
  return {
    id: uuidv4(),
    x,
    y,
    vx: 0,
    vy: 0,
    radius,
    number,
    color: BALL_COLORS[number],
    pocketed: false,
    trail: [],
  };
}

function createTriangleBalls(
  centerX: number,
  centerY: number,
  radius: number = BALL_RADIUS
): Ball[] {
  const balls: Ball[] = [];
  const ballDiameter = radius * 2;
  const rowOffsets = [0, -1, -2, -3, -4];
  const ballsPerRow = [1, 2, 3, 4, 5];

  const order = [1, 9, 2, 10, 8, 11, 3, 12, 13, 14, 4, 15, 5, 6, 7];
  let idx = 0;

  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < ballsPerRow[row]; col++) {
      const x = centerX + row * ballDiameter * 0.866;
      const y = centerY + rowOffsets[row] * ballDiameter + col * ballDiameter;
      balls.push(createBall(order[idx], x, y));
      idx++;
    }
  }

  return balls;
}

function createCollisionParticles(x: number, y: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < 15; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 100;
    particles.push({
      id: uuidv4(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 2,
      opacity: 1,
      life: 0.3,
      maxLife: 0.3,
      color: '#FFD700',
    });
  }
  return particles;
}

function createRipple(x: number, y: number): Ripple {
  return {
    id: uuidv4(),
    x,
    y,
    radius: 10,
    maxRadius: 40,
    opacity: 0.7,
    life: 0.4,
    maxLife: 0.4,
  };
}

function getScoreForBall(number: number): number {
  if (number === 8) return 50;
  if (number >= 1 && number <= 7) return 10;
  if (number >= 9 && number <= 15) return 15;
  return 0;
}

function getBallGroup(number: number): 'low' | 'high' | 'eight' | 'cue' {
  if (number === 0) return 'cue';
  if (number === 8) return 'eight';
  if (number >= 1 && number <= 7) return 'low';
  return 'high';
}

export const useGameStore = create<GameStore>((set, get) => ({
  balls: [],
  players: [
    { id: 0, name: '玩家 1', score: 0, group: null },
    { id: 1, name: '玩家 2', score: 0, group: null },
  ],
  currentPlayer: 0,
  gamePhase: 'break',
  aimData: {
    isAiming: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    power: 0,
  },
  particles: [],
  ripples: [],
  breakAnimationTime: 0,
  cueStickProgress: 0,
  winner: null,
  tableConfig: null,
  pockets: [],
  canvasSize: { width: 1200, height: 700 },

  setCanvasSize: (width: number, height: number) => {
    set({ canvasSize: { width, height } });
    get().initGame();
  },

  initGame: () => {
    const { canvasSize } = get();
    const tableWidth = 900;
    const tableHeight = 450;
    const borderWidth = 30;

    const scale = Math.min(
      (canvasSize.width - 40) / (tableWidth + borderWidth * 2),
      (canvasSize.height - 100) / (tableHeight + borderWidth * 2)
    );

    const scaledWidth = (tableWidth + borderWidth * 2) * scale;
    const scaledHeight = (tableHeight + borderWidth * 2) * scale;

    const offsetX = (canvasSize.width - scaledWidth) / 2 + borderWidth * scale;
    const offsetY = (canvasSize.height - scaledHeight) / 2 + borderWidth * scale;

    const innerW = tableWidth * scale;
    const innerH = tableHeight * scale;
    const ballR = BALL_RADIUS * scale;

    const tableConfig: TableConfig = {
      width: tableWidth,
      height: tableHeight,
      borderWidth: borderWidth * scale,
      innerWidth: innerW,
      innerHeight: innerH,
      offsetX,
      offsetY,
    };

    const cueBallX = offsetX + innerW * 0.25;
    const cueBallY = offsetY + innerH / 2;

    const rackCenterX = offsetX + innerW * 0.7;
    const rackCenterY = offsetY + innerH / 2;

    const cueBall = createBall(0, cueBallX, cueBallY, ballR);
    const rackBalls = createTriangleBalls(rackCenterX, rackCenterY, ballR);

    const pockets = getPockets(tableConfig);

    set({
      balls: [cueBall, ...rackBalls],
      tableConfig,
      pockets,
      gamePhase: 'break',
      breakAnimationTime: 0,
      particles: [],
      ripples: [],
      winner: null,
      players: [
        { id: 0, name: '玩家 1', score: 0, group: null },
        { id: 1, name: '玩家 2', score: 0, group: null },
      ],
      currentPlayer: 0,
    });
  },

  startAiming: (x: number, y: number) => {
    const { gamePhase, balls } = get();
    if (gamePhase !== 'aiming') return;

    const cueBall = balls.find((b) => b.number === 0);
    if (!cueBall) return;

    set({
      aimData: {
        isAiming: true,
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
        power: 0,
      },
    });
  },

  updateAiming: (x: number, y: number) => {
    const { aimData, balls } = get();
    if (!aimData.isAiming) return;

    const cueBall = balls.find((b) => b.number === 0);
    if (!cueBall) return;

    const dx = x - aimData.startX;
    const dy = y - aimData.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const power = Math.min(distance / MAX_DRAG_DISTANCE, 1);

    set({
      aimData: {
        ...aimData,
        currentX: x,
        currentY: y,
        power,
      },
    });
  },

  shoot: () => {
    const { aimData, balls, tableConfig } = get();
    if (!aimData.isAiming || !tableConfig) return;

    const cueBall = balls.find((b) => b.number === 0);
    if (!cueBall) return;

    const dx = aimData.currentX - aimData.startX;
    const dy = aimData.currentY - aimData.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 5) {
      set({ aimData: { ...aimData, isAiming: false, power: 0 } });
      return;
    }

    const angle = Math.atan2(dy, dx);
    const speed = aimData.power * MAX_SPEED;

    const newBalls = balls.map((b) => {
      if (b.number === 0) {
        return {
          ...b,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          trail: [{ x: b.x, y: b.y }],
        };
      }
      return b;
    });

    set({
      balls: newBalls,
      gamePhase: 'shooting',
      aimData: { ...aimData, isAiming: false, power: 0 },
      cueStickProgress: 1,
    });
  },

  updateGame: (dt: number) => {
    const state = get();
    const { gamePhase, tableConfig, pockets } = state;

    if (!tableConfig) return;

    if (gamePhase === 'break') {
      const newTime = state.breakAnimationTime + dt;

      if (newTime >= 0.3) {
        const { balls } = state;
        const spreadBalls = balls.map((b) => {
          if (b.number === 0) return b;
          const angle = Math.random() * Math.PI * 2;
          const speed = 50 + Math.random() * 100;
          return {
            ...b,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
          };
        });

        set({
          balls: spreadBalls,
          gamePhase: 'moving',
          breakAnimationTime: 0,
        });
      } else {
        set({ breakAnimationTime: newTime });
      }
      return;
    }

    if (gamePhase === 'shooting') {
      const newProgress = state.cueStickProgress - dt * 10;
      if (newProgress <= 0) {
        set({ cueStickProgress: 0, gamePhase: 'moving' });
      } else {
        set({ cueStickProgress: newProgress });
      }
      return;
    }

    if (gamePhase === 'moving') {
      let balls = updateBalls(state.balls, dt);
      balls = checkWallCollisions(balls, tableConfig);

      const collisionResult = checkBallCollisions(balls);
      balls = collisionResult.balls;

      const pocketResult = checkPocketCollisions(balls, pockets);
      balls = pocketResult.balls;

      let newParticles = [...state.particles];
      let newRipples = [...state.ripples];

      for (const event of collisionResult.collisionEvents) {
        newParticles.push(...createCollisionParticles(event.x, event.y));
      }

      for (const event of pocketResult.pocketEvents) {
        newRipples.push(createRipple(event.x, event.y));
      }

      newParticles = newParticles
        .map((p) => ({
          ...p,
          x: p.x + p.vx * dt,
          y: p.y + p.vy * dt,
          life: p.life - dt,
          opacity: Math.max(0, p.life / p.maxLife),
        }))
        .filter((p) => p.life > 0);

      newRipples = newRipples
        .map((r) => {
          const progress = 1 - r.life / r.maxLife;
          return {
            ...r,
            radius: 10 + progress * 30,
            life: r.life - dt,
            opacity: Math.max(0, 0.7 * (1 - progress)),
          };
        })
        .filter((r) => r.life > 0);

      const stopped = allBallsStopped(balls);

      if (stopped) {
        const { players, currentPlayer } = state;
        let newPlayers = [...players];
        let scored = false;

        for (const ball of balls) {
          if (ball.pocketed && ball.number !== 0) {
            const score = getScoreForBall(ball.number);
            newPlayers[currentPlayer] = {
              ...newPlayers[currentPlayer],
              score: newPlayers[currentPlayer].score + score,
            };
            scored = true;

            const group = getBallGroup(ball.number);
            if (group === 'low' || group === 'high') {
              if (newPlayers[currentPlayer].group === null) {
                const otherGroup = group === 'low' ? 'high' : 'low';
                newPlayers[currentPlayer] = {
                  ...newPlayers[currentPlayer],
                  group: group as 'low' | 'high',
                };
                const otherIdx = 1 - currentPlayer;
                newPlayers[otherIdx] = {
                  ...newPlayers[otherIdx],
                  group: otherGroup as 'low' | 'high',
                };
              }
            }
          }
        }

        const eightBallPocketed = balls.find(
          (b) => b.number === 8 && b.pocketed
        );
        const cueBallPocketed = balls.find(
          (b) => b.number === 0 && b.pocketed
        );

        const nonEightBalls = balls.filter(
          (b) => b.number !== 0 && b.number !== 8 && !b.pocketed
        );

        let gameOver = false;
        let winner: number | null = null;

        if (eightBallPocketed) {
          if (nonEightBalls.length === 0) {
            gameOver = true;
            winner = currentPlayer;
          } else {
            gameOver = true;
            winner = 1 - currentPlayer;
          }
        }

        let nextPlayer = currentPlayer;
        if (!scored && !cueBallPocketed) {
          nextPlayer = 1 - currentPlayer;
        }

        if (cueBallPocketed) {
          const newBalls = balls.map((b) => {
            if (b.number === 0) {
              return {
                ...b,
                x: tableConfig.offsetX + tableConfig.innerWidth * 0.25,
                y: tableConfig.offsetY + tableConfig.innerHeight / 2,
                pocketed: false,
                vx: 0,
                vy: 0,
                trail: [],
              };
            }
            return b;
          });

          set({
            balls: newBalls,
            particles: newParticles,
            ripples: newRipples,
            players: newPlayers,
            currentPlayer: nextPlayer,
            gamePhase: gameOver ? 'gameOver' : 'aiming',
            winner,
          });
          return;
        }

        set({
          balls,
          particles: newParticles,
          ripples: newRipples,
          players: newPlayers,
          currentPlayer: nextPlayer,
          gamePhase: gameOver ? 'gameOver' : 'aiming',
          winner,
        });
      } else {
        set({
          balls,
          particles: newParticles,
          ripples: newRipples,
        });
      }
    }
  },

  resetGame: () => {
    get().initGame();
  },
}));
