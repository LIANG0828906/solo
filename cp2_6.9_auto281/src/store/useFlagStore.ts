import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { FlagData, PathData } from '../types';
import { getRandomFlagColor } from '../utils/colors';
import { getTerrainHeight, clampToTerrainBounds } from '../utils/terrain';

const MAX_FLAGS = 15;
const PATH_SAMPLE_POINTS = 60;

interface FlagStore {
  flags: FlagData[];
  paths: PathData[];
  selectedFlags: string[];
  addFlag: (position: [number, number, number]) => void;
  removeFlag: (id: string) => void;
  toggleSelectFlag: (id: string) => void;
  generatePath: () => void;
  reset: () => void;
}

const samplePathPoints = (
  start: [number, number, number],
  end: [number, number, number]
): [number, number, number][] => {
  const points: [number, number, number][] = [];

  const midX = (start[0] + end[0]) / 2 + (Math.random() - 0.5) * 4;
  const midZ = (start[2] + end[2]) / 2 + (Math.random() - 0.5) * 4;
  const midY = getTerrainHeight(midX, midZ) + 0.1;

  for (let i = 0; i <= PATH_SAMPLE_POINTS; i++) {
    const t = i / PATH_SAMPLE_POINTS;
    const mt = 1 - t;

    const x = mt * mt * start[0] + 2 * mt * t * midX + t * t * end[0];
    const z = mt * mt * start[2] + 2 * mt * t * midZ + t * t * end[2];

    const clamped = clampToTerrainBounds(x, z);
    const y = getTerrainHeight(clamped.x, clamped.z) + 0.1;

    points.push([clamped.x, y, clamped.z]);
  }

  return points;
};

export const useFlagStore = create<FlagStore>((set, get) => ({
  flags: [],
  paths: [],
  selectedFlags: [],

  addFlag: (position) => {
    const { flags } = get();
    if (flags.length >= MAX_FLAGS) return;

    const clamped = clampToTerrainBounds(position[0], position[2]);
    const terrainHeight = getTerrainHeight(clamped.x, clamped.z);

    const newFlag: FlagData = {
      id: uuidv4(),
      position: [clamped.x, terrainHeight, clamped.z],
      color: getRandomFlagColor(),
      index: flags.length + 1,
    };

    set({ flags: [...flags, newFlag] });
  },

  removeFlag: (id) => {
    const { flags, paths, selectedFlags } = get();
    const newFlags = flags.filter((f) => f.id !== id);
    const reindexedFlags = newFlags.map((f, idx) => ({ ...f, index: idx + 1 }));
    const newPaths = paths.filter(
      (p) => p.startFlagId !== id && p.endFlagId !== id
    );
    const newSelectedFlags = selectedFlags.filter((fid) => fid !== id);

    set({
      flags: reindexedFlags,
      paths: newPaths,
      selectedFlags: newSelectedFlags,
    });
  },

  toggleSelectFlag: (id) => {
    const { selectedFlags } = get();

    if (selectedFlags.includes(id)) {
      set({ selectedFlags: selectedFlags.filter((fid) => fid !== id) });
    } else if (selectedFlags.length < 2) {
      set({ selectedFlags: [...selectedFlags, id] });
    } else {
      set({ selectedFlags: [selectedFlags[1], id] });
    }
  },

  generatePath: () => {
    const { selectedFlags, flags, paths } = get();
    if (selectedFlags.length !== 2) return;

    const startFlag = flags.find((f) => f.id === selectedFlags[0]);
    const endFlag = flags.find((f) => f.id === selectedFlags[1]);

    if (!startFlag || !endFlag) return;

    const points = samplePathPoints(startFlag.position, endFlag.position);

    const newPath: PathData = {
      id: uuidv4(),
      startFlagId: selectedFlags[0],
      endFlagId: selectedFlags[1],
      points,
    };

    set({
      paths: [...paths, newPath],
      selectedFlags: [],
    });
  },

  reset: () => {
    set({
      flags: [],
      paths: [],
      selectedFlags: [],
    });
  },
}));
