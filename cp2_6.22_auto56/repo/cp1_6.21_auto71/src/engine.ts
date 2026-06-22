export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Spike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EnergyCore {
  x: number;
  y: number;
  collected: boolean;
  rotation: number;
}

export interface Player {
  x: number;
  y: number;
  velocityY: number;
  gravityDirection: 1 | -1;
  rotation: number;
  isFlipping: boolean;
  flipStartTime: number;
  colorFlashTime: number;
  isOnGround: boolean;
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  spikes: Spike[];
  energyCores: EnergyCore[];
  score: number;
  highScore: number;
  cameraX: number;
  gameOver: boolean;
  screenShake: { active: boolean; startTime: number; duration: number };
  worldWidth: number;
}

const GRAVITY = 0.6;
const PLAYER_SIZE = 8;
const PLAYER_START_X = 100;
const SCROLL_SPEED = 3;
const GROUND_Y = 400;
const CEILING_Y = 80;
const FLIP_DURATION = 400;
const COLOR_FLASH_DURATION = 200;
const SHAKE_DURATION = 300;

export function createInitialState(highScore: number = 0): GameState {
  const platforms: Platform[] = [];
  const spikes: Spike[] = [];
  const energyCores: EnergyCore[] = [];

  platforms.push({
    x: 0,
    y: GROUND_Y,
    width: 500,
    height: 20,
  });

  let lastX = 500;
  for (let i = 0; i < 30; i++) {
    const gap = 150 + Math.random() * 100;
    const x = lastX + gap;
    const isTop = Math.random() > 0.5;
    const y = isTop ? CEILING_Y + Math.random() * 100 : GROUND_Y - Math.random() * 80;
    const width = 120 + Math.random() * 150;

    platforms.push({ x, y, width, height: 20 });

    const spikeX = x + width / 2 - 15;
    const spikeY = isTop ? y + 20 : y - 20;
    spikes.push({ x: spikeX, y: spikeY, width: 30, height: 20 });

    if (Math.random() > 0.4) {
      energyCores.push({
        x: x + width / 2,
        y: isTop ? y + 60 : y - 50,
        collected: false,
        rotation: 0,
      });
    }

    lastX = x + width;
  }

  return {
    player: {
      x: PLAYER_START_X,
      y: GROUND_Y - 40,
      velocityY: 0,
      gravityDirection: 1,
      rotation: 0,
      isFlipping: false,
      flipStartTime: 0,
      colorFlashTime: 0,
      isOnGround: true,
    },
    platforms,
    spikes,
    energyCores,
    score: 0,
    highScore,
    cameraX: 0,
    gameOver: false,
    screenShake: { active: false, startTime: 0, duration: SHAKE_DURATION },
    worldWidth: lastX + 1000,
  };
}

export function flipGravity(state: GameState, currentTime: number): void {
  if (state.player.isFlipping || state.gameOver) return;
  state.player.gravityDirection *= -1 as 1 | -1;
  state.player.velocityY = 0;
  state.player.isFlipping = true;
  state.player.flipStartTime = currentTime;
  state.player.colorFlashTime = currentTime + COLOR_FLASH_DURATION;
}

function aabbCollision(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function update(state: GameState, deltaTime: number, currentTime: number): void {
  if (state.gameOver) return;

  const { player } = state;

  if (player.isFlipping) {
    const elapsed = currentTime - player.flipStartTime;
    if (elapsed >= FLIP_DURATION) {
      player.rotation = player.gravityDirection === 1 ? 0 : 180;
      player.isFlipping = false;
    } else {
      const progress = elapsed / FLIP_DURATION;
      player.rotation = player.gravityDirection === 1 ? 180 - progress * 180 : progress * 180;
    }
  }

  player.velocityY += GRAVITY * player.gravityDirection;
  player.y += player.velocityY;

  player.x += SCROLL_SPEED;
  state.cameraX = player.x - PLAYER_START_X;

  player.isOnGround = false;
  for (const platform of state.platforms) {
    if (aabbCollision(
      player.x - PLAYER_SIZE / 2, player.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE,
      platform.x, platform.y, platform.width, platform.height
    )) {
      if (player.gravityDirection === 1) {
        if (player.velocityY > 0) {
          player.y = platform.y - PLAYER_SIZE / 2;
          player.velocityY = 0;
          player.isOnGround = true;
        }
      } else {
        if (player.velocityY < 0) {
          player.y = platform.y + platform.height + PLAYER_SIZE / 2;
          player.velocityY = 0;
          player.isOnGround = true;
        }
      }
    }
  }

  for (const spike of state.spikes) {
    if (aabbCollision(
      player.x - PLAYER_SIZE / 2, player.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE,
      spike.x + 4, spike.y + 4, spike.width - 8, spike.height - 8
    )) {
      state.gameOver = true;
      state.screenShake = { active: true, startTime: currentTime, duration: SHAKE_DURATION };
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
      return;
    }
  }

  for (const core of state.energyCores) {
    if (!core.collected) {
      core.rotation += (deltaTime / 2000) * 360;
      if (aabbCollision(
        player.x - PLAYER_SIZE / 2, player.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE,
        core.x - 12, core.y - 12, 24, 24
      )) {
        core.collected = true;
        state.score += 10;
      }
    }
  }

  const lastPlatform = state.platforms[state.platforms.length - 1];
  if (lastPlatform.x + lastPlatform.width - state.cameraX < 1500) {
    generateNextChunk(state);
  }

  if (state.screenShake.active) {
    if (currentTime - state.screenShake.startTime > state.screenShake.duration) {
      state.screenShake.active = false;
    }
  }

  state.score = Math.max(state.score, Math.floor(state.cameraX / 10));
}

function generateNextChunk(state: GameState): void {
  const lastPlatform = state.platforms[state.platforms.length - 1];
  const lastX = lastPlatform.x + lastPlatform.width;

  for (let i = 0; i < 10; i++) {
    const gap = 150 + Math.random() * 100;
    const x = lastX + gap + i * 300;
    const isTop = Math.random() > 0.5;
    const y = isTop ? CEILING_Y + Math.random() * 100 : GROUND_Y - Math.random() * 80;
    const width = 120 + Math.random() * 150;

    state.platforms.push({ x, y, width, height: 20 });

    const spikeX = x + width / 2 - 15;
    const spikeY = isTop ? y + 20 : y - 20;
    state.spikes.push({ x: spikeX, y: spikeY, width: 30, height: 20 });

    if (Math.random() > 0.4) {
      state.energyCores.push({
        x: x + width / 2,
        y: isTop ? y + 60 : y - 50,
        collected: false,
        rotation: 0,
      });
    }

    state.worldWidth = x + width + 1000;
  }
}

export function getState(state: GameState): GameState {
  return state;
}
