import { create } from 'zustand';
import type { FurnitureItem, LightState, HistorySnapshot, LightParams } from '../types';
import { generateId } from '../utils/lightUtils';

interface CameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
}

interface SceneStore {
  furniture: FurnitureItem[];
  lights: LightState;
  history: HistorySnapshot[];
  camera: CameraState;
  selectedFurnitureId: string | null;
  warningFurnitureIds: string[];
  addFurniture: (item: Omit<FurnitureItem, 'id'>) => string;
  updateFurniture: (id: string, updates: Partial<FurnitureItem>) => void;
  removeFurniture: (id: string) => void;
  setLightParams: (id: string, params: Partial<LightParams>) => void;
  selectFurniture: (id: string | null) => void;
  setWarningFurniture: (ids: string[]) => void;
  saveSnapshot: (thumbnail: string, cameraState: CameraState) => void;
  restoreSnapshot: (snapshotId: string) => void;
  resetCamera: () => void;
  exportToOBJ: () => string;
}

const DEFAULT_CAMERA: CameraState = {
  position: { x: 0, y: 350, z: 350 },
  target: { x: 0, y: 0, z: 0 },
};

export const useSceneStore = create<SceneStore>((set, get) => ({
  furniture: [],
  lights: {},
  history: [],
  camera: DEFAULT_CAMERA,
  selectedFurnitureId: null,
  warningFurnitureIds: [],

  addFurniture: (item) => {
    const id = generateId();
    const newItem: FurnitureItem = { ...item, id };
    const defaultLightParams: LightParams = {
      brightness: 0.6,
      colorTemp: 4000,
      angle: 0,
      on: true,
    };
    set((state) => {
      const isLightType = ['floorLamp', 'chandelier'].includes(item.type);
      return {
        furniture: [...state.furniture, newItem],
        lights: isLightType ? { ...state.lights, [id]: defaultLightParams } : state.lights,
        selectedFurnitureId: id,
      };
    });
    return id;
  },

  updateFurniture: (id, updates) => {
    set((state) => ({
      furniture: state.furniture.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    }));
  },

  removeFurniture: (id) => {
    set((state) => {
      const newLights = { ...state.lights };
      delete newLights[id];
      return {
        furniture: state.furniture.filter((f) => f.id !== id),
        lights: newLights,
        selectedFurnitureId: state.selectedFurnitureId === id ? null : state.selectedFurnitureId,
      };
    });
  },

  setLightParams: (id, params) => {
    set((state) => ({
      lights: {
        ...state.lights,
        [id]: { ...(state.lights[id] || {}), ...params },
      },
    }));
  },

  selectFurniture: (id) => {
    set({ selectedFurnitureId: id });
  },

  setWarningFurniture: (ids) => {
    set({ warningFurnitureIds: ids });
  },

  saveSnapshot: (thumbnail, cameraState) => {
    const snapshot: HistorySnapshot = {
      id: generateId(),
      timestamp: Date.now(),
      thumbnail,
      state: {
        furniture: JSON.parse(JSON.stringify(get().furniture)),
        lights: JSON.parse(JSON.stringify(get().lights)),
        camera: cameraState,
      },
    };
    set((state) => {
      const newHistory = [snapshot, ...state.history].slice(0, 10);
      return { history: newHistory, camera: cameraState };
    });
  },

  restoreSnapshot: (snapshotId) => {
    const snapshot = get().history.find((s) => s.id === snapshotId);
    if (snapshot) {
      set({
        furniture: JSON.parse(JSON.stringify(snapshot.state.furniture)),
        lights: JSON.parse(JSON.stringify(snapshot.state.lights)),
        camera: snapshot.state.camera,
        selectedFurnitureId: null,
      });
    }
  },

  resetCamera: () => {
    set({ camera: DEFAULT_CAMERA });
  },

  exportToOBJ: () => {
    let obj = '# Exported from 3D Furniture Arranger\n';
    let vertexOffset = 0;
    get().furniture.forEach((item, idx) => {
      obj += `o ${item.type}_${idx + 1}\n`;
      const size = getItemSize(item.type);
      const { x: px, y: py, z: pz } = item.position;
      const hw = size.w / 2;
      const hh = size.h / 2;
      const hd = size.d / 2;
      const vertices = [
        [px - hw, py - hh, pz - hd],
        [px + hw, py - hh, pz - hd],
        [px + hw, py + hh, pz - hd],
        [px - hw, py + hh, pz - hd],
        [px - hw, py - hh, pz + hd],
        [px + hw, py - hh, pz + hd],
        [px + hw, py + hh, pz + hd],
        [px - hw, py + hh, pz + hd],
      ];
      vertices.forEach((v) => {
        obj += `v ${v[0].toFixed(2)} ${v[1].toFixed(2)} ${v[2].toFixed(2)}\n`;
      });
      const faces = [
        [1, 2, 3, 4],
        [5, 8, 7, 6],
        [1, 4, 8, 5],
        [2, 6, 7, 3],
        [3, 7, 8, 4],
        [1, 5, 6, 2],
      ];
      faces.forEach((f) => {
        obj += `f ${f.map((v) => v + vertexOffset).join(' ')}\n`;
      });
      vertexOffset += 8;
    });
    return obj;
  },
}));

function getItemSize(type: string): { w: number; h: number; d: number } {
  const sizes: Record<string, { w: number; h: number; d: number }> = {
    sofa: { w: 100, h: 40, d: 50 },
    coffeeTable: { w: 60, h: 25, d: 40 },
    floorLamp: { w: 15, h: 120, d: 15 },
    chandelier: { w: 40, h: 30, d: 40 },
    bookshelf: { w: 80, h: 150, d: 25 },
    carpet: { w: 150, h: 2, d: 100 },
  };
  return sizes[type] || { w: 50, h: 50, d: 50 };
}
