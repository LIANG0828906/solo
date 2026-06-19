import { create } from 'zustand';

interface PlanetData {
  id: string;
  name: string;
  color: string;
  radius: number;
  orbitRadius: number;
  orbitEccentricity: number;
  orbitInclination: number;
  orbitalPeriod: number;
  orbitalSpeed: number;
  realRadius: number;
}

interface PlanetState extends PlanetData {
  angle: number;
  position: [number, number, number];
  distanceFromSun: number;
}

interface AppState {
  planets: PlanetState[];
  selectedPlanetId: string | null;
  isPlaying: boolean;
  speedFactor: number;
  simulationTime: Date;
  setSelectedPlanet: (id: string | null) => void;
  togglePlay: () => void;
  setSpeedFactor: (speed: number) => void;
  updatePlanets: (delta: number) => void;
  resetView: () => void;
}

const basePlanets: PlanetData[] = [
  {
    id: 'mercury',
    name: '水星',
    color: '#B5A07C',
    radius: 0.08,
    orbitRadius: 1.5,
    orbitEccentricity: 0.205,
    orbitInclination: 7,
    orbitalPeriod: 88,
    orbitalSpeed: 47.87,
    realRadius: 2439.7,
  },
  {
    id: 'venus',
    name: '金星',
    color: '#E6C864',
    radius: 0.12,
    orbitRadius: 2.2,
    orbitEccentricity: 0.007,
    orbitInclination: 3.39,
    orbitalPeriod: 225,
    orbitalSpeed: 35.02,
    realRadius: 6051.8,
  },
  {
    id: 'earth',
    name: '地球',
    color: '#4A90D9',
    radius: 0.13,
    orbitRadius: 3,
    orbitEccentricity: 0.017,
    orbitInclination: 0,
    orbitalPeriod: 365,
    orbitalSpeed: 29.78,
    realRadius: 6371,
  },
  {
    id: 'mars',
    name: '火星',
    color: '#C1440E',
    radius: 0.1,
    orbitRadius: 3.8,
    orbitEccentricity: 0.093,
    orbitInclination: 1.85,
    orbitalPeriod: 687,
    orbitalSpeed: 24.13,
    realRadius: 3389.5,
  },
  {
    id: 'jupiter',
    name: '木星',
    color: '#D4A373',
    radius: 0.28,
    orbitRadius: 5.2,
    orbitEccentricity: 0.048,
    orbitInclination: 1.31,
    orbitalPeriod: 4333,
    orbitalSpeed: 13.07,
    realRadius: 69911,
  },
  {
    id: 'saturn',
    name: '土星',
    color: '#D4AF37',
    radius: 0.24,
    orbitRadius: 6.5,
    orbitEccentricity: 0.056,
    orbitInclination: 2.49,
    orbitalPeriod: 10759,
    orbitalSpeed: 9.69,
    realRadius: 58232,
  },
];

function calculatePlanetPosition(
  orbitRadius: number,
  eccentricity: number,
  inclination: number,
  angle: number
): { position: [number, number, number]; distance: number } {
  const a = orbitRadius;
  const e = eccentricity;
  const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
  const inclRad = (inclination * Math.PI) / 180;
  const x = r * Math.cos(angle);
  const z = r * Math.sin(angle) * Math.cos(inclRad);
  const y = r * Math.sin(angle) * Math.sin(inclRad);
  return { position: [x, y, z], distance: r };
}

function initPlanets(): PlanetState[] {
  return basePlanets.map((p, i) => {
    const initialAngle = (i * Math.PI) / 3;
    const { position, distance } = calculatePlanetPosition(
      p.orbitRadius,
      p.orbitEccentricity,
      p.orbitInclination,
      initialAngle
    );
    return {
      ...p,
      angle: initialAngle,
      position,
      distanceFromSun: distance,
    };
  });
}

export const useStore = create<AppState>((set, get) => ({
  planets: initPlanets(),
  selectedPlanetId: null,
  isPlaying: true,
  speedFactor: 1,
  simulationTime: new Date('2024-01-01T00:00:00Z'),
  setSelectedPlanet: (id: string | null) => set({ selectedPlanetId: id }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSpeedFactor: (speed: number) => set({ speedFactor: speed }),
  updatePlanets: (delta: number) => {
    const state = get();
    if (!state.isPlaying) return;
    const speedMultiplier = state.speedFactor * delta * 0.5;
    const newPlanets = state.planets.map((p) => {
      const angularSpeed = (2 * Math.PI) / p.orbitalPeriod;
      const newAngle = p.angle + angularSpeed * speedMultiplier * 10;
      const { position, distance } = calculatePlanetPosition(
        p.orbitRadius,
        p.orbitEccentricity,
        p.orbitInclination,
        newAngle
      );
      return {
        ...p,
        angle: newAngle,
        position,
        distanceFromSun: distance,
      };
    });
    const timeDelta = delta * state.speedFactor * 86400000 * 10;
    set({
      planets: newPlanets,
      simulationTime: new Date(state.simulationTime.getTime() + timeDelta),
    });
  },
  resetView: () => {},
}));

export type { PlanetState, PlanetData, AppState };
