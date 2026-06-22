import { create } from 'zustand';
import type {
  GameState,
  Mechanism,
  LevelConfig,
  LightSegment,
} from '@/types/game';
import { levels, mechanismsToRecord } from '@/utils/levels';
import { traceLightRays } from '@/utils/rayTracer';

interface GameStore extends GameState {
  loadLevel: (levelId: number) => void;
  resetLevel: () => void;
  selectMechanism: (id: string | null) => void;
  updateMechanismRotation: (id: string, rotation: number) => void;
  incrementSteps: () => void;
  setCompleted: (val: boolean) => void;
  setPathBroken: (val: boolean) => void;
  setVictoryAnimating: (val: boolean) => void;
  nextLevel: () => void;
  recalculateLightPath: () => void;

  pendingRotation: Record<string, number>;
  setPendingRotation: (id: string, rotation: number | null) => void;
  commitPendingRotation: (id: string) => void;
  revertPendingRotation: (id: string) => void;
}

function normalizeRotation(rotation: number): number {
  let r = rotation % 360;
  if (r < 0) r += 360;
  return r;
}

function findLevelIndexById(id: string): number {
  return levels.findIndex((l) => l.id === id);
}

function getInitialMechanisms(): Record<string, Mechanism> {
  const ms = levels[0].mechanisms;
  return Object.fromEntries(ms.map((m) => [m.id, { ...m }]));
}

function getInitialLightPath(): LightSegment[] {
  const level = levels[0];
  const mechanismsArray = Object.values(getInitialMechanisms());
  const { segments } = traceLightRays(
    level.emitter,
    level.walls,
    mechanismsArray,
    level.sensor
  );
  return segments;
}

export const useGameStore = create<GameStore>((set, get) => ({
  currentLevel: levels[0].id,
  steps: 0,
  selectedMechanismId: null,
  mechanisms: getInitialMechanisms(),
  lightPath: getInitialLightPath(),
  isCompleted: false,
  isPathBroken: false,
  isVictoryAnimating: false,
  pendingRotation: {},

  loadLevel: (levelId: number): void => {
    if (levelId < 0 || levelId >= levels.length) return;
    const level: LevelConfig = levels[levelId];
    const mechanisms: Record<string, Mechanism> = Object.fromEntries(
      level.mechanisms.map((m: Mechanism) => [m.id, { ...m }])
    );
    const mechanismsArray: Mechanism[] = Object.values(mechanisms);
    const { segments } = traceLightRays(
      level.emitter,
      level.walls,
      mechanismsArray,
      level.sensor
    );
    set({
      currentLevel: level.id,
      steps: 0,
      selectedMechanismId: null,
      mechanisms,
      lightPath: segments,
      isCompleted: false,
      isPathBroken: false,
      isVictoryAnimating: false,
      pendingRotation: {},
    });
  },

  resetLevel: (): void => {
    const state = get();
    const idx: number = findLevelIndexById(state.currentLevel);
    if (idx >= 0) {
      state.loadLevel(idx);
    }
  },

  selectMechanism: (id: string | null): void => {
    set({ selectedMechanismId: id });
  },

  updateMechanismRotation: (id: string, rotation: number): void => {
    const state = get();
    const mech: Mechanism | undefined = state.mechanisms[id];
    if (!mech) return;
    const normalized: number = normalizeRotation(rotation);
    set({
      mechanisms: {
        ...state.mechanisms,
        [id]: { ...mech, rotation: normalized },
      },
    });
  },

  incrementSteps: (): void => {
    set((state) => ({ steps: state.steps + 1 }));
  },

  setCompleted: (val: boolean): void => {
    set({ isCompleted: val });
  },

  setPathBroken: (val: boolean): void => {
    set({ isPathBroken: val });
  },

  setVictoryAnimating: (val: boolean): void => {
    set({ isVictoryAnimating: val });
  },

  nextLevel: (): void => {
    const state = get();
    const currentIdx: number = findLevelIndexById(state.currentLevel);
    if (currentIdx >= 0 && currentIdx + 1 < levels.length) {
      state.loadLevel(currentIdx + 1);
    }
  },

  recalculateLightPath: (): void => {
    const state = get();
    const levelIdx: number = findLevelIndexById(state.currentLevel);
    if (levelIdx < 0) return;
    const level: LevelConfig = levels[levelIdx];
    const mechanismsArray: Mechanism[] = Object.values(state.mechanisms);
    const { segments, reachedSensor } = traceLightRays(
      level.emitter,
      level.walls,
      mechanismsArray,
      level.sensor
    );

    let pathBroken: boolean = false;
    if (!reachedSensor && segments.length > 0) {
      const lastSeg: LightSegment = segments[segments.length - 1];
      const bounds = {
        minX: -level.mazeSize.x / 2 - 10,
        maxX: level.mazeSize.x / 2 + 10,
        minZ: -level.mazeSize.z / 2 - 10,
        maxZ: level.mazeSize.z / 2 + 10,
        minY: -10,
        maxY: level.mazeSize.y + 10,
      };
      const ep = lastSeg.end;
      if (
        ep.x < bounds.minX ||
        ep.x > bounds.maxX ||
        ep.z < bounds.minZ ||
        ep.z > bounds.maxZ ||
        ep.y < bounds.minY ||
        ep.y > bounds.maxY
      ) {
        pathBroken = true;
      }
    }

    set({
      lightPath: segments,
      isCompleted: reachedSensor,
      isPathBroken: reachedSensor ? false : pathBroken,
    });
  },

  setPendingRotation: (id: string, rotation: number | null): void => {
    const state = get();
    if (rotation === null) {
      const newPending: Record<string, number> = { ...state.pendingRotation };
      delete newPending[id];
      set({ pendingRotation: newPending });
    } else {
      set({
        pendingRotation: {
          ...state.pendingRotation,
          [id]: normalizeRotation(rotation),
        },
      });
    }
  },

  commitPendingRotation: (id: string): void => {
    const state = get();
    const pendingRot: number | undefined = state.pendingRotation[id];
    if (pendingRot === undefined) return;
    const mech: Mechanism | undefined = state.mechanisms[id];
    if (!mech) return;
    const newPending: Record<string, number> = { ...state.pendingRotation };
    delete newPending[id];
    set({
      mechanisms: {
        ...state.mechanisms,
        [id]: { ...mech, rotation: pendingRot },
      },
      pendingRotation: newPending,
    });
  },

  revertPendingRotation: (id: string): void => {
    const state = get();
    const newPending: Record<string, number> = { ...state.pendingRotation };
    delete newPending[id];
    set({ pendingRotation: newPending });
  },
}));
