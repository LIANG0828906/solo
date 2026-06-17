import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Ball, Player, Particle, Ripple, TrailPoint, GamePhase, MAX_POWER } from '../game/types';
import { createInitialBalls, updatePhysics } from '../game/physics';

interface GameState {
  balls: Ball[];
  players: Player[];
  currentPlayer: number;
  gamePhase: GamePhase;
  winner: number | null;
  particles: Particle[];
  ripples: Ripple[];
  trail: TrailPoint[];
  isAiming: boolean;
  aimAngle: number;
  power: number;
  cueBackOffset: number;
  breakAnimation: boolean;
  breakAnimationProgress: number;
  initGame: () => void;
  startAiming: () => void;
  updateAim: (angle: number, power: number) => void;
  shoot: () => void;
  updateGame: (dt: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  balls: [],
  players: [
    { id: 0, name: '玩家1', score: 0 },
    { id: 1, name: '玩家2', score: 0 },
  ],
  currentPlayer: 0,
  gamePhase: 'idle',
  winner: null,
  particles: [],
  ripples: [],
  trail: [],
  isAiming: false,
  aimAngle: 0,
  power: 0,
  cueBackOffset: 0,
  breakAnimation: true,
  breakAnimationProgress: 0,

  initGame: () => {
    const balls = createInitialBalls();
    set({
      balls,
      players: [
        { id: 0, name: '玩家1', score: 0 },
        { id: 1, name: '玩家2', score: 0 },
      ],
      currentPlayer: 0,
      gamePhase: 'idle',
      winner: null,
      particles: [],
      ripples: [],
      trail: [],
      isAiming: false,
      aimAngle: 0,
      power: 0,
      cueBackOffset: 0,
      breakAnimation: true,
      breakAnimationProgress: 0,
    });
  },

  startAiming: () => {
    const { gamePhase } = get();
    if (gamePhase !== 'idle' && gamePhase !== 'aiming') return;
    set({ isAiming: true, gamePhase: 'aiming' });
  },

  updateAim: (angle: number, power: number) => {
    const { isAiming } = get();
    if (!isAiming) return;
    const clampedPower = Math.min(Math.max(power, 0), MAX_POWER);
    const cueBackOffset = (clampedPower / MAX_POWER) * 50;
    set({ aimAngle: angle, power: clampedPower, cueBackOffset });
  },

  shoot: () => {
    const state = get();
    if (!state.isAiming || state.gamePhase !== 'aiming') return;

    const cueBall = state.balls.find((b) => b.number === 0 && !b.pocketed);
    if (!cueBall) return;

    const { power, aimAngle } = state;
    const vx = Math.cos(aimAngle) * power;
    const vy = Math.sin(aimAngle) * power;

    const newBalls = state.balls.map((b) =>
      b.id === cueBall.id ? { ...b, vx, vy } : b
    );

    set({
      balls: newBalls,
      isAiming: false,
      gamePhase: 'moving',
      power: 0,
      cueBackOffset: 0,
      trail: [],
    });
  },

  updateGame: (dt: number) => {
    const state = get();

    if (state.breakAnimation) {
      const newProgress = state.breakAnimationProgress + dt / 0.3;
      if (newProgress >= 1) {
        set({ breakAnimation: false, breakAnimationProgress: 1, gamePhase: 'aiming' });
      } else {
        const rackCenterX = 690;
        const rackCenterY = 225;
        const balls = state.balls.map((b) => {
          if (b.number === 0) return b;
          const dx = b.x - rackCenterX;
          const dy = b.y - rackCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist === 0) return b;
          const spreadAmount = newProgress * 15;
          return {
            ...b,
            x: b.x + (dx / dist) * spreadAmount,
            y: b.y + (dy / dist) * spreadAmount,
          };
        });
        set({ breakAnimationProgress: newProgress, balls });
      }
      return;
    }

    if (state.gamePhase !== 'moving') return;

    const result = updatePhysics(state.balls, state.particles, dt);

    let newTrail = [...state.trail];
    const cueBall = result.balls.find((b) => b.number === 0 && !b.pocketed);
    if (cueBall && (cueBall.vx !== 0 || cueBall.vy !== 0)) {
      newTrail.push({ x: cueBall.x, y: cueBall.y, opacity: 1 });
      if (newTrail.length > 20) {
        newTrail = newTrail.slice(-20);
      }
      newTrail = newTrail.map((t, i) => ({
        ...t,
        opacity: (i + 1) / newTrail.length,
      }));
    }

    const newRipples = [...state.ripples];
    for (const pos of result.ripplePositions) {
      newRipples.push({
        id: uuidv4(),
        x: pos.x,
        y: pos.y,
        radius: 10,
        maxRadius: 40,
        opacity: 0.7,
        life: 0.4,
        maxLife: 0.4,
      });
    }

    const updatedRipples = newRipples
      .map((r) => {
        const newLife = r.life - dt;
        const progress = 1 - newLife / r.maxLife;
        return {
          ...r,
          radius: 10 + (r.maxRadius - 10) * progress,
          opacity: 0.7 * (1 - progress),
          life: newLife,
        };
      })
      .filter((r) => r.life > 0);

    let newPlayers = [...state.players];
    let gameOver = false;
    let winner: number | null = null;

    if (result.pocketedBalls.length > 0) {
      const currentPlayerIdx = state.currentPlayer;
      let addedScore = 0;

      for (const ball of result.pocketedBalls) {
        if (ball.number === 0) continue;
        if (ball.number === 8) {
          const otherBalls = result.balls.filter(
            (b) => b.number !== 0 && b.number !== 8 && !b.pocketed
          );
          if (otherBalls.length === 0) {
            addedScore += 50;
            gameOver = true;
            winner = currentPlayerIdx;
          } else {
            gameOver = true;
            winner = currentPlayerIdx === 0 ? 1 : 0;
          }
        } else if (ball.number >= 1 && ball.number <= 7) {
          addedScore += 10;
        } else if (ball.number >= 9 && ball.number <= 15) {
          addedScore += 15;
        }
      }

      if (addedScore > 0 || result.pocketedBalls.some((b) => b.number !== 0)) {
        newPlayers = newPlayers.map((p, idx) =>
          idx === currentPlayerIdx ? { ...p, score: p.score + addedScore } : p
        );
      }
    }

    if (result.allStopped && state.gamePhase === 'moving') {
      if (!gameOver) {
        const nextPlayer = state.currentPlayer === 0 ? 1 : 0;
        set({
          balls: result.balls,
          particles: result.particles,
          ripples: updatedRipples,
          trail: [],
          players: newPlayers,
          currentPlayer: nextPlayer,
          gamePhase: 'aiming',
        });
      } else {
        set({
          balls: result.balls,
          particles: result.particles,
          ripples: updatedRipples,
          trail: [],
          players: newPlayers,
          gamePhase: 'gameOver',
          winner,
        });
      }
    } else {
      set({
        balls: result.balls,
        particles: result.particles,
        ripples: updatedRipples,
        trail: newTrail,
        players: newPlayers,
        ...(gameOver ? { gamePhase: 'gameOver', winner } : {}),
      });
    }
  },

  resetGame: () => {
    get().initGame();
  },
}));
