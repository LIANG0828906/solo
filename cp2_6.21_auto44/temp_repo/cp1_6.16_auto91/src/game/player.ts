import { Player, CONFIG } from '../types';

export function createPlayer(): Player {
  return {
    x: 200,
    y: CONFIG.GROUND_Y - CONFIG.PLAYER_SIZE,
    vx: 0,
    vy: 0,
    width: CONFIG.PLAYER_SIZE,
    height: CONFIG.PLAYER_SIZE,
    lives: CONFIG.INITIAL_LIVES,
    isJumping: false,
    isInvincible: false,
    invincibleTimer: 0,
    frameIndex: 0,
    frameTimer: 0,
    state: 'running'
  };
}

export interface PlayerInput {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export function updatePlayer(
  player: Player,
  input: PlayerInput,
  deltaTime: number
): void {
  const dt = deltaTime / 16.67;

  if (player.isInvincible) {
    player.invincibleTimer -= deltaTime;
    if (player.invincibleTimer <= 0) {
      player.isInvincible = false;
    }
  }

  player.vx = 0;
  if (input.left) {
    player.vx = -CONFIG.MOVE_SPEED * dt;
    player.state = 'running';
  }
  if (input.right) {
    player.vx = CONFIG.MOVE_SPEED * dt;
    player.state = 'running';
  }
  if (!input.left && !input.right && !player.isJumping) {
    player.state = 'idle';
  }

  if (input.jump && !player.isJumping) {
    player.vy = CONFIG.JUMP_FORCE;
    player.isJumping = true;
    player.state = 'jumping';
  }

  if (player.isJumping) {
    player.vy += CONFIG.GRAVITY * dt;
    player.state = 'jumping';
  }

  player.x += player.vx;
  player.y -= player.vy * dt;

  if (player.x < 60) {
    player.x = 60;
  }
  if (player.x > CONFIG.CANVAS_WIDTH - 60 - player.width) {
    player.x = CONFIG.CANVAS_WIDTH - 60 - player.width;
  }

  if (player.y >= CONFIG.GROUND_Y - player.height) {
    player.y = CONFIG.GROUND_Y - player.height;
    player.vy = 0;
    player.isJumping = false;
  }
  if (player.y <= CONFIG.CEILING_Y) {
    player.y = CONFIG.CEILING_Y;
    player.vy = 0;
  }

  player.frameTimer += deltaTime;
  if (player.frameTimer >= 100) {
    player.frameTimer = 0;
    player.frameIndex = (player.frameIndex + 1) % 4;
  }
}

export function hitPlayer(player: Player): void {
  if (player.isInvincible) return;
  
  player.lives--;
  player.isInvincible = true;
  player.invincibleTimer = 500;
}
