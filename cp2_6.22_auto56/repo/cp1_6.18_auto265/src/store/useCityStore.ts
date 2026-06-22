import { create } from 'zustand';
import {
  Building,
  ZoneType,
  computeHotness,
  generateBuildings,
  getCurrentMinuteOfDay,
} from '../utils/heatData';

interface CityState {
  selectedTime: number;
  isAutoPlay: boolean;
  hotness: Record<ZoneType, number>;
  buildings: Building[];
  hoveredZone: ZoneType | null;
  setSelectedTime: (min: number) => void;
  setHoveredZone: (z: ZoneType | null) => void;
  setAutoPlay: (v: boolean) => void;
  tick: (deltaMin: number) => void;
}

const initialTime = getCurrentMinuteOfDay();
const initialHotness = computeHotness(initialTime);
const buildings = generateBuildings(13);

export const useCityStore = create<CityState>((set, get) => ({
  selectedTime: initialTime,
  isAutoPlay: true,
  hotness: initialHotness,
  buildings,
  hoveredZone: null,
  setSelectedTime: (min: number) => {
    const clamped = ((min % 1440) + 1440) % 1440;
    const prevBucket = Math.floor(get().selectedTime / 5);
    const newBucket = Math.floor(clamped / 5);
    if (prevBucket !== newBucket) {
      set({ selectedTime: clamped, hotness: computeHotness(clamped) });
    } else {
      set({ selectedTime: clamped });
    }
  },
  setHoveredZone: (z) => set({ hoveredZone: z }),
  setAutoPlay: (v) => set({ isAutoPlay: v }),
  tick: (deltaMin: number) => {
    if (!get().isAutoPlay) return;
    const next = (get().selectedTime + deltaMin + 1440) % 1440;
    get().setSelectedTime(next);
  },
}));
