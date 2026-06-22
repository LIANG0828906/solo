import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { GameState, Lens, BeamSegment, Particle, Point } from './types';
import generateLevel from './LevelGenerator';
import simulateBeam from './BeamEngine';

const FIREWORK_COLORS = ['#FF4500', '#FFD700', '#00FF00', '#00BFFF', '#FF1493', '#FF6347', '#7FFF00', '#9370DB'];

function createLens(): Lens {
  return {
    id: uuidv4(),
    position: { x: 0, y: 0 },
    angle: 0,
    radius: 15,
    placed: false,
  };
}

function normalizeAngle(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

export const useGameStore = create<GameState & {
  initLevel: () => void;
  placeLens: (lensId: string, position: Point) => void;
  rotateLens: (lensId: string, angle: number) => void;
  selectLens: (lensId: string | null) => void;
  updateParticles: () => void;
  triggerFireworks: (position: Point) => void;
  nextLevel: () => void;
  restartLevel: () => void;
  recalculateBeam: (canvasWidth: number, canvasHeight: number) => void;
}>((set, get) => ({
  level: 1,
  score: 0,
  stepsRemaining: 15,
  levelData: null,
  placedLenses: [],
  availableLenses: [],
  beamPath: [],
  particles: [],
  selectedLensId: null,
  levelComplete: false,
  fireworks: [],

  initLevel: () => {
    const { level } = get();
    const levelData = generateLevel(level);
    const availableLenses = Array.from({ length: 5 }, createLens);
    set({
      levelData,
      availableLenses,
      placedLenses: [],
      beamPath: [],
      particles: [],
      fireworks: [],
      selectedLensId: null,
      levelComplete: false,
      stepsRemaining: 15,
    });
    setTimeout(() => {
      const state = get();
      if (state.levelData) {
        const beam = simulateBeam(state.levelData, state.placedLenses, 480, 480);
        set({ beamPath: beam });
      }
    }, 0);
  },

  placeLens: (lensId: string, position: Point) => {
    const state = get();
    if (state.stepsRemaining <= 0 || state.levelComplete) return;

    const lensIndex = state.availableLenses.findIndex(l => l.id === lensId);
    if (lensIndex === -1) return;

    const lens = { ...state.availableLenses[lensIndex], position, placed: true };
    const newAvailable = state.availableLenses.filter(l => l.id !== lensId);
    const newPlaced = [...state.placedLenses, lens];

    let beamPath: BeamSegment[] = [];
    let levelComplete = false;
    if (state.levelData) {
      const newLevelData = { ...state.levelData, target: { ...state.levelData.target, hit: false } };
      beamPath = simulateBeam(newLevelData, newPlaced, 480, 480);
      levelComplete = newLevelData.target.hit;
    }

    set({
      availableLenses: newAvailable,
      placedLenses: newPlaced,
      stepsRemaining: state.stepsRemaining - 1,
      beamPath,
      levelComplete,
      selectedLensId: null,
    });

    if (levelComplete) {
      const finalState = get();
      if (finalState.levelData) {
        get().triggerFireworks(finalState.levelData.target.position);
        set({ score: finalState.score + finalState.stepsRemaining * 10 + 100 });
      }
    }
  },

  rotateLens: (lensId: string, angleDelta: number) => {
    const state = get();
    if (state.stepsRemaining <= 0 || state.levelComplete) return;

    const steps = Math.round(angleDelta / 5);
    if (steps === 0) return;
    const actualDelta = steps * 5;

    const newPlaced = state.placedLenses.map(lens =>
      lens.id === lensId ? { ...lens, angle: normalizeAngle(lens.angle + actualDelta) } : lens
    );

    let beamPath: BeamSegment[] = [];
    let levelComplete = false;
    if (state.levelData) {
      const newLevelData = { ...state.levelData, target: { ...state.levelData.target, hit: false } };
      beamPath = simulateBeam(newLevelData, newPlaced, 480, 480);
      levelComplete = newLevelData.target.hit;
    }

    set({
      placedLenses: newPlaced,
      stepsRemaining: state.stepsRemaining - 1,
      beamPath,
      levelComplete,
    });

    if (levelComplete) {
      const finalState = get();
      if (finalState.levelData) {
        get().triggerFireworks(finalState.levelData.target.position);
        set({ score: finalState.score + finalState.stepsRemaining * 10 + 100 });
      }
    }
  },

  selectLens: (lensId: string | null) => {
    set({ selectedLensId: lensId });
  },

  updateParticles: () => {
    const state = get();
    const newParticles = state.particles
      .map(p => ({
        ...p,
        position: { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y },
        opacity: p.opacity * 0.95,
        life: p.life - 1,
      }))
      .filter(p => p.life > 0 && p.opacity > 0.01);

    const newFireworks = state.fireworks
      .map(p => ({
        ...p,
        position: { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y },
        velocity: { x: p.velocity.x * 0.98, y: p.velocity.y * 0.98 + 0.05 },
        opacity: p.opacity * 0.97,
        life: p.life - 1,
      }))
      .filter(p => p.life > 0 && p.opacity > 0.01);

    set({ particles: newParticles, fireworks: newFireworks });
  },

  triggerFireworks: (position: Point) => {
    const fireworks: Particle[] = [];
    for (let i = 0; i < 200; i++) {
      const angle = (Math.PI * 2 * i) / 200 + Math.random() * 0.2;
      const speed = 2 + Math.random() * 4;
      fireworks.push({
        id: uuidv4(),
        position: { ...position },
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        color: FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)],
        size: 2 + Math.random() * 3,
        opacity: 1,
        life: 60 + Math.random() * 60,
      });
    }
    set({ fireworks });
  },

  nextLevel: () => {
    set(state => ({ level: state.level + 1 }));
    get().initLevel();
  },

  restartLevel: () => {
    get().initLevel();
  },

  recalculateBeam: (canvasWidth: number, canvasHeight: number) => {
    const state = get();
    if (!state.levelData) return;
    const newLevelData = { ...state.levelData, target: { ...state.levelData.target, hit: false } };
    const beamPath = simulateBeam(newLevelData, state.placedLenses, canvasWidth, canvasHeight);
    set({ beamPath, levelComplete: newLevelData.target.hit });
  },
}));
