export interface PlanetData {
  name: string;
  color: number;
  size: number;
  semiMajorAxis: number;
  eccentricity: number;
  orbitalSpeed: number;
  rotationSpeed: number;
  rotationPeriod: number;
}

export interface PlanetObject {
  mesh: THREE.Mesh;
  glowRing: THREE.Mesh;
  orbitLine: THREE.Line;
  trail: THREE.Line;
  data: PlanetData;
  angle: number;
  trailPositions: THREE.Vector3[];
}

export interface UIState {
  isPaused: boolean;
  speedMultiplier: number;
  selectedPlanet: PlanetData | null;
}
