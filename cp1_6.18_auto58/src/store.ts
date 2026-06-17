import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { MoodType, SculptureData } from './types';

const MAX_SCULPTURES = 12;
const MIN_RADIUS = 15;
const MAX_RADIUS = 40;

interface AppState {
  sculptures: SculptureData[];
  currentIndex: number;
  filterMood: MoodType | null;
  focusedSculptureId: string | null;
  addSculpture: (mood: MoodType, intensity: number) => SculptureData;
  removeOldestSculpture: () => void;
  setFilterMood: (mood: MoodType | null) => void;
  setFocusedSculptureId: (id: string | null) => void;
  setCurrentIndex: (index: number) => void;
  updateSculpturePosition: (id: string, position: { x: number; y: number; z: number }) => void;
  setSculptureOnShelf: (id: string, isOnShelf: boolean) => void;
  getMoodCount: (mood: MoodType) => number;
}

const calculateRadius = (intensity: number): number => {
  const clampedIntensity = Math.max(1, Math.min(10, intensity));
  const t = (clampedIntensity - 1) / 9;
  return MIN_RADIUS + t * (MAX_RADIUS - MIN_RADIUS);
};

const calculateShelfPosition = (index: number, totalOnShelf: number) => {
  const shelfRadius = 200;
  const angleSpacing = (30 * Math.PI) / 180;
  const centerAngle = ((totalOnShelf - 1) * angleSpacing) / 2;
  const angle = index * angleSpacing - centerAngle;

  const x = shelfRadius * Math.sin(angle);
  const z = -shelfRadius * Math.cos(angle) - 50;
  const y = (Math.random() - 0.5) * 40;

  return { x, y, z };
};

export const useAppStore = create<AppState>((set, get) => ({
  sculptures: [],
  currentIndex: 0,
  filterMood: null,
  focusedSculptureId: null,

  addSculpture: (mood: MoodType, intensity: number) => {
    const state = get();
    const newSculpture: SculptureData = {
      id: uuidv4(),
      mood,
      intensity,
      createdAt: new Date(),
      baseRadius: calculateRadius(intensity),
      position: { x: 0, y: 0, z: 0 },
      isOnShelf: false
    };

    const existingSculptures = state.sculptures.map((s, idx) => {
      const isNewlyOnShelf = !s.isOnShelf;
      const shelfIndex = idx;
      const totalOnShelf = state.sculptures.length;
      const newPosition = isNewlyOnShelf
        ? calculateShelfPosition(shelfIndex, totalOnShelf)
        : s.position;

      return {
        ...s,
        isOnShelf: true,
        position: newPosition
      };
    });

    let updatedSculptures = [...existingSculptures, newSculpture];

    if (updatedSculptures.length > MAX_SCULPTURES) {
      updatedSculptures = updatedSculptures.slice(-MAX_SCULPTURES);
    }

    set({
      sculptures: updatedSculptures,
      currentIndex: updatedSculptures.length - 1
    });

    return newSculpture;
  },

  removeOldestSculpture: () => {
    set((state) => ({
      sculptures: state.sculptures.slice(1)
    }));
  },

  setFilterMood: (mood: MoodType | null) => {
    set({ filterMood: mood });
  },

  setFocusedSculptureId: (id: string | null) => {
    set({ focusedSculptureId: id });
  },

  setCurrentIndex: (index: number) => {
    set({ currentIndex: index });
  },

  updateSculpturePosition: (id: string, position: { x: number; y: number; z: number }) => {
    set((state) => ({
      sculptures: state.sculptures.map((s) =>
        s.id === id ? { ...s, position } : s
      )
    }));
  },

  setSculptureOnShelf: (id: string, isOnShelf: boolean) => {
    set((state) => ({
      sculptures: state.sculptures.map((s) =>
        s.id === id ? { ...s, isOnShelf } : s
      )
    }));
  },

  getMoodCount: (mood: MoodType) => {
    return get().sculptures.filter((s) => s.mood === mood).length;
  }
}));
