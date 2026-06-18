import { create } from 'zustand';
import {
  GameStore,
  GameStoreState,
  Mechanism,
  Particle,
  PendulumState,
  Vector2D,
} from './types';
import { getLevelConfig, TOTAL_LEVELS, updateMechanismsWithTime } from './levelManager';
import { computeBobPosition, BOB_RADIUS, mapDragToInitialVelocity } from './physicsEngine';
import { createParticles, stepParticles } from './uiRenderer';

function makeInitialPendulum(levelIndex: number): PendulumState {
  const cfg = getLevelConfig(levelIndex);
  return {
    pivot: { ...cfg.pivot },
    angle: cfg.initialAngle,
    angularVelocity: 0,
    ropeLength: cfg.ropeLength,
    bobRadius: BOB_RADIUS,
    bobPosition: computeBobPosition(cfg.pivot, cfg.initialAngle, cfg.ropeLength),
  };
}

function initialState(): GameStoreState {
  const idx = 0;
  const cfg = getLevelConfig(idx);
  return {
    currentView: 'menu',
    currentLevelIndex: idx,
    completedLevels: [],
    interactionMode: 'idle',
    dragStart: null,
    dragCurrent: null,
    pendulum: makeInitialPendulum(idx),
    mechanisms: cfg.mechanisms,
    collectedGems: 0,
    swingCount: 0,
    timeRemaining: cfg.timeLimit || 0,
    levelStartTime: 0,
    particles: [],
    levelWon: false,
    gameTimeSec: 0,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState(),

  setView: (view) => set({ currentView: view }),

  selectLevel: (index) => {
    const idx = Math.max(0, Math.min(TOTAL_LEVELS - 1, index));
    const cfg = getLevelConfig(idx);
    set({
      currentLevelIndex: idx,
      currentView: 'playing',
      interactionMode: 'idle',
      dragStart: null,
      dragCurrent: null,
      pendulum: makeInitialPendulum(idx),
      mechanisms: cfg.mechanisms,
      collectedGems: 0,
      swingCount: 0,
      timeRemaining: cfg.timeLimit || 0,
      levelStartTime: performance.now(),
      particles: [],
      levelWon: false,
      gameTimeSec: 0,
    });
  },

  resetLevel: () => {
    const idx = get().currentLevelIndex;
    const cfg = getLevelConfig(idx);
    set({
      interactionMode: 'idle',
      dragStart: null,
      dragCurrent: null,
      pendulum: makeInitialPendulum(idx),
      mechanisms: cfg.mechanisms,
      collectedGems: 0,
      swingCount: 0,
      timeRemaining: cfg.timeLimit || 0,
      levelStartTime: performance.now(),
      particles: [],
      levelWon: false,
      gameTimeSec: 0,
    });
  },

  completeLevel: () => {
    const { currentLevelIndex, completedLevels } = get();
    const next = completedLevels.includes(currentLevelIndex)
      ? completedLevels
      : [...completedLevels, currentLevelIndex];
    set({ completedLevels: next, levelWon: true });
  },

  startDrag: (pos) => {
    const { pendulum, interactionMode } = get();
    if (interactionMode === 'swinging') return;
    const dx = pos.x - pendulum.bobPosition.x;
    const dy = pos.y - pendulum.bobPosition.y;
    if (dx * dx + dy * dy > 50 * 50) return;
    set({
      interactionMode: 'dragging',
      dragStart: { ...pos },
      dragCurrent: { ...pos },
    });
  },

  updateDrag: (pos) => {
    if (get().interactionMode !== 'dragging') return;
    set({ dragCurrent: { ...pos } });
  },

  releaseDrag: () => {
    const s = get();
    if (s.interactionMode !== 'dragging' || !s.dragStart || !s.dragCurrent) return;
    const res = mapDragToInitialVelocity(s.pendulum, s.dragStart, s.dragCurrent);
    const newPendulum: PendulumState = {
      ...s.pendulum,
      angle: res.angle,
      angularVelocity: res.angularVelocity,
      bobPosition: computeBobPosition(s.pendulum.pivot, res.angle, s.pendulum.ropeLength),
    };
    set({
      interactionMode: 'swinging',
      dragStart: null,
      dragCurrent: null,
      pendulum: newPendulum,
      swingCount: s.swingCount + 1,
    });
  },

  updatePendulum: (state) => set({ pendulum: state }),

  collectGem: (mechanismId) => {
    const { mechanisms, collectedGems } = get();
    const updated = mechanisms.map((m) =>
      m.id === mechanismId ? { ...m, active: false } : m
    );
    set({
      mechanisms: updated,
      collectedGems: collectedGems + 1,
    });
  },

  triggerMechanism: (mechanismId) => {
    const { mechanisms } = get();
    const updated = mechanisms.map((m) =>
      m.id === mechanismId ? { ...m, triggered: true } : m
    );
    set({ mechanisms: updated });
  },

  teleportPendulum: (targetPivot, targetAngle, preserveVelocity) => {
    const { pendulum } = get();
    const newPendulum: PendulumState = {
      ...pendulum,
      pivot: { ...targetPivot },
      angle: targetAngle,
      angularVelocity: preserveVelocity ? pendulum.angularVelocity : pendulum.angularVelocity * 0.9,
      bobPosition: computeBobPosition(targetPivot, targetAngle, pendulum.ropeLength),
    };
    set({ pendulum: newPendulum });
  },

  addParticles: (origin, count) => {
    const newParticles = createParticles(origin, count);
    set((s) => ({ particles: [...s.particles, ...newParticles] }));
  },

  updateParticles: (dt) => {
    set((s) => ({ particles: stepParticles(s.particles, dt) }));
  },

  setLevelWon: (won) => set({ levelWon: won }),

  updateTime: (elapsedMs) => {
    const cfg = getLevelConfig(get().currentLevelIndex);
    if (!cfg.timeLimit) return;
    set((s) => {
      const rem = Math.max(0, s.timeRemaining - elapsedMs / 1000);
      return { timeRemaining: rem };
    });
  },

  updateMechanisms: (timeSec) => {
    set((s) => ({
      gameTimeSec: timeSec,
      mechanisms: updateMechanismsWithTime(s.mechanisms, timeSec),
    }));
  },

  setMechanisms: (mechanisms) => set({ mechanisms }),
}));
