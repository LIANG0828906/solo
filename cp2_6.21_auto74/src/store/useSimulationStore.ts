import { create } from 'zustand';
import type { IStellarBody, SimulationParams, ISnapshot, PresetType } from '@/utils/types';

interface SimulationState {
  bodies: IStellarBody[];
  selectedBodyId: string | null;
  params: SimulationParams;
  starFieldDensity: number;
  trajectoryLength: number;
  history: ISnapshot[];
  currentPreset: PresetType;
  collisionParticles: Array<{
    position: { x: number; y: number; z: number };
    velocity: { x: number; y: number; z: number };
    life: number;
    maxLife: number;
  }>;
  worker: Worker | null;
  isAddMode: boolean;

  initWorker: () => void;
  setSelectedBody: (id: string | null) => void;
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void;
  setStarFieldDensity: (density: number) => void;
  setTrajectoryLength: (length: number) => void;
  setBodies: (bodies: IStellarBody[]) => void;
  addBody: (body: IStellarBody) => void;
  removeBody: (id: string) => void;
  updateBodiesFromWorker: (bodies: IStellarBody[]) => void;
  updateParticles: (particles: SimulationState['collisionParticles']) => void;
  togglePause: () => void;
  saveSnapshot: () => void;
  loadSnapshot: (snapshot: ISnapshot) => void;
  undo: () => void;
  loadPreset: (preset: PresetType) => void;
  exportState: () => void;
  importState: (file: File) => Promise<void>;
  setAddMode: (active: boolean) => void;
  getBodyEnergy: (id: string) => {
    kinetic: number;
    potential: number;
    total: number;
  } | null;
}

const generateId = (): string => Math.random().toString(36).substr(2, 9);

const getColorByMass = (mass: number): string => {
  if (mass <= 10) return '#4488ff';
  if (mass <= 100) return '#ffaa44';
  return '#ff4444';
};

const getRadiusByMass = (mass: number): number => {
  return 0.3 + Math.log(mass) * 0.2;
};

const createPresets = (): Record<PresetType, IStellarBody[]> => {
  return {
    binary: [
      {
        id: generateId(),
        name: '恒星 A',
        mass: 100,
        position: { x: -10, y: 0, z: 0 },
        velocity: { x: 0, y: -1.5, z: 0 },
        color: '#ffaa44',
        radius: getRadiusByMass(100),
        trajectory: [],
      },
      {
        id: generateId(),
        name: '恒星 B',
        mass: 80,
        position: { x: 10, y: 0, z: 0 },
        velocity: { x: 0, y: 1.8, z: 0 },
        color: '#ffaa44',
        radius: getRadiusByMass(80),
        trajectory: [],
      },
    ],
    'three-body': [
      {
        id: generateId(),
        name: '天体 1',
        mass: 50,
        position: { x: 0, y: 10, z: 0 },
        velocity: { x: -1, y: 0, z: 0.5 },
        color: '#4488ff',
        radius: getRadiusByMass(50),
        trajectory: [],
      },
      {
        id: generateId(),
        name: '天体 2',
        mass: 50,
        position: { x: -8.66, y: -5, z: 0 },
        velocity: { x: 0.5, y: 0.866, z: -0.5 },
        color: '#4488ff',
        radius: getRadiusByMass(50),
        trajectory: [],
      },
      {
        id: generateId(),
        name: '天体 3',
        mass: 50,
        position: { x: 8.66, y: -5, z: 0 },
        velocity: { x: 0.5, y: -0.866, z: 0 },
        color: '#4488ff',
        radius: getRadiusByMass(50),
        trajectory: [],
      },
    ],
    'solar-system': [
      {
        id: generateId(),
        name: '太阳',
        mass: 300,
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        color: '#ff4444',
        radius: getRadiusByMass(300),
        trajectory: [],
      },
      {
        id: generateId(),
        name: '行星 1',
        mass: 5,
        position: { x: 12, y: 0, z: 0 },
        velocity: { x: 0, y: 3.5, z: 0 },
        color: '#4488ff',
        radius: getRadiusByMass(5),
        trajectory: [],
      },
      {
        id: generateId(),
        name: '行星 2',
        mass: 8,
        position: { x: 18, y: 0, z: 0 },
        velocity: { x: 0, y: 2.8, z: 0 },
        color: '#4488ff',
        radius: getRadiusByMass(8),
        trajectory: [],
      },
      {
        id: generateId(),
        name: '行星 3',
        mass: 15,
        position: { x: 25, y: 0, z: 0 },
        velocity: { x: 0, y: 2.3, z: 0 },
        color: '#ffaa44',
        radius: getRadiusByMass(15),
        trajectory: [],
      },
    ],
    'random-cluster': Array.from({ length: 8 }, (_, i) => {
      const mass = 10 + Math.random() * 200;
      const angle = (i / 8) * Math.PI * 2;
      const radius = 8 + Math.random() * 15;
      return {
        id: generateId(),
        name: `星团 ${i + 1}`,
        mass,
        position: {
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          z: (Math.random() - 0.5) * 10,
        },
        velocity: {
          x: -Math.sin(angle) * (1 + Math.random()),
          y: Math.cos(angle) * (1 + Math.random()),
          z: (Math.random() - 0.5) * 0.5,
        },
        color: getColorByMass(mass),
        radius: getRadiusByMass(mass),
        trajectory: [],
      };
    }),
  };
};

const presets = createPresets();

export const useSimulationStore = create<SimulationState>((set, get) => ({
  bodies: presets['three-body'],
  selectedBodyId: null,
  params: {
    G: 1.0,
    speed: 1.0,
    dt: 0.01,
    paused: false,
  },
  starFieldDensity: 100,
  trajectoryLength: 200,
  history: [],
  currentPreset: 'three-body',
  collisionParticles: [],
  worker: null,
  isAddMode: false,

  initWorker: () => {
    if (get().worker) return;

    const worker = new Worker(new URL('@/physics/webworker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (e) => {
      const { type, payload } = e.data;

      switch (type) {
        case 'initComplete':
        case 'bodyAdded':
        case 'bodyRemoved':
          get().updateBodiesFromWorker(payload.bodies);
          break;
        case 'stepComplete':
          get().updateBodiesFromWorker(payload.bodies);
          get().updateParticles(payload.particles);
          break;
      }
    };

    set({ worker });
    worker.postMessage({ type: 'init', payload: get().bodies });
    worker.postMessage({ type: 'setG', payload: get().params.G });
    worker.postMessage({ type: 'setTrajectoryLength', payload: get().trajectoryLength });
  },

  setSelectedBody: (id) => set({ selectedBodyId: id }),

  setParam: (key, value) => {
    const state = get();
    const newParams = { ...state.params, [key]: value };
    set({ params: newParams });

    if (key === 'G' && state.worker) {
      state.worker.postMessage({ type: 'setG', payload: value });
    }
  },

  setStarFieldDensity: (density) => set({ starFieldDensity: density }),

  setTrajectoryLength: (length) => {
    set({ trajectoryLength: length });
    const worker = get().worker;
    if (worker) {
      worker.postMessage({ type: 'setTrajectoryLength', payload: length });
    }
  },

  setBodies: (bodies) => {
    set({ bodies });
    const worker = get().worker;
    if (worker) {
      worker.postMessage({ type: 'init', payload: bodies });
    }
  },

  addBody: (body) => {
    const worker = get().worker;
    if (worker) {
      worker.postMessage({ type: 'addBody', payload: body });
    } else {
      set((state) => ({ bodies: [...state.bodies, body] }));
    }
  },

  removeBody: (id) => {
    const worker = get().worker;
    if (worker) {
      worker.postMessage({ type: 'removeBody', payload: id });
    } else {
      set((state) => ({
        bodies: state.bodies.filter((b) => b.id !== id),
        selectedBodyId: state.selectedBodyId === id ? null : state.selectedBodyId,
      }));
    }
  },

  updateBodiesFromWorker: (bodies) => {
    const selectedBodyId = get().selectedBodyId;
    if (selectedBodyId && !bodies.find((b) => b.id === selectedBodyId)) {
      set({ bodies, selectedBodyId: null });
    } else {
      set({ bodies });
    }
  },

  updateParticles: (particles) => set({ collisionParticles: particles }),

  togglePause: () =>
    set((state) => ({
      params: { ...state.params, paused: !state.params.paused },
    })),

  saveSnapshot: () => {
    const state = get();
    const snapshot: ISnapshot = {
      timestamp: Date.now(),
      bodies: JSON.parse(JSON.stringify(state.bodies)),
      params: { ...state.params },
    };

    const newHistory = [...state.history, snapshot].slice(-10);
    set({ history: newHistory });
  },

  loadSnapshot: (snapshot) => {
    set({
      bodies: JSON.parse(JSON.stringify(snapshot.bodies)),
      params: { ...snapshot.params },
    });
    const worker = get().worker;
    if (worker) {
      worker.postMessage({ type: 'init', payload: snapshot.bodies });
      worker.postMessage({ type: 'setG', payload: snapshot.params.G });
    }
  },

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;

    const previous = state.history[state.history.length - 1];
    const newHistory = state.history.slice(0, -1);

    set({
      history: newHistory,
      bodies: JSON.parse(JSON.stringify(previous.bodies)),
      params: { ...previous.params },
    });

    const worker = get().worker;
    if (worker) {
      worker.postMessage({ type: 'init', payload: previous.bodies });
      worker.postMessage({ type: 'setG', payload: previous.params.G });
    }
  },

  loadPreset: (preset) => {
    const newBodies = JSON.parse(JSON.stringify(presets[preset]));
    set({
      bodies: newBodies,
      currentPreset: preset,
      selectedBodyId: null,
    });
    const worker = get().worker;
    if (worker) {
      worker.postMessage({ type: 'init', payload: newBodies });
    }
  },

  exportState: () => {
    const state = get();
    const data = {
      timestamp: Date.now(),
      bodies: state.bodies,
      params: state.params,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nbody-snapshot-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importState: async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.bodies && data.params) {
        get().loadSnapshot(data);
      }
    } catch (e) {
      console.error('Failed to import state:', e);
    }
  },

  setAddMode: (active) => set({ isAddMode: active }),

  getBodyEnergy: (id) => {
    const state = get();
    const body = state.bodies.find((b) => b.id === id);
    if (!body) return null;

    let kinetic = 0;
    let potential = 0;

    const v = body.velocity;
    kinetic = 0.5 * body.mass * (v.x * v.x + v.y * v.y + v.z * v.z);

    for (const other of state.bodies) {
      if (other.id === id) continue;
      const dx = other.position.x - body.position.x;
      const dy = other.position.y - body.position.y;
      const dz = other.position.z - body.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist > 0) {
        potential -= (state.params.G * body.mass * other.mass) / dist;
      }
    }

    return {
      kinetic,
      potential,
      total: kinetic + potential,
    };
  },
}));
