import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  GeometryType,
  GeometryItemData,
  LightingConfig,
  TransformMode,
  SceneState,
  Vec3,
  MaterialProps
} from '../types';

const GEOMETRY_NAMES: Record<GeometryType, string> = {
  box: '立方体',
  sphere: '球体',
  cylinder: '圆柱体',
  torus: '圆环',
  cone: '圆锥'
};

const randomColor = (): string => {
  const colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#1dd1a1', '#5f27cd',
    '#ff9ff3', '#54a0ff', '#00d2d3', '#ff6348', '#ffa502',
    '#7bed9f', '#70a1ff', '#eccc68', '#a29bfe', '#fd79a8'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const defaultLighting: LightingConfig = {
  ambientIntensity: 0.5,
  pointLightPosition: { x: 5, y: 5, z: 5 },
  pointLightIntensity: 1
};

const createGeometry = (type: GeometryType): GeometryItemData => {
  const position: Vec3 = { x: 0, y: 0, z: 0 };
  const rotation: Vec3 = { x: 0, y: 0, z: 0 };
  const scale: Vec3 = { x: 1, y: 1, z: 1 };
  const material: MaterialProps = {
    color: randomColor(),
    roughness: 0.5,
    metalness: 0.3
  };
  return {
    id: uuidv4(),
    type,
    position,
    rotation,
    scale,
    material,
    name: GEOMETRY_NAMES[type]
  };
};

export const useSceneStore = create<SceneState>((set) => ({
  geometries: [],
  selectedId: null,
  lighting: defaultLighting,
  transformMode: 'translate',

  addGeometry: (type: GeometryType) =>
    set((state) => {
      const newGeo = createGeometry(type);
      return {
        geometries: [...state.geometries, newGeo],
        selectedId: newGeo.id
      };
    }),

  removeGeometry: (id: string) =>
    set((state) => ({
      geometries: state.geometries.filter((g) => g.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId
    })),

  updateGeometry: (id: string, updates: Partial<GeometryItemData>) =>
    set((state) => ({
      geometries: state.geometries.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      )
    })),

  selectGeometry: (id: string | null) =>
    set({ selectedId: id }),

  setLighting: (updates: Partial<LightingConfig>) =>
    set((state) => ({
      lighting: { ...state.lighting, ...updates }
    })),

  setTransformMode: (mode: TransformMode) =>
    set({ transformMode: mode }),

  clearScene: () =>
    set({
      geometries: [],
      selectedId: null,
      lighting: defaultLighting
    })
}));
