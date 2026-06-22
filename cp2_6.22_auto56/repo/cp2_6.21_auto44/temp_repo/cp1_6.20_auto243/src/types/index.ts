export interface Building {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  density: number;
}

export interface CityData {
  id: string;
  name: string;
  center: [number, number];
  buildings: Building[];
  defaultWind: WindParams;
}

export interface WindParams {
  speed: number;
  direction: number;
  turbulence: number;
}

export interface WindPreset {
  id: string;
  name: string;
  cityId: string;
  wind: WindParams;
  particleCount: number;
  createdAt: number;
}

export interface Scene3DHandle {
  updateWindParams: (wind: WindParams) => void;
  setParticleCount: (n: number) => void;
  loadCity: (city: CityData) => void;
  resetCamera: () => void;
  getParticleCount: () => number;
  getFPS: () => number;
}
