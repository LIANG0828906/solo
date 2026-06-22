import { create } from 'zustand';
import type { GameState, LightJadeType, Gear } from '../types';
import { initialGears } from '../data/gears';
import { narrativesData } from '../data/narratives';
import { lightJadeTypes, lightJadeConfig } from '../data/lightJades';

const createInitialCollectedCount = (): Record<LightJadeType, number> => ({
  newMoon: 0,
  crescent: 0,
  firstQuarter: 0,
  gibbous: 0,
  fullMoon: 0,
});

const createInitialNarratives = () =>
  narrativesData.map((n) => ({ ...n, unlocked: false }));

const normalizeAngle = (angle: number): number => {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
};

const isAngleAligned = (current: number, target: number, tolerance: number = 10): boolean => {
  const diff = Math.abs(normalizeAngle(current) - normalizeAngle(target));
  return diff <= tolerance || diff >= 360 - tolerance;
};

export const useGameStore = create<GameState>((set, get) => ({
  lightJades: [],
  collectedCount: createInitialCollectedCount(),
  gears: initialGears,
  currentGearIndex: 0,
  isSpinning: false,
  speedMultiplier: 1,
  narratives: createInitialNarratives(),
  currentPhase: 0,
  selectedJade: null,
  showParticles: false,
  particlePosition: null,

  collectJade: (type: LightJadeType) => {
    const config = lightJadeConfig[type];
    const newJade = {
      id: `${type}-${Date.now()}`,
      type,
      name: config.name,
      color: config.color,
      collected: true,
      embedded: false,
    };

    set((state) => ({
      lightJades: [...state.lightJades, newJade],
      collectedCount: {
        ...state.collectedCount,
        [type]: state.collectedCount[type] + 1,
      },
    }));
  },

  embedJade: (gearId: number, jadeType: LightJadeType) => {
    const state = get();
    if (state.collectedCount[jadeType] <= 0) return;

    const gear = state.gears.find((g) => g.id === gearId);
    if (!gear || gear.hasJade) return;

    set((state) => ({
      gears: state.gears.map((g) =>
        g.id === gearId ? { ...g, hasJade: true, jadeType } : g
      ),
      collectedCount: {
        ...state.collectedCount,
        [jadeType]: state.collectedCount[jadeType] - 1,
      },
      lightJades: state.lightJades.map((j) =>
        j.type === jadeType && !j.embedded ? { ...j, embedded: true } : j
      ),
      selectedJade: null,
    }));
  },

  rotateGear: (gearId: number, direction: 1 | -1) => {
    const state = get();
    const gearIndex = state.gears.findIndex((g) => g.id === gearId);
    if (gearIndex === -1) return;

    const step = 15 * state.speedMultiplier;

    set((state) => {
      const newGears = [...state.gears];
      const gear = { ...newGears[gearIndex] };
      gear.rotation = normalizeAngle(gear.rotation + direction * step);
      gear.isCorrect = isAngleAligned(gear.rotation, gear.targetRotation);
      newGears[gearIndex] = gear;
      return { gears: newGears, currentGearIndex: gearIndex, isSpinning: true };
    });

    setTimeout(() => {
      set({ isSpinning: false });
    }, 300);
  },

  checkAlignment: (): boolean => {
    const state = get();
    const allHaveJade = state.gears.every((g) => g.hasJade);
    if (!allHaveJade) return false;

    const allAligned = state.gears.every((g) =>
      isAngleAligned(g.rotation, g.targetRotation)
    );
    return allAligned;
  },

  unlockNarrative: () => {
    const state = get();
    const nextPhase = state.currentPhase;

    set((state) => ({
      narratives: state.narratives.map((n) =>
        n.moonPhase === nextPhase ? { ...n, unlocked: true } : n
      ),
      currentPhase: nextPhase + 1,
    }));

    get().triggerParticles([0, 0, 0]);
  },

  resetGears: () => {
    set(() => ({
      gears: initialGears.map((g) => ({ ...g })),
      isSpinning: false,
    }));
  },

  setSpeed: (multiplier: number) => {
    set({ speedMultiplier: Math.max(0.5, Math.min(3, multiplier)) });
  },

  triggerParticles: (position: [number, number, number]) => {
    set({ showParticles: true, particlePosition: position });
    setTimeout(() => {
      set({ showParticles: false, particlePosition: null });
    }, 2000);
  },

  setSelectedJade: (type: LightJadeType | null) => {
    set({ selectedJade: type });
  },
}));
