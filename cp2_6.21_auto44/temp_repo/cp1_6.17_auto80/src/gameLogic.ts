import { v4 as uuidv4 } from 'uuid';
import { GameState, Mineral, MineralType, Shockwave, Meteor } from './types';
import { createMineral, getMineralValue } from './store';

export const TRAIL_DURATION = 800;
export const TRAIL_MAX_POINTS = 15;
export const SHOCKWAVE_DURATION = 300;
export const SHOCKWAVE_START_RADIUS = 10;
export const SHOCKWAVE_END_RADIUS = 60;
export const WARNING_DURATION = 1500;
export const METEOR_COUNTDOWN = 3000;
export const PRODUCTION_PAUSE_DURATION = 15000;
export const RECOVERY_DURATION = 1500;

interface CalculateFrameParams {
  gameState: GameState;
  deltaTime: number;
  currentTime: number;
  canvasWidth: number;
  canvasHeight: number;
}

export const calculateFrame = (params: CalculateFrameParams): GameState => {
  const { gameState, deltaTime, currentTime, canvasWidth, canvasHeight } = params;
  const dt = deltaTime / 16.67;

  let newState = { ...gameState };

  if (newState.meteorEvent.shakeFrames > 0) {
    newState.meteorEvent = {
      ...newState.meteorEvent,
      shakeFrames: Math.max(0, newState.meteorEvent.shakeFrames - 1)
    };
  }

  if (newState.productionPaused && currentTime >= newState.productionPausedUntil) {
    newState.productionPaused = false;
    newState.recoveryStartTime = currentTime;
  }

  newState = updateMinerals(newState, dt, currentTime, canvasWidth, canvasHeight);
  newState = updateShockwaves(newState, currentTime);
  newState = updateMeteorEvent(newState, currentTime, canvasWidth, canvasHeight);

  return newState;
};

const updateMinerals = (
  state: GameState,
  dt: number,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): GameState => {
  if (state.productionPaused) return state;

  const updatedMinerals: Mineral[] = [];
  const typesToSpawn: MineralType[] = [];

  for (const mineral of state.minerals) {
    const newX = mineral.x + mineral.vx * dt;
    const newY = mineral.y + mineral.vy * dt;
    const newRotation = mineral.rotation + mineral.rotationSpeed * dt;

    const newTrail = [...mineral.trail, { x: mineral.x, y: mineral.y, alpha: 1 }];
    while (newTrail.length > TRAIL_MAX_POINTS) {
      newTrail.shift();
    }
    for (let i = 0; i < newTrail.length; i++) {
      newTrail[i] = {
        ...newTrail[i],
        alpha: (i + 1) / newTrail.length
      };
    }

    const layers = {
      [MineralType.Surface]: { minY: 0.65, maxY: 0.9 },
      [MineralType.Mid]: { minY: 0.4, maxY: 0.7 },
      [MineralType.Deep]: { minY: 0.15, maxY: 0.45 }
    };
    const layer = layers[mineral.type];
    const topLimit = canvasHeight * layer.minY - 80;

    if (
      newY < topLimit ||
      newX < 20 ||
      newX > canvasWidth - 20
    ) {
      typesToSpawn.push(mineral.type);
      continue;
    }

    updatedMinerals.push({
      ...mineral,
      x: newX,
      y: newY,
      rotation: newRotation,
      trail: newTrail
    });
  }

  for (const type of typesToSpawn) {
    if (state.mineralUnlocks[type]) {
      updatedMinerals.push(createMineral(type, canvasWidth, canvasHeight));
    }
  }

  return { ...state, minerals: updatedMinerals };
};

const updateShockwaves = (state: GameState, currentTime: number): GameState => {
  const updatedShockwaves: Shockwave[] = [];

  for (const sw of state.shockwaves) {
    const elapsed = currentTime - sw.startTime;
    if (elapsed >= SHOCKWAVE_DURATION) continue;

    const progress = elapsed / SHOCKWAVE_DURATION;
    updatedShockwaves.push({
      ...sw,
      radius: SHOCKWAVE_START_RADIUS + (SHOCKWAVE_END_RADIUS - SHOCKWAVE_START_RADIUS) * progress,
      alpha: 1 - progress
    });
  }

  return { ...state, shockwaves: updatedShockwaves };
};

const updateMeteorEvent = (
  state: GameState,
  currentTime: number,
  canvasWidth: number,
  canvasHeight: number
): GameState => {
  let newState = { ...state };

  if (!newState.meteorEvent.active && !newState.productionPaused && currentTime >= newState.nextMeteorTime) {
    newState = triggerMeteorShower(newState, currentTime);
  }

  if (newState.meteorEvent.active && newState.meteorEvent.warningPhase) {
    if (currentTime - newState.meteorEvent.warningStartTime >= WARNING_DURATION) {
      newState.meteorEvent = {
        ...newState.meteorEvent,
        warningPhase: false,
        shakeFrames: 2
      };
      newState = spawnMeteors(newState, canvasWidth, canvasHeight, currentTime);
    }
  }

  if (newState.meteorEvent.active && !newState.meteorEvent.warningPhase) {
    const updatedMeteors: Meteor[] = [];
    let allResolved = true;

    for (const meteor of newState.meteorEvent.meteors) {
      if (!meteor.active) {
        updatedMeteors.push(meteor);
        continue;
      }

      allResolved = false;
      const newCountdown = meteor.countdown - 16.67;

      if (newCountdown <= 0) {
        newState.productionPaused = true;
        newState.productionPausedUntil = currentTime + PRODUCTION_PAUSE_DURATION;
        updatedMeteors.push({ ...meteor, active: false, countdown: 0 });
      } else {
        const newY = meteor.y + meteor.vy;
        const newX = meteor.x + meteor.vx;
        const clampedX = Math.max(meteor.size, Math.min(canvasWidth - meteor.size, newX));

        if (newY < canvasHeight + meteor.size) {
          updatedMeteors.push({
            ...meteor,
            x: clampedX,
            y: newY,
            rotation: meteor.rotation + meteor.rotationSpeed,
            countdown: newCountdown
          });
        } else {
          updatedMeteors.push({ ...meteor, y: canvasHeight + meteor.size, countdown: newCountdown });
        }
      }
    }

    newState.meteorEvent = { ...newState.meteorEvent, meteors: updatedMeteors };

    if (allResolved) {
      newState.meteorEvent = {
        active: false,
        warningPhase: false,
        warningStartTime: 0,
        shakeFrames: 0,
        meteors: []
      };
      newState.nextMeteorTime = currentTime + 45000 + Math.random() * 45000;
    }
  }

  return newState;
};

export const triggerMeteorShower = (state: GameState, currentTime: number): GameState => {
  return {
    ...state,
    meteorEvent: {
      active: true,
      warningPhase: true,
      warningStartTime: currentTime,
      shakeFrames: 0,
      meteors: []
    }
  };
};

const spawnMeteors = (
  state: GameState,
  canvasWidth: number,
  canvasHeight: number,
  _currentTime: number
): GameState => {
  const meteorCount = 3 + Math.floor(Math.random() * 3);
  const meteors: Meteor[] = [];

  for (let i = 0; i < meteorCount; i++) {
    meteors.push({
      id: uuidv4(),
      x: 60 + Math.random() * (canvasWidth - 120),
      y: -60 - Math.random() * 100,
      vy: 1.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      size: 35 + Math.random() * 15,
      countdown: METEOR_COUNTDOWN,
      active: true
    });
  }

  return {
    ...state,
    meteorEvent: {
      ...state.meteorEvent,
      meteors
    }
  };
};

interface HandleClickResult {
  collected: boolean;
  mineralType?: MineralType;
  collectedX?: number;
  collectedY?: number;
  destroyedMeteorId?: string;
}

export const handleClick = (
  state: GameState,
  clickX: number,
  clickY: number,
  currentTime: number
): { newState: GameState; result: HandleClickResult } => {
  for (const meteor of state.meteorEvent.meteors) {
    if (!meteor.active) continue;
    const dx = clickX - meteor.x;
    const dy = clickY - meteor.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= meteor.size + 10) {
      const newMeteors = state.meteorEvent.meteors.map(m =>
        m.id === meteor.id ? { ...m, active: false } : m
      );
      return {
        newState: {
          ...state,
          meteorEvent: { ...state.meteorEvent, meteors: newMeteors }
        },
        result: { collected: false, destroyedMeteorId: meteor.id }
      };
    }
  }

  for (let i = state.minerals.length - 1; i >= 0; i--) {
    const mineral = state.minerals[i];
    const dx = clickX - mineral.x;
    const dy = clickY - mineral.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= mineral.size + 5) {
      return {
        newState: state,
        result: {
          collected: true,
          mineralType: mineral.type,
          collectedX: mineral.x,
          collectedY: mineral.y
        }
      };
    }
  }

  return { newState: state, result: { collected: false } };
};

export const createShockwave = (x: number, y: number, currentTime: number): Shockwave => ({
  id: uuidv4(),
  x,
  y,
  radius: SHOCKWAVE_START_RADIUS,
  alpha: 1,
  startTime: currentTime
});

export const performAutoMine = (state: GameState): { type: MineralType; x: number; y: number } | null => {
  if (state.productionPaused) return null;
  if (state.minerals.length === 0) return null;

  const availableMinerals = state.minerals.filter(m => state.mineralUnlocks[m.type]);
  if (availableMinerals.length === 0) return null;

  const weights = availableMinerals.map(m => {
    if (m.type === MineralType.Surface) return 3;
    if (m.type === MineralType.Mid) return 2;
    return 1;
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < availableMinerals.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      const m = availableMinerals[i];
      return { type: m.type, x: m.x, y: m.y };
    }
  }

  const last = availableMinerals[availableMinerals.length - 1];
  return { type: last.type, x: last.x, y: last.y };
};

export const getClickPowerAmount = (state: GameState, type: MineralType): number => {
  return getMineralValue(type) * state.upgrades.clickPower;
};

export const getAutoMineAmount = (state: GameState, type: MineralType): number => {
  return getMineralValue(type) * state.upgrades.autoMine * state.autoMineRate * 0.1;
};
