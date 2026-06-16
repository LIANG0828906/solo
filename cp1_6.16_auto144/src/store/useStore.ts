import { create } from 'zustand';
import { CITIES, City } from '@/data/cities';
import { STAR_NAMES } from '@/data/starNames';

export interface Star {
  id: number;
  x: number;
  y: number;
  magnitude: number;
  name: string | null;
  baseRadius: number;
  baseAlpha: number;
}

interface StoreState {
  currentCity: City;
  observationTime: number;
  lightPollutionEnabled: boolean;
  stars: Star[];
  initialized: boolean;
  setCity: (city: City) => void;
  setTime: (time: number) => void;
  toggleLightPollution: () => void;
  initStars: () => void;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateStars(): Star[] {
  const rng = seededRandom(42);
  const stars: Star[] = [];
  const totalStars = 3000;
  const namePool = [...STAR_NAMES];

  const magnitudeDistribution = [
    { mag: 1, count: 10 },
    { mag: 2, count: 30 },
    { mag: 3, count: 100 },
    { mag: 4, count: 300 },
    { mag: 5, count: 800 },
    { mag: 6, count: totalStars - 10 - 30 - 100 - 300 - 800 },
  ];

  let id = 0;
  let nameIdx = 0;

  for (const { mag, count } of magnitudeDistribution) {
    for (let i = 0; i < count; i++) {
      const x = rng();
      const y = rng() * 0.92;
      const baseRadius = Math.max(0.5, 4 - (mag - 1) * 0.6);
      const baseAlpha = Math.max(0.15, 1 - (mag - 1) * 0.15);
      const name = mag <= 3 && nameIdx < namePool.length ? namePool[nameIdx++] : null;
      stars.push({ id: id++, x, y, magnitude: mag, name, baseRadius, baseAlpha });
    }
  }

  return stars;
}

const DEFAULT_CITY = CITIES.find(c => c.bortle === 1) || CITIES[0];

export const useStore = create<StoreState>((set, get) => ({
  currentCity: DEFAULT_CITY,
  observationTime: 22 * 60,
  lightPollutionEnabled: true,
  stars: [],
  initialized: false,

  setCity: (city: City) => set({ currentCity: city }),
  setTime: (time: number) => set({ observationTime: time }),
  toggleLightPollution: () => set(s => ({ lightPollutionEnabled: !s.lightPollutionEnabled })),
  initStars: () => {
    if (!get().initialized) {
      set({ stars: generateStars(), initialized: true });
    }
  },
}));
