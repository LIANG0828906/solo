import { v4 as uuidv4 } from 'uuid';
import type { Meteor, Particle } from '../../types/game';
import { useGameStore } from './gameState';
import {
  CORE_X,
  CORE_Y,
  CORE_RADIUS,
  MAP_WIDTH,
  MAP_HEIGHT,
  METEOR_BASE_COUNT,
  METEOR_COUNT_INCREMENT,
  METEOR_BASE_SPEED,
  METEOR_SPEED_INCREMENT,
  METEOR_RADIUS,
  METEOR_HP,
  METEOR_MIN_DIST_CORE,
  METEOR_SPAWN_INTERVAL,
  SIDE_SHIFT_START_WAVE,
  SIDE_SHIFT_PROB,
  SIDE_SHIFT_ANGLE,
  SIDE_SHIFT_DURATION,
  dist,
  angleTo,
  distSq,
  randomRange,
} from '../../utils/math';

export const getWaveMeteorCount = (wave: number): number => {
  return METEOR_BASE_COUNT + (wave - 1) * METEOR_COUNT_INCREMENT;
};

export const getWaveMeteorSpeed = (wave: number): number => {
  return METEOR_BASE_SPEED + (wave - 1) * METEOR_SPEED_INCREMENT;
};

export const getWaveMeteorHp = (wave: number): number => {
  return METEOR_HP + Math.floor((wave - 1) * 2);
};

const generateMeteorSpawnPosition = (): { x: number; y: number } => {
  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number;
  let attempts = 0;
  const maxAttempts = 50;

  do {
    switch (edge) {
      case 0:
        x = randomRange(0, MAP_WIDTH);
        y = 0;
        break;
      case 1:
        x = MAP_WIDTH;
        y = randomRange(0, MAP_HEIGHT);
        break;
      case 2:
        x = randomRange(0, MAP_WIDTH);
        y = MAP_HEIGHT;
        break;
      default:
        x = 0;
        y = randomRange(0, MAP_HEIGHT);
        break;
    }
    attempts++;
  } while (
    distSq(x, y, CORE_X, CORE_Y) < METEOR_MIN_DIST_CORE * METEOR_MIN_DIST_CORE &&
    attempts < maxAttempts
  );

  return { x, y };
};

export const createMeteor = (wave: number): Meteor => {
  const { x, y } = generateMeteorSpawnPosition();
  const angle = angleTo(x, y, CORE_X, CORE_Y);
  const hasSideShift = wave >= SIDE_SHIFT_START_WAVE && Math.random() < SIDE_SHIFT_PROB;
  const hp = getWaveMeteorHp(wave);

  return {
    id: uuidv4(),
    x,
    y,
    hp,
    maxHp: hp,
    speed: getWaveMeteorSpeed(wave),
    radius: METEOR_RADIUS,
    angle,
    hasSideShift,
    sideShiftPhase: (Math.random() - 0.5) * 2 * SIDE_SHIFT_ANGLE,
    sideShiftTimer: 0,
    isMoving: false,
  };
};

export const trySpawnMeteor = (now: number): void => {
  const state = useGameStore.getState();
  if (!state.isWaveActive || state.isGameOver) return;

  if (state.waveMeteorTotal === 0) {
    const total = getWaveMeteorCount(state.currentWave);
    useGameStore.setState({ waveMeteorTotal: total });
    return;
  }

  if (state.waveMeteorSpawned >= state.waveMeteorTotal) return;

  const lastSpawn = state.lastSpawnTime || state.lastResourceTick || now;
  if (now - lastSpawn < METEOR_SPAWN_INTERVAL && state.waveMeteorSpawned > 0) return;

  const meteor = createMeteor(state.currentWave);
  state.addMeteor(meteor);
  state.incrementWaveMeteorSpawned();
  state.setLastSpawnTime(now);

  if (state.waveMeteorSpawned + 1 >= state.waveMeteorTotal) {
    setTimeout(() => {
      const s = useGameStore.getState();
      const updatedMeteors = s.meteors.map((m) => ({ ...m, isMoving: true }));
      s.setMeteors(updatedMeteors);
    }, 50);
  }
};

export const updateMeteors = (deltaTime: number): { reachedCore: Meteor[]; destroyed: Meteor[] } => {
  const state = useGameStore.getState();
  const reachedCore: Meteor[] = [];
  const destroyed: Meteor[] = [];
  const updatedMeteors: Meteor[] = [];

  for (const meteor of state.meteors) {
    if (meteor.hp <= 0) {
      destroyed.push(meteor);
      continue;
    }

    let { x, y, angle, sideShiftTimer, sideShiftPhase } = meteor;

    if (meteor.isMoving) {
      let moveAngle = angle;

      if (meteor.hasSideShift) {
        sideShiftTimer += deltaTime;
        if (sideShiftTimer > SIDE_SHIFT_DURATION) {
          sideShiftTimer = 0;
          sideShiftPhase = (Math.random() - 0.5) * 2 * SIDE_SHIFT_ANGLE;
        }
        moveAngle = angle + sideShiftPhase;
      }

      const distancePerMs = meteor.speed;
      const moveDist = distancePerMs * (deltaTime / 16);
      x += Math.cos(moveAngle) * moveDist;
      y += Math.sin(moveAngle) * moveDist;

      const distToCore = dist(x, y, CORE_X, CORE_Y);
      if (distToCore <= CORE_RADIUS + meteor.radius) {
        reachedCore.push(meteor);
        continue;
      }
    }

    if (x < -50 || x > MAP_WIDTH + 50 || y < -50 || y > MAP_HEIGHT + 50) {
      continue;
    }

    updatedMeteors.push({
      ...meteor,
      x,
      y,
      sideShiftTimer,
      sideShiftPhase,
    });
  }

  if (reachedCore.length > 0) {
    let totalDamage = 0;
    const destroyedIds = new Set(reachedCore.map((m) => m.id));
    const finalMeteors = updatedMeteors.filter((m) => !destroyedIds.has(m.id));
    for (let i = 0; i < reachedCore.length; i++) {
      totalDamage += 10;
    }
    if (totalDamage > 0) {
      state.updateCoreHp(-totalDamage);
    }
    state.setMeteors(finalMeteors);
  } else {
    state.setMeteors(updatedMeteors);
  }

  if (destroyed.length > 0) {
    for (const d of destroyed) {
      state.addParticles(createMeteorDestroyParticles(d.x, d.y));
    }
  }

  return { reachedCore, destroyed };
};

export const createMeteorDestroyParticles = (x: number, y: number): Particle[] => {
  const particles: Particle[] = [];
  const colors = ['#FF4500', '#FF6347', '#FF8C00', '#FFA500', '#FFD700'];
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.5;
    const speed = randomRange(1, 3);
    particles.push({
      id: uuidv4(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: randomRange(3, 6),
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 500,
      maxLife: 500,
    });
  }
  return particles;
};

export const createHitParticles = (x: number, y: number): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = randomRange(0.5, 1.5);
    particles.push({
      id: uuidv4(),
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: randomRange(2, 4),
      color: '#FFD700',
      life: 300,
      maxLife: 300,
    });
  }
  return particles;
};

export const checkWaveComplete = (): boolean => {
  const state = useGameStore.getState();
  if (!state.isWaveActive) return false;
  if (state.waveMeteorTotal === 0) return false;
  if (state.waveMeteorSpawned < state.waveMeteorTotal) return false;
  return state.meteors.length === 0;
};
