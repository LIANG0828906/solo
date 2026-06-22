import { Player, Obstacle, Coin } from './types';
import {
  JUMP_HEIGHT,
  JUMP_UP_TIME,
  JUMP_DOWN_TIME,
  SLIDE_DURATION,
  PLAYER_SPEED,
  LANE_LEFT_X,
  LANE_RIGHT_X,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_SLIDE_HEIGHT,
  GROUND_Y,
  COLORS,
} from './constants';

const GRAVITY_UP = (2 * JUMP_HEIGHT) / (JUMP_UP_TIME * JUMP_UP_TIME);
const INITIAL_JUMP_VELOCITY = GRAVITY_UP * JUMP_UP_TIME;
const GRAVITY_DOWN = (2 * JUMP_HEIGHT) / (JUMP_DOWN_TIME * JUMP_DOWN_TIME);

export class PhysicsSystem {
  private keys: Set<string> = new Set();

  constructor() {
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      if (['arrowleft', 'arrowright', 'arrowdown', ' ', 'arrowup'].includes(key)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  isKeyPressed(key: string): boolean {
    return this.keys.has(key.toLowerCase());
  }

  updatePlayer(player: Player, deltaTime: number, isPaused: boolean): Player {
    if (isPaused) return player;

    const p = { ...player };

    if (this.isKeyPressed('arrowleft')) {
      p.x = Math.max(LANE_LEFT_X - 60, p.x - PLAYER_SPEED);
    }
    if (this.isKeyPressed('arrowright')) {
      p.x = Math.min(LANE_RIGHT_X + 60, p.x + PLAYER_SPEED);
    }

    if ((this.isKeyPressed(' ') || this.isKeyPressed('arrowup')) && p.state === 'idle') {
      p.state = 'jumping';
      p.jumpPhase = 'up';
      p.velocityY = INITIAL_JUMP_VELOCITY;
      p.stateTimer = 0;
      p.color = COLORS.playerJump;
    }

    if (this.isKeyPressed('arrowdown') && p.state === 'idle') {
      p.state = 'sliding';
      p.height = PLAYER_SLIDE_HEIGHT;
      p.y = p.baseY + (PLAYER_HEIGHT - PLAYER_SLIDE_HEIGHT);
      p.stateTimer = 0;
      p.color = COLORS.playerSlide;
    }

    p.stateTimer += deltaTime;

    if (p.state === 'jumping') {
      if (p.jumpPhase === 'up') {
        p.velocityY -= GRAVITY_UP * deltaTime;
        p.y -= p.velocityY * deltaTime * 60;
        if (p.stateTimer >= JUMP_UP_TIME) {
          p.jumpPhase = 'down';
          p.stateTimer = 0;
          p.velocityY = 0;
        }
      } else {
        p.velocityY += GRAVITY_DOWN * deltaTime;
        p.y += p.velocityY * deltaTime * 60;
        if (p.y >= p.baseY || p.stateTimer >= JUMP_DOWN_TIME) {
          p.y = p.baseY;
          p.state = 'idle';
          p.jumpPhase = 'none';
          p.velocityY = 0;
          p.color = COLORS.playerIdle;
        }
      }
    } else if (p.state === 'sliding') {
      if (p.stateTimer >= SLIDE_DURATION) {
        p.state = 'idle';
        p.height = PLAYER_HEIGHT;
        p.y = p.baseY;
        p.color = COLORS.playerIdle;
      }
    }

    return p;
  }

  checkRectCollision(
    ax: number, ay: number, aw: number, ah: number,
    bx: number, by: number, bw: number, bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  checkCircleRectCollision(
    cx: number, cy: number, cr: number,
    rx: number, ry: number, rw: number, rh: number
  ): boolean {
    const closestX = Math.max(rx, Math.min(cx, rx + rw));
    const closestY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - closestX;
    const dy = cy - closestY;
    return dx * dx + dy * dy < cr * cr;
  }

  checkPlayerObstacleCollision(player: Player, obstacle: Obstacle): boolean {
    return this.checkRectCollision(
      player.x - player.width / 2,
      player.y,
      player.width,
      player.height,
      obstacle.x - obstacle.width / 2,
      obstacle.y,
      obstacle.width,
      obstacle.height
    );
  }

  checkPlayerCoinCollision(player: Player, coin: Coin): boolean {
    return this.checkCircleRectCollision(
      coin.x,
      coin.y,
      coin.radius,
      player.x - player.width / 2,
      player.y,
      player.width,
      player.height
    );
  }

  cleanup(): void {
  }
}

export function createInitialPlayer(): Player {
  return {
    x: 400,
    y: GROUND_Y - PLAYER_HEIGHT,
    baseY: GROUND_Y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    state: 'idle',
    stateTimer: 0,
    jumpPhase: 'none',
    color: COLORS.playerIdle,
  };
}
