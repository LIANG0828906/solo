const SCALE_FACTOR = 0.001;
const SIZE_SCALE_FACTOR = 0.005;

export function getOrbitRadius(distance: number): number {
  return distance * SCALE_FACTOR;
}

export function getPlanetPosition(
  day: number,
  orbitalPeriod: number,
  orbitRadius: number
): { x: number; z: number } {
  const angle = (day / orbitalPeriod) * Math.PI * 2;
  return {
    x: Math.cos(angle) * orbitRadius,
    z: Math.sin(angle) * orbitRadius,
  };
}

export function getOrbitalProgress(day: number, orbitalPeriod: number): number {
  const progress = (day % orbitalPeriod) / orbitalPeriod;
  return progress < 0 ? progress + 1 : progress;
}

export function scalePlanetSize(diameter: number): number {
  return diameter * SIZE_SCALE_FACTOR;
}
