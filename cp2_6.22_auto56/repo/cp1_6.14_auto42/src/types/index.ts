export interface Planet {
  id: string;
  name: string;
  type: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  color: string;
  moons: number;
  habitable: boolean;
  hasAtmosphere: boolean;
  atmosphereColor: string;
  description: string;
}

export interface Star {
  id: string;
  name: string;
  coordinates: { x: number; y: number; z: number };
  starType: string;
  temperature: number;
  mass: number;
  color: string;
  luminosity: number;
  description: string;
  planets: Planet[];
}

export type CelestialBody =
  | { type: 'star'; data: Star }
  | { type: 'planet'; data: Planet; parentStar: Star };

export interface StarContextType {
  selectedBody: CelestialBody | null;
  setSelectedBody: (body: CelestialBody | null) => void;
  showOrbits: boolean;
  setShowOrbits: (show: boolean) => void;
  showAtmosphere: boolean;
  setShowAtmosphere: (show: boolean) => void;
}
