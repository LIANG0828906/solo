import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  previousPosition: { x: number; y: number };
  mass: number;
  radius: number;
  color: string;
}

export type SimulationMode = 'free' | 'stable' | 'demo';

const PLANET_COLORS = ['#FF4466', '#44AAFF', '#88FF44', '#FFAA44', '#CC44FF'];
const STAR_COLOR = '#FF8800';

const generatePlanetName = (index: number): string => {
  const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
  const suffixes = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  return `${prefixes[index % prefixes.length]} ${suffixes[Math.floor(index / prefixes.length) % suffixes.length]}`;
};

const generateStarName = (index: number): string => {
  const names = ['Sol', 'Sirius', 'Vega', 'Polaris', 'Antares', 'Rigel', 'Betelgeuse', 'Altair'];
  return names[index % names.length];
};

export interface PresetScene {
  name: string;
  bodies: Omit<CelestialBody, 'id' | 'previousPosition'>[];
}

export const PRESET_SCENES: PresetScene[] = [
  {
    name: '双星系统',
    bodies: [
      {
        name: 'Star A',
        type: 'star',
        position: { x: 400, y: 400 },
        velocity: { x: 0, y: -0.5 },
        mass: 1000,
        radius: 30,
        color: STAR_COLOR,
      },
      {
        name: 'Star B',
        type: 'star',
        position: { x: 800, y: 400 },
        velocity: { x: 0, y: 0.5 },
        mass: 800,
        radius: 28,
        color: '#FFAA00',
      },
    ],
  },
  {
    name: '三体运动',
    bodies: [
      {
        name: 'Body A',
        type: 'star',
        position: { x: 600, y: 200 },
        velocity: { x: 1, y: 0 },
        mass: 500,
        radius: 25,
        color: STAR_COLOR,
      },
      {
        name: 'Body B',
        type: 'star',
        position: { x: 300, y: 600 },
        velocity: { x: -0.5, y: 0.866 },
        mass: 500,
        radius: 25,
        color: '#FF6600',
      },
      {
        name: 'Body C',
        type: 'star',
        position: { x: 900, y: 600 },
        velocity: { x: -0.5, y: -0.866 },
        mass: 500,
        radius: 25,
        color: '#FF4400',
      },
    ],
  },
  {
    name: '太阳系缩影',
    bodies: [
      {
        name: 'Sun',
        type: 'star',
        position: { x: 600, y: 400 },
        velocity: { x: 0, y: 0 },
        mass: 2000,
        radius: 35,
        color: STAR_COLOR,
      },
      {
        name: 'Mercury',
        type: 'planet',
        position: { x: 680, y: 400 },
        velocity: { x: 0, y: 3 },
        mass: 1,
        radius: 10,
        color: '#AAAAAA',
      },
      {
        name: 'Venus',
        type: 'planet',
        position: { x: 750, y: 400 },
        velocity: { x: 0, y: 2.5 },
        mass: 1.5,
        radius: 12,
        color: '#E6C87A',
      },
      {
        name: 'Earth',
        type: 'planet',
        position: { x: 820, y: 400 },
        velocity: { x: 0, y: 2 },
        mass: 2,
        radius: 14,
        color: '#44AAFF',
      },
      {
        name: 'Mars',
        type: 'planet',
        position: { x: 890, y: 400 },
        velocity: { x: 0, y: 1.7 },
        mass: 1,
        radius: 11,
        color: '#FF6644',
      },
    ],
  },
];

interface SimulationState {
  bodies: CelestialBody[];
  mode: SimulationMode;
  speed: number;
  selectedBodyId: string | null;
  fps: number;
  maxBodies: number;
  bodyCounter: number;
  canvasWidth: number;
  canvasHeight: number;
  setBodies: (bodies: CelestialBody[]) => void;
  setMode: (mode: SimulationMode) => void;
  setSpeed: (speed: number) => void;
  setSelectedBodyId: (id: string | null) => void;
  setFps: (fps: number) => void;
  addBody: (body: CelestialBody) => void;
  updateBody: (id: string, updates: Partial<CelestialBody>) => void;
  removeBody: (id: string) => void;
  clearBodies: () => void;
  createBody: (type: 'star' | 'planet', position: { x: number; y: number }, velocity: { x: number; y: number }, mass?: number) => void;
  loadPresetScene: (index: number) => void;
  setCanvasSize: (width: number, height: number) => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  bodies: [],
  mode: 'free',
  speed: 1.0,
  selectedBodyId: null,
  fps: 60,
  maxBodies: 12,
  bodyCounter: 0,
  canvasWidth: 1200,
  canvasHeight: 800,

  setBodies: (bodies) => set({ bodies }),
  setMode: (mode) => set({ mode }),
  setSpeed: (speed) => set({ speed: Math.max(0.1, Math.min(3.0, speed)) }),
  setSelectedBodyId: (id) => set({ selectedBodyId: id }),
  setFps: (fps) => set({ fps }),

  addBody: (body) =>
    set((state) => {
      if (state.bodies.length >= state.maxBodies) return state;
      return { bodies: [...state.bodies, body], bodyCounter: state.bodyCounter + 1 };
    }),

  updateBody: (id, updates) =>
    set((state) => ({
      bodies: state.bodies.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),

  removeBody: (id) =>
    set((state) => ({
      bodies: state.bodies.filter((b) => b.id !== id),
      selectedBodyId: state.selectedBodyId === id ? null : state.selectedBodyId,
    })),

  clearBodies: () => set({ bodies: [], selectedBodyId: null, bodyCounter: 0 }),

  createBody: (type, position, velocity, mass) => {
    const state = get();
    if (state.bodies.length >= state.maxBodies) return;

    const counter = state.bodyCounter;
    const color = type === 'star' ? STAR_COLOR : PLANET_COLORS[counter % PLANET_COLORS.length];
    const radius = type === 'star' ? 30 : 10 + Math.random() * 15;
    const calculatedMass = mass ?? (type === 'star' ? 500 + Math.random() * 500 : 1 + Math.random() * 5);
    const name = type === 'star' ? generateStarName(counter) : generatePlanetName(counter);

    const newBody: CelestialBody = {
      id: uuidv4(),
      name,
      type,
      position: { ...position },
      velocity: { ...velocity },
      previousPosition: { ...position },
      mass: calculatedMass,
      radius,
      color,
    };

    set((state) => ({
      bodies: [...state.bodies, newBody],
      bodyCounter: state.bodyCounter + 1,
    }));
  },

  loadPresetScene: (index) => {
    const scene = PRESET_SCENES[index];
    if (!scene) return;

    const bodies: CelestialBody[] = scene.bodies.map((b) => ({
      ...b,
      id: uuidv4(),
      previousPosition: { ...b.position },
    }));

    set({ bodies, mode: 'demo', bodyCounter: bodies.length });
  },

  setCanvasSize: (width, height) => set({ canvasWidth: width, canvasHeight: height }),
}));
