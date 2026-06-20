import { create } from 'zustand';

export type GeometryType = 'cube' | 'sphere' | 'cone' | 'torus' | 'cylinder';
export type ColorPreset = '#FF6B6B' | '#4FC3F7' | '#FFD93D' | '#6BCB77' | '#A66CFF';
export type TransformType = 'move' | 'scale' | 'rotate';
export type RotationAxis = 'x' | 'y' | 'z';

export interface CommandAction {
  id: string;
  timestamp: number;
  type: 'create' | 'transform';
  objectId?: string;
  geometryType?: GeometryType;
  color?: ColorPreset;
  transformType?: TransformType;
  transformData?: {
    offset?: { x: number; y: number; z: number };
    scale?: number;
    rotationAxis?: RotationAxis;
    rotationSpeed?: number;
  };
  originalText: string;
}

export interface SceneObject {
  id: string;
  type: GeometryType;
  color: ColorPreset;
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  scale: number;
  targetScale: number;
  rotation: { x: number; y: number; z: number };
  rotationSpeed: { x: number; y: number; z: number };
  isSpawning: boolean;
  spawnProgress: number;
  spawnDirection: { x: number; y: number; z: number };
  activeTransform: TransformType | null;
  transformIntensity: number;
}

export interface ReplayState {
  isPlaying: boolean;
  speed: 1 | 2;
  currentTime: number;
  totalDuration: number;
}

interface SceneState {
  objects: SceneObject[];
  selectedObjectId: string | null;
  isRecording: boolean;
  currentCommandText: string;
  errorMessage: string | null;
  errorTimeoutId: number | null;
  commandHistory: CommandAction[];
  replay: ReplayState;
  focusTarget: { x: number; y: number; z: number } | null;

  addObject: (obj: Omit<SceneObject, 'id' | 'isSpawning' | 'spawnProgress' | 'spawnDirection' | 'activeTransform' | 'transformIntensity'> & { id?: string }) => string;
  removeAllObjects: () => void;
  selectObject: (id: string | null) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  setRecording: (recording: boolean) => void;
  setCurrentCommand: (text: string) => void;
  showError: (message: string) => void;
  clearError: () => void;
  addCommandToHistory: (command: CommandAction) => void;
  clearHistory: () => void;
  setReplay: (replay: Partial<ReplayState>) => void;
  setFocusTarget: (target: { x: number; y: number; z: number } | null) => void;
}

const COLORS: ColorPreset[] = ['#FF6B6B', '#4FC3F7', '#FFD93D', '#6BCB77', '#A66CFF'];

const generateId = () => Math.random().toString(36).substring(2, 11);

const getNextPosition = (existingObjects: SceneObject[]): { x: number; y: number; z: number } => {
  const count = existingObjects.length;
  if (count === 0) return { x: 0, y: 0.5, z: 0 };

  const radius = 2.5;
  const angle = (count - 1) * (2 * Math.PI / 8);
  const ring = Math.floor((count - 1) / 8);
  const ringRadius = radius + ring * 2.5;
  const x = Math.cos(angle) * ringRadius;
  const z = Math.sin(angle) * ringRadius;

  return { x, y: 0.5 + ring * 0.1, z };
};

const getRandomSpawnDirection = () => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);
  const distance = 15;
  return {
    x: Math.sin(phi) * Math.cos(theta) * distance,
    y: Math.abs(Math.sin(phi) * Math.sin(theta)) * distance + 5,
    z: Math.cos(phi) * distance,
  };
};

export const useSceneStore = create<SceneState>((set, get) => ({
  objects: [],
  selectedObjectId: null,
  isRecording: false,
  currentCommandText: '',
  errorMessage: null,
  errorTimeoutId: null,
  commandHistory: [],
  replay: {
    isPlaying: false,
    speed: 1,
    currentTime: 0,
    totalDuration: 0,
  },
  focusTarget: null,

  addObject: (objData) => {
    const id = objData.id || generateId();
    const objects = get().objects;
    const targetPosition = objData.targetPosition || getNextPosition(objects);
    const spawnDirection = getRandomSpawnDirection();

    const newObject: SceneObject = {
      id,
      type: objData.type,
      color: objData.color || COLORS[Math.floor(Math.random() * COLORS.length)],
      position: { ...spawnDirection },
      targetPosition,
      scale: objData.scale || 1,
      targetScale: objData.targetScale || objData.scale || 1,
      rotation: objData.rotation || { x: 0, y: 0, z: 0 },
      rotationSpeed: objData.rotationSpeed || { x: 0, y: 0, z: 0 },
      isSpawning: true,
      spawnProgress: 0,
      spawnDirection,
      activeTransform: null,
      transformIntensity: 0,
    };

    set({ objects: [...objects, newObject] });
    return id;
  },

  removeAllObjects: () => {
    set({ objects: [], selectedObjectId: null, focusTarget: null });
    get().clearHistory();
  },

  selectObject: (id) => set({ selectedObjectId: id }),

  updateObject: (id, updates) => {
    set({
      objects: get().objects.map((obj) =>
        obj.id === id ? { ...obj, ...updates } : obj
      ),
    });
  },

  setRecording: (recording) => set({ isRecording: recording }),

  setCurrentCommand: (text) => set({ currentCommandText: text }),

  showError: (message) => {
    const { errorTimeoutId } = get();
    if (errorTimeoutId !== null) {
      window.clearTimeout(errorTimeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      set({ errorMessage: null, errorTimeoutId: null });
    }, 2000);

    set({ errorMessage: message, errorTimeoutId: timeoutId });
  },

  clearError: () => {
    const { errorTimeoutId } = get();
    if (errorTimeoutId !== null) {
      window.clearTimeout(errorTimeoutId);
    }
    set({ errorMessage: null, errorTimeoutId: null });
  },

  addCommandToHistory: (command) => {
    const history = get().commandHistory;
    set({ commandHistory: [...history, command] });
  },

  clearHistory: () => {
    set({
      commandHistory: [],
      replay: {
        isPlaying: false,
        speed: get().replay.speed,
        currentTime: 0,
        totalDuration: 0,
      },
    });
  },

  setReplay: (replay) => {
    set({ replay: { ...get().replay, ...replay } });
  },

  setFocusTarget: (target) => set({ focusTarget: target }),
}));

export { COLORS };
