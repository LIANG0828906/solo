import { create } from 'zustand';
import { Exhibit, LightConfig, EXHIBIT_COLORS, FLOOR_HALF } from '@/types';
import { kelvinToRGB } from '@/utils/colorTemp';

interface ExhibitStore {
  exhibits: Exhibit[];
  lightConfig: LightConfig;
  selectedExhibitId: string | null;
  draggingExhibitId: string | null;
  
  updateExhibitPosition: (id: string, position: { x: number; y: number; z: number }) => void;
  updateExhibitRotation: (id: string, rotation: { x: number; y: number; z: number }) => void;
  updateLightAngle: (angle: number) => void;
  updateLightColorTemp: (colorTemp: number) => void;
  setSelectedExhibit: (id: string | null) => void;
  setDraggingExhibit: (id: string | null) => void;
  resetExhibits: () => void;
}

const createInitialExhibits = (): Exhibit[] => {
  const positions = [
    { x: -15, z: -15 },
    { x: 15, z: -15 },
    { x: -15, z: 15 },
    { x: 15, z: 15 },
    { x: 0, z: 0 },
  ];

  return positions.map((pos, index) => ({
    id: `exhibit-${index + 1}`,
    name: `展品 ${index + 1}`,
    position: { x: pos.x, y: 1.5, z: pos.z },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 2, y: 3, z: 2 },
    color: EXHIBIT_COLORS[index],
  }));
};

const createInitialLightConfig = (): LightConfig => {
  const initialAngle = 45;
  const initialColorTemp = 4500;
  const radius = 20;
  const height = 15;

  return {
    position: {
      x: Math.cos((initialAngle * Math.PI) / 180) * radius,
      y: height,
      z: Math.sin((initialAngle * Math.PI) / 180) * radius,
    },
    angle: initialAngle,
    colorTemp: initialColorTemp,
    intensity: 1.5,
    color: kelvinToRGB(initialColorTemp),
  };
};

export const useExhibitStore = create<ExhibitStore>((set, get) => ({
  exhibits: createInitialExhibits(),
  lightConfig: createInitialLightConfig(),
  selectedExhibitId: null,
  draggingExhibitId: null,

  updateExhibitPosition: (id, position) => {
    set((state) => ({
      exhibits: state.exhibits.map((exhibit) =>
        exhibit.id === id
          ? {
              ...exhibit,
              position: {
                x: Math.max(-FLOOR_HALF + 2, Math.min(FLOOR_HALF - 2, position.x)),
                y: position.y,
                z: Math.max(-FLOOR_HALF + 2, Math.min(FLOOR_HALF - 2, position.z)),
              },
            }
          : exhibit
      ),
    }));
  },

  updateExhibitRotation: (id, rotation) => {
    set((state) => ({
      exhibits: state.exhibits.map((exhibit) =>
        exhibit.id === id ? { ...exhibit, rotation } : exhibit
      ),
    }));
  },

  updateLightAngle: (angle) => {
    const clampedAngle = ((angle % 360) + 360) % 360;
    const radius = 20;
    const height = 15;

    set((state) => ({
      lightConfig: {
        ...state.lightConfig,
        angle: clampedAngle,
        position: {
          x: Math.cos((clampedAngle * Math.PI) / 180) * radius,
          y: height,
          z: Math.sin((clampedAngle * Math.PI) / 180) * radius,
        },
      },
    }));
  },

  updateLightColorTemp: (colorTemp) => {
    const clampedTemp = Math.max(2700, Math.min(6500, colorTemp));
    const newColor = kelvinToRGB(clampedTemp);

    set((state) => ({
      lightConfig: {
        ...state.lightConfig,
        colorTemp: clampedTemp,
        color: newColor,
      },
    }));
  },

  setSelectedExhibit: (id) => set({ selectedExhibitId: id }),
  setDraggingExhibit: (id) => set({ draggingExhibitId: id }),

  resetExhibits: () => {
    set({ exhibits: createInitialExhibits() });
  },
}));
