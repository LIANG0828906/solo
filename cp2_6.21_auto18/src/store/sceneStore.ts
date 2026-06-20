import { create } from 'zustand';
import {
  SceneStore,
  ExhibitType,
  Transform,
  Exhibit,
  PointLightData,
  CameraPathType,
  TransformMode,
} from '../types/scene';
import { getRandomColor, generateExhibitName, getDefaultTransform } from '../utils/exhibitPresets';
import { exportSceneToJSON, parseSceneJSON } from '../utils/sceneIO';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

const initialPointLights: PointLightData[] = [
  { id: 'light1', position: { x: 3, y: 5, z: 2 }, color: '#ffaa00', intensity: 1.5 },
  { id: 'light2', position: { x: -4, y: 3, z: 6 }, color: '#00aaff', intensity: 1.2 },
  { id: 'light3', position: { x: 0, y: 2, z: -5 }, color: '#ff66aa', intensity: 1.0 },
];

const initialPointLightsEnabled: Record<string, boolean> = {
  light1: true,
  light2: true,
  light3: true,
};

export const useSceneStore = create<SceneStore>((set, get) => ({
  exhibits: [],
  selectedId: null,
  transformMode: 'translate',
  lighting: {
    ambientIntensity: 0.4,
    ambientColor: '#ffffff',
    ambientEnabled: true,
    pointLights: initialPointLights,
    pointLightsEnabled: initialPointLightsEnabled,
  },
  cameraPath: 'none',
  isAnimating: false,

  addExhibit: (type: ExhibitType) => {
    const { exhibits } = get();
    const typeCount = exhibits.filter((e) => e.type === type).length + 1;
    const newExhibit: Exhibit = {
      id: generateId(),
      type,
      transform: getDefaultTransform(),
      color: getRandomColor(type),
      name: generateExhibitName(type, typeCount),
    };
    set({ exhibits: [...exhibits, newExhibit], selectedId: newExhibit.id });
  },

  removeExhibit: (id: string) => {
    const { exhibits, selectedId } = get();
    set({
      exhibits: exhibits.filter((e) => e.id !== id),
      selectedId: selectedId === id ? null : selectedId,
    });
  },

  selectExhibit: (id: string | null) => {
    set({ selectedId: id });
  },

  updateTransform: (id: string, transform: Partial<Transform>) => {
    set({
      exhibits: get().exhibits.map((exhibit) =>
        exhibit.id === id
          ? {
              ...exhibit,
              transform: {
                ...exhibit.transform,
                ...transform,
                position: transform.position
                  ? { ...exhibit.transform.position, ...transform.position }
                  : exhibit.transform.position,
                rotation: transform.rotation
                  ? { ...exhibit.transform.rotation, ...transform.rotation }
                  : exhibit.transform.rotation,
              },
            }
          : exhibit
      ),
    });
  },

  setTransformMode: (mode: TransformMode) => {
    set({ transformMode: mode });
  },

  updatePointLight: (id: string, data: Partial<PointLightData>) => {
    set({
      lighting: {
        ...get().lighting,
        pointLights: get().lighting.pointLights.map((light) =>
          light.id === id ? { ...light, ...data } : light
        ),
      },
    });
  },

  setAmbientIntensity: (intensity: number) => {
    set({
      lighting: {
        ...get().lighting,
        ambientIntensity: intensity,
      },
    });
  },

  setCameraPath: (path: CameraPathType) => {
    set({ cameraPath: path, isAnimating: path !== 'none' });
  },

  toggleAnimation: () => {
    const { isAnimating, cameraPath } = get();
    if (cameraPath === 'none') return;
    set({ isAnimating: !isAnimating });
  },

  toggleLight: (lightId: string | 'ambient') => {
    const { lighting } = get();
    if (lightId === 'ambient') {
      set({
        lighting: {
          ...lighting,
          ambientEnabled: !lighting.ambientEnabled,
        },
      });
    } else {
      set({
        lighting: {
          ...lighting,
          pointLightsEnabled: {
            ...lighting.pointLightsEnabled,
            [lightId]: !lighting.pointLightsEnabled[lightId],
          },
        },
      });
    }
  },

  setPointLightIntensity: (id: string, intensity: number) => {
    const { lighting } = get();
    const clampedIntensity = Math.max(0, Math.min(3, intensity));
    set({
      lighting: {
        ...lighting,
        pointLights: lighting.pointLights.map((light) =>
          light.id === id ? { ...light, intensity: clampedIntensity } : light
        ),
      },
    });
  },

  exportScene: (): string => {
    const { exhibits, lighting, cameraPath } = get();
    return exportSceneToJSON(exhibits, lighting, cameraPath);
  },

  importScene: (json: string) => {
    const data = parseSceneJSON(json);
    if (data) {
      set({
        exhibits: data.exhibits,
        lighting: data.lighting,
        cameraPath: data.cameraPath,
        selectedId: null,
        isAnimating: false,
      });
    }
  },
}));
