import { v4 as uuidv4 } from 'uuid';
import {
  Level,
  Button,
  Door,
  Platform,
  fetchLevels,
  submitRecord,
} from './levelDataService';
import {
  LightCone,
  ShadowPolygon,
  Particle,
  computeShadows,
  circleInActiveLight,
} from './renderEngine';

export interface ButtonState extends Button {
  activated: boolean;
  illuminateStartTime: number | null;
  pulsePhase: number;
  pulseSpeed: number;
}

export interface DoorState extends Door {
  openProgress: number;
  isOpening: boolean;
}

export interface PlatformState extends Platform {
  currentY: number;
  isRising: boolean;
  startY: number;
}

export interface BatteryPack {
  id: string;
  x: number;
  y: number;
  size: number;
  collected: boolean;
  pulsePhase: number;
}

export interface GameState {
  levels: Level[];
  currentLevelIndex: number;
  player: {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    radius: number;
    isMoving: boolean;
  };
  flashlight: {
    angle: number;
    targetAngle: number;
    range: number;
    coneAngle: number;
    battery: number;
    isFlickering: boolean;
  };
  buttons: ButtonState[];
  doors: DoorState[];
  platforms: PlatformState[];
  particles: Particle[];
  batteryPacks: BatteryPack[];
  shadows: ShadowPolygon[];
  levelStartTime: number;
  fastestTime: number | null;
  isLevelComplete: boolean;
  isTransitioning: boolean;
  shakeTime: number;
  playerId: string;
}

export function createInitialState(): GameState {
  return {
    levels: [],
    currentLevelIndex: 0,
    player: {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      radius: 15,
      isMoving: false,
    },
    flashlight: {
      angle: 0,
      targetAngle: 0,
      range: 300,
      coneAngle: 60,
      battery: 100,
      isFlickering: false,
    },
    buttons: [],
    doors: [],
    platforms: [],
    particles: [],
    batteryPacks: [],
    shadows: [],
    levelStartTime: 0,
    fastestTime: null,
    isLevelComplete: false,
    isTransitioning: false,
    shakeTime: 0,
    playerId: uuidv4(),
  };
}

export async function initializeGame(): Promise<GameState> {
  const state = createInitialState();
  state.levels = await fetchLevels();
  if (state.levels.length > 0) {
    loadLevel(state, 0);
  }
  return state;
}

export function loadLevel(state: GameState, levelIndex: number): void {
  if (levelIndex < 0 || levelIndex >= state.levels.length) return;

  const level = state.levels[levelIndex];
  state.currentLevelIndex = levelIndex;

  state.player.x = level.playerStart.x;
  state.player.y = level.playerStart.y;
  state.player.targetX = level.playerStart.x;
  state.player.targetY = level.playerStart.y;
  state.player.isMoving = false;

  state.flashlight.angle = 0;
  state.flashlight.targetAngle = 0;
  state.flashlight.battery = 100;
  state.flashlight.isFlickering = false;

  state.buttons = level.buttons.map((b) => ({
    ...b,
    activated: false,
    illuminateStartTime: null,
    pulsePhase: Math.random(),
    pulseSpeed: 0.3 + Math.random() * 0.2,
  }));

  state.doors = (level.doors || []).map((d) => ({
    ...d,
    openProgress: 0,
    isOpening: false,
  }));

  state.platforms = (level.platforms || []).map((p) => ({
    ...p,
    currentY: p.y,
    isRising: false,
    startY: p.y,
  }));

  state.particles = [];
  state.batteryPacks = generateBatteryPacks(level);
  state.shadows = [];
  state.levelStartTime = performance.now();
  state.fastestTime = null;
  state.isLevelComplete = false;
  state.isTransitioning = false;
  state.shakeTime = 0;
}

function generateBatteryPacks(level: Level): BatteryPack[] {
  const packs: BatteryPack[] = [];
  const count = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < count; i++) {
    packs.push({
      id: `battery-${level.id}-${i}`,
      x: 150 + Math.random() * 700,
      y: 100 + Math.random() * 400,
      size: 20,
      collected: false,
      pulsePhase: Math.random(),
    });
  }
  return packs;
}

export function setPlayerTarget(state: GameState, x: number, y: number): void {
  if (state.isLevelComplete) return;
  state.player.targetX = x;
  state.player.targetY = y;
  state.player.isMoving = true;
}

export function adjustFlashlightAngle(state: GameState, delta: number): void {
  if (state.isLevelComplete) return;
  state.flashlight.targetAngle += delta;
}

export function updateGame(state: GameState, dt: number, canvasWidth: number, canvasHeight: number): void {
  const maxSpeed = 200;
  const dx = state.player.targetX - state.player.x;
  const dy = state.player.targetY - state.player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 2) {
    const moveDist = Math.min(dist, maxSpeed * dt);
    state.player.x += (dx / dist) * moveDist;
    state.player.y += (dy / dist) * moveDist;
    spawnParticle(state, state.player.x, state.player.y);
  } else {
    state.player.isMoving = false;
  }

  state.player.x = Math.max(state.player.radius, Math.min(canvasWidth - state.player.radius, state.player.x));
  state.player.y = Math.max(state.player.radius, Math.min(canvasHeight - state.player.radius, state.player.y));

  const angleDiff = state.flashlight.targetAngle - state.flashlight.angle;
  const dampingFactor = 1 - Math.pow(0.001, dt);
  state.flashlight.angle += angleDiff * dampingFactor;

  const batteryDrain = 2 * dt;
  state.flashlight.battery = Math.max(0, state.flashlight.battery - batteryDrain);
  state.flashlight.isFlickering = state.flashlight.battery > 0 && state.flashlight.battery < 20;

  const light: LightCone = {
    origin: { x: state.player.x, y: state.player.y },
    angle: state.flashlight.angle,
    halfConeAngle: state.flashlight.coneAngle / 2,
    range: state.flashlight.range,
  };

  const level = state.levels[state.currentLevelIndex];
  const isLightOn = state.flashlight.battery > 0;
  state.shadows = isLightOn
    ? computeShadows(light, level.obstacles)
    : [];

  for (const btn of state.buttons) {
    if (btn.activated) continue;

    btn.pulsePhase = (btn.pulsePhase + btn.pulseSpeed * dt) % 1;
    const isInLight = isLightOn && circleInActiveLight(btn.x, btn.y, btn.radius, light, state.shadows);

    if (isInLight) {
      if (btn.illuminateStartTime === null) {
        btn.illuminateStartTime = performance.now();
      } else {
        const elapsed = (performance.now() - btn.illuminateStartTime) / 1000;
        if (elapsed >= 1.5) {
          activateButton(state, btn);
        }
      }
    } else {
      btn.illuminateStartTime = null;
    }
  }

  for (const door of state.doors) {
    if (door.isOpening && door.openProgress < 1) {
      door.openProgress = Math.min(1, door.openProgress + dt / 0.8);
    }
  }

  for (const plat of state.platforms) {
    if (plat.isRising && plat.currentY > plat.targetY) {
      plat.currentY = Math.max(plat.targetY, plat.currentY - (plat.startY - plat.targetY) * dt / 1.2);
      plat.y = plat.currentY;
    }
  }

  state.particles = state.particles.filter((p) => {
    p.life -= dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
    return p.life > 0;
  });

  for (const bp of state.batteryPacks) {
    if (!bp.collected) {
      bp.pulsePhase = (bp.pulsePhase + dt / 0.8) % 1;
      const bdx = state.player.x - bp.x;
      const bdy = state.player.y - bp.y;
      const bdist = Math.sqrt(bdx * bdx + bdy * bdy);
      if (bdist < state.player.radius + bp.size / 2) {
        bp.collected = true;
        state.flashlight.battery = Math.min(100, state.flashlight.battery + 30);
      }
    }
  }
  state.batteryPacks = state.batteryPacks.filter((bp) => !bp.collected);

  if (state.shakeTime > 0) {
    state.shakeTime -= dt;
  }

  if (!state.isLevelComplete) {
    const allActivated = state.buttons.every((b) => b.activated);
    if (allActivated) {
      const ex = level.exit;
      const playerInExit =
        state.player.x + state.player.radius > ex.x &&
        state.player.x - state.player.radius < ex.x + ex.width &&
        state.player.y + state.player.radius > ex.y &&
        state.player.y - state.player.radius < ex.y + ex.height;

      if (playerInExit) {
        completeLevel(state);
      }
    }
  }
}

function spawnParticle(state: GameState, x: number, y: number): void {
  if (state.particles.length > 50) return;
  const angle = Math.random() * Math.PI * 2;
  const offset = Math.random() * 3;
  state.particles.push({
    x: x + Math.cos(angle) * offset,
    y: y + Math.sin(angle) * offset,
    alpha: 0.5,
    life: 0.2,
    maxLife: 0.2,
  });
}

function activateButton(state: GameState, btn: ButtonState): void {
  btn.activated = true;
  state.shakeTime = 0.1;

  if (btn.triggerDoorId) {
    const door = state.doors.find((d) => d.id === btn.triggerDoorId);
    if (door) door.isOpening = true;
  }
  if (btn.triggerPlatformId) {
    const plat = state.platforms.find((p) => p.id === btn.triggerPlatformId);
    if (plat) plat.isRising = true;
  }
}

async function completeLevel(state: GameState): Promise<void> {
  if (state.isLevelComplete) return;
  state.isLevelComplete = true;

  const duration = (performance.now() - state.levelStartTime) / 1000;
  try {
    const result = await submitRecord(
      state.playerId,
      state.levels[state.currentLevelIndex].id,
      duration
    );
    state.fastestTime = result.fastestTime;
  } catch (e) {
    console.error('提交记录失败', e);
  }
}

export function goToNextLevel(state: GameState): boolean {
  const nextIndex = state.currentLevelIndex + 1;
  if (nextIndex >= state.levels.length) {
    return false;
  }
  state.isTransitioning = true;
  setTimeout(() => {
    loadLevel(state, nextIndex);
    state.isTransitioning = false;
  }, 500);
  return true;
}

export function allButtonsActivated(state: GameState): boolean {
  return state.buttons.every((b) => b.activated);
}
