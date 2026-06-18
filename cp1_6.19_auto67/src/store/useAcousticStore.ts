import { create } from 'zustand';
import {
  Vector3,
  SoundSource,
  Listener,
  Obstacle,
  SoundWave,
  ReflectionLine,
  DiffractionArc,
  RT60DataPoint,
  MaterialType,
  AcousticState,
} from '../types/acoustic';
import { vec3, vec3Scale, generateId, clamp } from '../utils/mathUtils';
import { AcousticEngine } from '../acousticEngine';

const DEFAULT_ROOM_SIZE: Vector3 = { x: 8, y: 6, z: 3 };
const MAX_OBSTACLES = 6;

interface AcousticStore extends AcousticState {
  engine: AcousticEngine;
  setSelectedObject: (id: string | null, type: 'source' | 'listener' | 'obstacle' | null) => void;
  setAddMode: (mode: 'source' | 'listener' | 'obstacle' | null) => void;
  addSoundSource: (pos: Vector3) => void;
  moveSoundSource: (id: string, pos: Vector3) => void;
  removeSoundSource: (id: string) => void;
  addListener: (pos: Vector3) => void;
  moveListener: (id: string, pos: Vector3) => void;
  removeListener: (id: string) => void;
  addObstacle: (pos: Vector3, size?: Vector3, material?: MaterialType) => void;
  updateObstacle: (id: string, updates: Partial<Obstacle>) => void;
  removeObstacle: (id: string) => void;
  setCameraPosition: (pos: Vector3) => void;
  setShowDecayDetail: (show: boolean, frequency?: number) => void;
  update: (deltaTime: number) => void;
  resetScene: () => void;
}

const createInitialSources = (): SoundSource[] => [
  {
    id: generateId(),
    position: vec3(2, 1.5, 1.5),
    radius: 0.15,
    frequency: 1000,
    power: 100,
  },
];

const createInitialListeners = (): Listener[] => [
  {
    id: generateId(),
    position: vec3(6, 1.5, 1.5),
    dbValue: 60,
    displayDbValue: 60,
  },
];

const createInitialObstacles = (): Obstacle[] => [
  {
    id: generateId(),
    position: vec3(4, 1, 1.5),
    size: vec3(2, 2, 0.3),
    material: 'concrete',
  },
];

export const useAcousticStore = create<AcousticStore>((set, get) => ({
  roomSize: DEFAULT_ROOM_SIZE,
  soundSources: createInitialSources(),
  listeners: createInitialListeners(),
  obstacles: createInitialObstacles(),
  soundWaves: [],
  reflectionLines: [],
  diffractionArcs: [],
  rt60Data: [],
  selectedObjectId: null,
  selectedObjectType: null,
  addMode: null,
  cameraPosition: vec3(6, 4, 8),
  showDecayDetail: false,
  selectedFrequency: 1000,
  engine: new AcousticEngine(DEFAULT_ROOM_SIZE),

  setSelectedObject: (id, type) => set({ selectedObjectId: id, selectedObjectType: type }),

  setAddMode: (mode) => set({ addMode: mode, selectedObjectId: null, selectedObjectType: null }),

  addSoundSource: (pos) => {
    const state = get();
    const halfRoom = vec3Scale(state.roomSize, 0.5);
    const clampedPos = vec3(
      clamp(pos.x, 0.2, state.roomSize.x - 0.2),
      clamp(pos.y, 0.2, state.roomSize.y - 0.2),
      clamp(pos.z, 0.2, state.roomSize.z - 0.2)
    );
    const newSource: SoundSource = {
      id: generateId(),
      position: clampedPos,
      radius: 0.15,
      frequency: 1000,
      power: 100,
    };
    set({
      soundSources: [...state.soundSources, newSource],
      addMode: null,
      selectedObjectId: newSource.id,
      selectedObjectType: 'source',
    });
  },

  moveSoundSource: (id, pos) => {
    const state = get();
    const clampedPos = vec3(
      clamp(pos.x, 0.2, state.roomSize.x - 0.2),
      clamp(pos.y, 0.2, state.roomSize.y - 0.2),
      clamp(pos.z, 0.2, state.roomSize.z - 0.2)
    );
    set({
      soundSources: state.soundSources.map((s) =>
        s.id === id ? { ...s, position: clampedPos } : s
      ),
    });
  },

  removeSoundSource: (id) => {
    const state = get();
    set({
      soundSources: state.soundSources.filter((s) => s.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      selectedObjectType: state.selectedObjectId === id ? null : state.selectedObjectType,
    });
  },

  addListener: (pos) => {
    const state = get();
    const clampedPos = vec3(
      clamp(pos.x, 0.2, state.roomSize.x - 0.2),
      clamp(pos.y, 0.2, state.roomSize.y - 0.2),
      clamp(pos.z, 0.2, state.roomSize.z - 0.2)
    );
    const newListener: Listener = {
      id: generateId(),
      position: clampedPos,
      dbValue: 60,
      displayDbValue: 60,
    };
    set({
      listeners: [...state.listeners, newListener],
      addMode: null,
      selectedObjectId: newListener.id,
      selectedObjectType: 'listener',
    });
  },

  moveListener: (id, pos) => {
    const state = get();
    const clampedPos = vec3(
      clamp(pos.x, 0.2, state.roomSize.x - 0.2),
      clamp(pos.y, 0.2, state.roomSize.y - 0.2),
      clamp(pos.z, 0.2, state.roomSize.z - 0.2)
    );
    set({
      listeners: state.listeners.map((l) =>
        l.id === id ? { ...l, position: clampedPos } : l
      ),
    });
  },

  removeListener: (id) => {
    const state = get();
    set({
      listeners: state.listeners.filter((l) => l.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      selectedObjectType: state.selectedObjectId === id ? null : state.selectedObjectType,
    });
  },

  addObstacle: (pos, size = vec3(1, 1.5, 1), material = 'concrete') => {
    const state = get();
    if (state.obstacles.length >= MAX_OBSTACLES) return;

    const halfSize = vec3Scale(size, 0.5);
    const clampedPos = vec3(
      clamp(pos.x, halfSize.x, state.roomSize.x - halfSize.x),
      clamp(pos.y, halfSize.y, state.roomSize.y - halfSize.y),
      clamp(pos.z, halfSize.z, state.roomSize.z - halfSize.z)
    );

    const newObstacle: Obstacle = {
      id: generateId(),
      position: clampedPos,
      size,
      material,
    };
    set({
      obstacles: [...state.obstacles, newObstacle],
      addMode: null,
      selectedObjectId: newObstacle.id,
      selectedObjectType: 'obstacle',
    });
  },

  updateObstacle: (id, updates) => {
    const state = get();
    set({
      obstacles: state.obstacles.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    });
  },

  removeObstacle: (id) => {
    const state = get();
    set({
      obstacles: state.obstacles.filter((o) => o.id !== id),
      selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
      selectedObjectType: state.selectedObjectId === id ? null : state.selectedObjectType,
    });
  },

  setCameraPosition: (pos) => set({ cameraPosition: pos }),

  setShowDecayDetail: (show, frequency) =>
    set({ showDecayDetail: show, selectedFrequency: frequency ?? get().selectedFrequency }),

  update: (deltaTime) => {
    const state = get();
    const result = state.engine.update(
      deltaTime,
      state.soundSources,
      state.listeners,
      state.obstacles,
      state.soundWaves,
      state.reflectionLines,
      state.diffractionArcs
    );

    const updates: Partial<AcousticState> = {
      soundWaves: result.waves,
      reflectionLines: result.reflections,
      diffractionArcs: result.diffractions,
      listeners: result.updatedListeners,
    };

    if (result.rt60Data.length > 0) {
      updates.rt60Data = result.rt60Data;
    }

    set(updates as AcousticState);
  },

  resetScene: () => {
    set({
      soundSources: createInitialSources(),
      listeners: createInitialListeners(),
      obstacles: createInitialObstacles(),
      soundWaves: [],
      reflectionLines: [],
      diffractionArcs: [],
      selectedObjectId: null,
      selectedObjectType: null,
      addMode: null,
    });
    get().engine.setRoomSize(DEFAULT_ROOM_SIZE);
  },
}));
