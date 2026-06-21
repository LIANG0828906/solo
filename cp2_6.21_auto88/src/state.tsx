import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type {
  GlobalState,
  Action,
  Layer,
  ParticleLayer,
  GeometryLayer,
  GradientLayer,
  LinesLayer,
  Particle,
  Polygon,
  BezierLine,
} from './types';

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

const COLOR_PALETTE = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe',
  '#00b894', '#e17055', '#74b9ff', '#ff7675',
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randColor(): string {
  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

function createParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: generateId(),
      x: rand(0, CANVAS_WIDTH),
      y: rand(0, CANVAS_HEIGHT),
      vx: rand(-1, 1),
      vy: rand(-1, 1),
      size: rand(2, 8),
      color: randColor(),
    });
  }
  return particles;
}

function createPolygons(count: number): Polygon[] {
  const polygons: Polygon[] = [];
  for (let i = 0; i < count; i++) {
    polygons.push({
      id: generateId(),
      x: rand(200, CANVAS_WIDTH - 200),
      y: rand(200, CANVAS_HEIGHT - 200),
      sides: Math.floor(rand(3, 9)),
      radius: rand(60, 180),
      rotation: rand(0, Math.PI * 2),
      rotationSpeed: rand(-0.02, 0.02),
      strokeColor: randColor(),
      fillColor: randColor(),
      fillOpacity: rand(0.2, 0.6),
    });
  }
  return polygons;
}

function createGradient(): GradientLayer {
  return {
    id: generateId(),
    type: 'gradient',
    name: '渐变层',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    gradientType: 'linear',
    angle: 135,
    stops: [
      { position: 0, color: '#667eea' },
      { position: 0.5, color: '#764ba2' },
      { position: 1, color: '#f093fb' },
    ],
  };
}

function createLines(count: number): BezierLine[] {
  const lines: BezierLine[] = [];
  for (let i = 0; i < count; i++) {
    lines.push({
      id: generateId(),
      startX: rand(0, CANVAS_WIDTH),
      startY: rand(0, CANVAS_HEIGHT),
      endX: rand(0, CANVAS_WIDTH),
      endY: rand(0, CANVAS_HEIGHT),
      cp1x: rand(0, CANVAS_WIDTH),
      cp1y: rand(0, CANVAS_HEIGHT),
      cp2x: rand(0, CANVAS_WIDTH),
      cp2y: rand(0, CANVAS_HEIGHT),
      color: randColor(),
      thickness: rand(1, 3),
      opacity: rand(0.3, 0.8),
    });
  }
  return lines;
}

function createDefaultLayers(): Layer[] {
  const gradientLayer = createGradient();

  const particleLayer: ParticleLayer = {
    id: generateId(),
    type: 'particles',
    name: '粒子层',
    visible: true,
    opacity: 100,
    blendMode: 'screen',
    particles: createParticles(500),
    speed: 1,
    direction: 0,
  };

  const geometryLayer: GeometryLayer = {
    id: generateId(),
    type: 'geometry',
    name: '几何层',
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    polygons: createPolygons(8),
  };

  const linesLayer: LinesLayer = {
    id: generateId(),
    type: 'lines',
    name: '线条层',
    visible: true,
    opacity: 100,
    blendMode: 'overlay',
    lines: createLines(50),
    thickness: 2,
    lineOpacity: 60,
  };

  return [gradientLayer, linesLayer, particleLayer, geometryLayer];
}

const initialLayers = createDefaultLayers();

const initialState: GlobalState = {
  layers: initialLayers,
  selectedElementId: null,
  selectedLayerId: null,
  isPlaying: true,
  isLooping: true,
  currentTime: 0,
  isRecording: false,
  animationFrame: 0,
  expandedLayers: initialLayers.reduce((acc, layer) => {
    acc[layer.id] = true;
    return acc;
  }, {} as Record<string, boolean>),
};

function reducer(state: GlobalState, action: Action): GlobalState {
  switch (action.type) {
    case 'ADD_LAYER':
      return {
        ...state,
        layers: [...state.layers, action.layer],
        expandedLayers: { ...state.expandedLayers, [action.layer.id]: true },
      };

    case 'REMOVE_LAYER':
      return {
        ...state,
        layers: state.layers.filter((l) => l.id !== action.layerId),
        selectedLayerId: state.selectedLayerId === action.layerId ? null : state.selectedLayerId,
      };

    case 'REORDER_LAYERS': {
      const newLayers = [...state.layers];
      const [removed] = newLayers.splice(action.fromIndex, 1);
      newLayers.splice(action.toIndex, 0, removed);
      return { ...state, layers: newLayers };
    }

    case 'TOGGLE_LAYER_VISIBILITY':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId ? { ...l, visible: !l.visible } : l
        ),
      };

    case 'UPDATE_LAYER_OPACITY':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId ? { ...l, opacity: action.opacity } : l
        ),
      };

    case 'UPDATE_LAYER_BLEND_MODE':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId ? { ...l, blendMode: action.blendMode } : l
        ),
      };

    case 'UPDATE_PARTICLE_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId && l.type === 'particles'
            ? { ...l, ...action.updates }
            : l
        ),
      };

    case 'UPDATE_GEOMETRY_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId && l.type === 'geometry'
            ? { ...l, ...action.updates }
            : l
        ),
      };

    case 'UPDATE_GRADIENT_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId && l.type === 'gradient'
            ? { ...l, ...action.updates }
            : l
        ),
      };

    case 'UPDATE_LINES_LAYER':
      return {
        ...state,
        layers: state.layers.map((l) =>
          l.id === action.layerId && l.type === 'lines'
            ? { ...l, ...action.updates }
            : l
        ),
      };

    case 'UPDATE_PARTICLE':
      return {
        ...state,
        layers: state.layers.map((l) => {
          if (l.id === action.layerId && l.type === 'particles') {
            return {
              ...l,
              particles: l.particles.map((p) =>
                p.id === action.particleId ? { ...p, ...action.updates } : p
              ),
            };
          }
          return l;
        }),
      };

    case 'UPDATE_POLYGON':
      return {
        ...state,
        layers: state.layers.map((l) => {
          if (l.id === action.layerId && l.type === 'geometry') {
            return {
              ...l,
              polygons: l.polygons.map((p) =>
                p.id === action.polygonId ? { ...p, ...action.updates } : p
              ),
            };
          }
          return l;
        }),
      };

    case 'UPDATE_LINE':
      return {
        ...state,
        layers: state.layers.map((l) => {
          if (l.id === action.layerId && l.type === 'lines') {
            return {
              ...l,
              lines: l.lines.map((ln) =>
                ln.id === action.lineId ? { ...ln, ...action.updates } : ln
              ),
            };
          }
          return l;
        }),
      };

    case 'SELECT_ELEMENT':
      return {
        ...state,
        selectedElementId: action.elementId,
        selectedLayerId: action.layerId,
      };

    case 'TOGGLE_PLAYING':
      return { ...state, isPlaying: !state.isPlaying };

    case 'TOGGLE_LOOPING':
      return { ...state, isLooping: !state.isLooping };

    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.time };

    case 'SET_RECORDING':
      return { ...state, isRecording: action.isRecording };

    case 'INCREMENT_FRAME':
      return { ...state, animationFrame: state.animationFrame + 1 };

    case 'TOGGLE_LAYER_EXPANDED':
      return {
        ...state,
        expandedLayers: {
          ...state.expandedLayers,
          [action.layerId]: !state.expandedLayers[action.layerId],
        },
      };

    case 'ADVANCE_ANIMATION': {
      const dt = action.deltaTime;
      const newLayers = state.layers.map((layer) => {
        if (!layer.visible) return layer;

        if (layer.type === 'particles') {
          const speedFactor = layer.speed;
          const dirRad = (layer.direction * Math.PI) / 180;
          return {
            ...layer,
            particles: layer.particles.map((p) => {
              let nx = p.x + (p.vx + Math.cos(dirRad) * 0.5) * speedFactor * dt * 60;
              let ny = p.y + (p.vy + Math.sin(dirRad) * 0.5) * speedFactor * dt * 60;
              if (nx < 0) nx = CANVAS_WIDTH;
              if (nx > CANVAS_WIDTH) nx = 0;
              if (ny < 0) ny = CANVAS_HEIGHT;
              if (ny > CANVAS_HEIGHT) ny = 0;
              return { ...p, x: nx, y: ny };
            }),
          };
        }

        if (layer.type === 'geometry') {
          return {
            ...layer,
            polygons: layer.polygons.map((poly) => ({
              ...poly,
              rotation: poly.rotation + poly.rotationSpeed * dt * 60,
            })),
          };
        }

        if (layer.type === 'lines') {
          return layer;
        }

        return layer;
      });

      const LOOP_DURATION = 10;
      let newTime = state.currentTime + dt;
      if (state.isLooping && newTime >= LOOP_DURATION) {
        newTime = newTime % LOOP_DURATION;
      }

      return {
        ...state,
        layers: newLayers,
        currentTime: newTime,
        animationFrame: state.animationFrame + 1,
      };
    }

    default:
      return state;
  }
}

interface StateContextType {
  state: GlobalState;
  dispatch: React.Dispatch<Action>;
}

const StateContext = createContext<StateContextType | null>(null);

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState(): StateContextType {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useAppState must be used within StateProvider');
  return ctx;
}

export { CANVAS_WIDTH, CANVAS_HEIGHT, COLOR_PALETTE, generateId, createParticles, createPolygons, createLines };
