import { create } from 'zustand';
import { PLANETS } from '../data/planets';

interface SolarSystemState {
  timeSpeed: number;
  selectedPlanetId: string | null;
  hoveredPlanetId: string | null;
  planetAngles: Record<string, number>;
  planetRotations: Record<string, number>;

  setTimeSpeed: (speed: number) => void;
  setSelectedPlanet: (id: string | null) => void;
  setHoveredPlanet: (id: string | null) => void;
  updatePlanetPositions: (deltaTime: number) => void;
  reset: () => void;
}

const initAngles = (): Record<string, number> => {
  const angles: Record<string, number> = {};
  PLANETS.forEach((p) => {
    angles[p.id] = Math.random() * Math.PI * 2;
  });
  return angles;
};

const initRotations = (): Record<string, number> => {
  const rotations: Record<string, number> = {};
  PLANETS.forEach((p) => {
    rotations[p.id] = 0;
  });
  return rotations;
};

export const useSolarSystemStore = create<SolarSystemState>((set, get) => ({
  timeSpeed: 1,
  selectedPlanetId: null,
  hoveredPlanetId: null,
  planetAngles: initAngles(),
  planetRotations: initRotations(),

  setTimeSpeed: (speed: number) => set({ timeSpeed: speed }),

  setSelectedPlanet: (id: string | null) => set({ selectedPlanetId: id }),

  setHoveredPlanet: (id: string | null) => set({ hoveredPlanetId: id }),

  updatePlanetPositions: (deltaTime: number) => {
    const { timeSpeed, planetAngles, planetRotations } = get();
    const newAngles: Record<string, number> = { ...planetAngles };
    const newRotations: Record<string, number> = { ...planetRotations };

    for (const planet of PLANETS) {
      const orbitSpeed = (2 * Math.PI) / planet.orbitPeriod;
      newAngles[planet.id] =
        (planetAngles[planet.id] + orbitSpeed * timeSpeed * deltaTime) %
        (Math.PI * 2);

      const rotSpeed = (2 * Math.PI) / (planet.rotationPeriod * 10);
      newRotations[planet.id] =
        (planetRotations[planet.id] + rotSpeed * timeSpeed * deltaTime) %
        (Math.PI * 2);
    }

    set({ planetAngles: newAngles, planetRotations: newRotations });
  },

  reset: () =>
    set({
      timeSpeed: 1,
      selectedPlanetId: null,
      hoveredPlanetId: null,
      planetAngles: initAngles(),
      planetRotations: initRotations(),
    }),
}));
