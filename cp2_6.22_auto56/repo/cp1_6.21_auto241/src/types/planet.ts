export interface PlanetBasic {
  id: string;
  name: string;
  nameCn: string;
  color: string;
  radius: number;
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  tilt: number;
  description: string;
}

export interface PlanetDetail extends PlanetBasic {
  equatorialRadius: number;
  averageOrbitSpeed: number;
  rotationPeriod: number;
  orbitalPeriod: number;
  knownMoons: number;
  mass: number;
  density: number;
  surfaceGravity: number;
  averageTemperature: number;
  atmosphere: string;
  discovery: string;
  detailedDescription: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
