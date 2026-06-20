import { create } from "zustand";
import {
  Unit,
  UnitType,
  FormationType,
  RecordFrame,
  UNIT_COUNTS,
} from "./types";

interface StoreState {
  units: Unit[];
  currentFormation: FormationType | null;
  score: number;
  transformationTime: number;
  recordedFrames: RecordFrame[];
  isRecording: boolean;
  isPlaying: boolean;
  playhead: number;
  playSpeed: number;
  matchPercentage: number;
  remainingUnits: Record<UnitType, number>;
  setUnits: (units: Unit[]) => void;
  addUnit: (unit: Unit) => void;
  updateUnit: (id: string, updates: Partial<Unit>) => void;
  removeUnit: (id: string) => void;
  setCurrentFormation: (formation: FormationType | null) => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  setTransformationTime: (time: number) => void;
  addRecordFrame: (frame: RecordFrame) => void;
  setIsRecording: (recording: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlayhead: (position: number) => void;
  setPlaySpeed: (speed: number) => void;
  setMatchPercentage: (percentage: number) => void;
  setRemainingUnits: (type: UnitType, count: number) => void;
  resetRemainingUnits: () => void;
  clearRecordedFrames: () => void;
  resetAll: () => void;
}

export const useStore = create<StoreState>((set) => ({
  units: [],
  currentFormation: null,
  score: 0,
  transformationTime: 0,
  recordedFrames: [],
  isRecording: false,
  isPlaying: false,
  playhead: 0,
  playSpeed: 1,
  matchPercentage: 0,
  remainingUnits: { ...UNIT_COUNTS },
  setUnits: (units) => set({ units }),
  addUnit: (unit) =>
    set((state) => ({ units: [...state.units, unit] })),
  updateUnit: (id, updates) =>
    set((state) => ({
      units: state.units.map((u) =>
        u.id === id ? { ...u, ...updates } : u
      ),
    })),
  removeUnit: (id) =>
    set((state) => ({ units: state.units.filter((u) => u.id !== id) })),
  setCurrentFormation: (formation) => set({ currentFormation: formation }),
  setScore: (score) => set({ score }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setTransformationTime: (time) => set({ transformationTime: time }),
  addRecordFrame: (frame) =>
    set((state) => ({
      recordedFrames: [...state.recordedFrames, frame],
    })),
  setIsRecording: (recording) => set({ isRecording: recording }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlayhead: (position) => set({ playhead: position }),
  setPlaySpeed: (speed) => set({ playSpeed: speed }),
  setMatchPercentage: (percentage) => set({ matchPercentage: percentage }),
  setRemainingUnits: (type, count) =>
    set((state) => ({
      remainingUnits: { ...state.remainingUnits, [type]: count },
    })),
  resetRemainingUnits: () => set({ remainingUnits: { ...UNIT_COUNTS } }),
  clearRecordedFrames: () => set({ recordedFrames: [], playhead: 0 }),
  resetAll: () =>
    set({
      units: [],
      currentFormation: null,
      score: 0,
      transformationTime: 0,
      recordedFrames: [],
      isRecording: false,
      isPlaying: false,
      playhead: 0,
      playSpeed: 1,
      matchPercentage: 0,
      remainingUnits: { ...UNIT_COUNTS },
    }),
}));

export function isInRiver(x: number, z: number): boolean {
  const riverStart = { x: 2, z: 3 };
  const riverEnd = { x: 8, z: 7 };
  const riverWidth = 0.5;

  const dx = riverEnd.x - riverStart.x;
  const dz = riverEnd.z - riverStart.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const t = Math.max(
    0,
    Math.min(
      1,
      ((x - riverStart.x) * dx + (z - riverStart.z) * dz) / (length * length)
    )
  );
  const closestX = riverStart.x + t * dx;
  const closestZ = riverStart.z + t * dz;
  const distance = Math.sqrt(
    Math.pow(x - closestX, 2) + Math.pow(z - closestZ, 2)
  );
  return distance < riverWidth;
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function getFormationPositions(
  formation: FormationType,
  units: Unit[]
): Map<string, { x: number; z: number }> {
  const centerX = 5;
  const centerZ = 5;
  const positions = new Map<string, { x: number; z: number }>();

  const chariots = units.filter((u) => u.type === UnitType.CHARIOT);
  const infantries = units.filter((u) => u.type === UnitType.INFANTRY);
  const archers = units.filter((u) => u.type === UnitType.ARCHER);
  const cavalries = units.filter((u) => u.type === UnitType.CAVALRY);

  if (formation === FormationType.SQUARE) {
    const outerRadius = 3.5;
    const innerRadius = 2;
    const centerRadius = 0.8;

    chariots.forEach((unit, i) => {
      const angle = (i / chariots.length) * Math.PI * 2;
      positions.set(unit.id, {
        x: centerX + Math.cos(angle) * outerRadius,
        z: centerZ + Math.sin(angle) * outerRadius,
      });
    });

    archers.forEach((unit, i) => {
      const angle = (i / archers.length) * Math.PI * 2;
      positions.set(unit.id, {
        x: centerX + Math.cos(angle) * innerRadius,
        z: centerZ + Math.sin(angle) * innerRadius,
      });
    });

    infantries.forEach((unit, i) => {
      const angle = (i / infantries.length) * Math.PI * 2;
      positions.set(unit.id, {
        x: centerX + Math.cos(angle) * centerRadius,
        z: centerZ + Math.sin(angle) * centerRadius,
      });
    });

    cavalries.forEach((unit, i) => {
      const angle = (i / cavalries.length) * Math.PI * 2 + Math.PI / 4;
      positions.set(unit.id, {
        x: centerX + Math.cos(angle) * (outerRadius + 0.5),
        z: centerZ + Math.sin(angle) * (outerRadius + 0.5),
      });
    });
  } else if (formation === FormationType.GOOSE) {
    const vDepth = 4;
    const wingSpread = 3;

    chariots.forEach((unit, i) => {
      const t = i / (chariots.length - 1 || 1);
      const x = centerX - vDepth / 2 + t * vDepth;
      const zOffset = (t - 0.5) * wingSpread * 2;
      positions.set(unit.id, { x, z: centerZ + zOffset });
    });

    cavalries.forEach((unit, i) => {
      const side = i < cavalries.length / 2 ? -1 : 1;
      const offset = (i % Math.ceil(cavalries.length / 2)) * 0.8;
      positions.set(unit.id, {
        x: centerX - vDepth / 2 - 0.5 - offset,
        z: centerZ + side * (wingSpread + 0.5 + offset * 0.5),
      });
    });

    infantries.forEach((unit, i) => {
      const t = i / (infantries.length - 1 || 1);
      positions.set(unit.id, {
        x: centerX + vDepth / 2 + 0.5,
        z: centerZ - 1.5 + t * 3,
      });
    });

    archers.forEach((unit, i) => {
      const t = i / (archers.length - 1 || 1);
      positions.set(unit.id, {
        x: centerX + vDepth / 2 + 1.5,
        z: centerZ - 1 + t * 2,
      });
    });
  } else if (formation === FormationType.ARROW) {
    const arrowLength = 5;
    const arrowWidth = 3;

    chariots.forEach((unit, i) => {
      const t = i / (chariots.length - 1 || 1);
      const width = t * arrowWidth;
      positions.set(unit.id, {
        x: centerX - arrowLength / 2 + t * arrowLength,
        z: centerZ - width / 2 + (i % 2) * width,
      });
    });

    cavalries.forEach((unit, i) => {
      const t = (i + 1) / (cavalries.length + 1);
      positions.set(unit.id, {
        x: centerX - arrowLength / 2 + 0.5 + t * (arrowLength - 1),
        z: centerZ,
      });
    });

    archers.forEach((unit, i) => {
      const side = i < archers.length / 2 ? -1 : 1;
      const offset = (i % Math.ceil(archers.length / 2)) * 0.8;
      positions.set(unit.id, {
        x: centerX + arrowLength / 2 - 1 - offset,
        z: centerZ + side * (arrowWidth / 2 + 0.3),
      });
    });

    infantries.forEach((unit, i) => {
      const t = i / (infantries.length - 1 || 1);
      positions.set(unit.id, {
        x: centerX + arrowLength / 2 + 0.5,
        z: centerZ - 1.5 + t * 3,
      });
    });
  }

  return positions;
}

export function calculateMatchPercentage(
  units: Unit[],
  formation: FormationType | null
): number {
  if (!formation || units.length === 0) return 0;

  const targetPositions = getFormationPositions(formation, units);
  let matched = 0;
  let total = 0;

  units.forEach((unit) => {
    const target = targetPositions.get(unit.id);
    if (target) {
      total++;
      const distance = Math.sqrt(
        Math.pow(unit.x - target.x, 2) + Math.pow(unit.z - target.z, 2)
      );
      if (distance < 0.5) {
        matched++;
      }
    }
  });

  return total > 0 ? (matched / total) * 100 : 0;
}

export function calculateTransformationTime(
  units: Unit[],
  targetPositions: Map<string, { x: number; z: number }>
): number {
  let totalDistance = 0;
  units.forEach((unit) => {
    const target = targetPositions.get(unit.id);
    if (target) {
      const distance = Math.sqrt(
        Math.pow(unit.x - target.x, 2) +
          Math.pow(unit.z - target.z, 2)
      );
      totalDistance += distance;
    }
  });
  return totalDistance * 0.3;
}
