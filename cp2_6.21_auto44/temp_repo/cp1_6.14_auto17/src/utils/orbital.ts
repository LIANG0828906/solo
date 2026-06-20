interface ScaleConfig {
  orbitScaleFactor: number;
  sizeScaleFactor: number;
  minOrbitRadius: number;
  minPlanetSize: number;
}

const DESKTOP_CONFIG: ScaleConfig = {
  orbitScaleFactor: 0.001,
  sizeScaleFactor: 0.005,
  minOrbitRadius: 0.5,
  minPlanetSize: 0.15,
};

const MOBILE_CONFIG: ScaleConfig = {
  orbitScaleFactor: 0.0006,
  sizeScaleFactor: 0.003,
  minOrbitRadius: 0.3,
  minPlanetSize: 0.1,
};

function getScaleConfig(): ScaleConfig {
  if (typeof window === 'undefined') return DESKTOP_CONFIG;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const minDim = Math.min(width, height);
  if (minDim < 768) return MOBILE_CONFIG;
  if (minDim < 1024) {
    const ratio = (minDim - 768) / (1024 - 768);
    return {
      orbitScaleFactor: MOBILE_CONFIG.orbitScaleFactor + ratio * (DESKTOP_CONFIG.orbitScaleFactor - MOBILE_CONFIG.orbitScaleFactor),
      sizeScaleFactor: MOBILE_CONFIG.sizeScaleFactor + ratio * (DESKTOP_CONFIG.sizeScaleFactor - MOBILE_CONFIG.sizeScaleFactor),
      minOrbitRadius: MOBILE_CONFIG.minOrbitRadius + ratio * (DESKTOP_CONFIG.minOrbitRadius - MOBILE_CONFIG.minOrbitRadius),
      minPlanetSize: MOBILE_CONFIG.minPlanetSize + ratio * (DESKTOP_CONFIG.minPlanetSize - MOBILE_CONFIG.minPlanetSize),
    };
  }
  return DESKTOP_CONFIG;
}

export function getOrbitRadius(distance: number): number {
  const config = getScaleConfig();
  return Math.max(distance * config.orbitScaleFactor, config.minOrbitRadius);
}

export function getPlanetPosition(
  day: number,
  orbitalPeriod: number,
  orbitRadius: number,
  orbitalInclination: number = 0,
): { x: number; y: number; z: number } {
  const angle = (day / orbitalPeriod) * Math.PI * 2;
  const inclinationRad = (orbitalInclination * Math.PI) / 180;
  const rawX = Math.cos(angle) * orbitRadius;
  const rawZ = Math.sin(angle) * orbitRadius;
  return {
    x: rawX,
    y: Math.sin(angle) * Math.sin(inclinationRad) * orbitRadius,
    z: rawZ * Math.cos(inclinationRad),
  };
}

export function getOrbitalProgress(day: number, orbitalPeriod: number): number {
  const progress = (day % orbitalPeriod) / orbitalPeriod;
  return progress < 0 ? progress + 1 : progress;
}

export function scalePlanetSize(diameter: number): number {
  const config = getScaleConfig();
  return Math.max(diameter * config.sizeScaleFactor, config.minPlanetSize);
}
