export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter',
}

export interface SeasonColors {
  sky: string;
  skyGradient: string;
  grass: string;
  treeCrown: string;
  treeShadow?: string;
  houseRoof: string;
  houseRoofSnow?: boolean;
  houseWall: string;
  particle: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  speed: number;
  angle: number;
  spiralRadius: number;
  opacity: number;
}

export interface SmokeParticle {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  opacity: number;
  speedY: number;
}

export interface House {
  x: number;
  y: number;
  width: number;
  height: number;
  roofHeight: number;
  smoking: boolean;
  smokeTimer: number;
}

export interface Tree {
  x: number;
  y: number;
  crownDiameter: number;
  trunkWidth: number;
  trunkHeight: number;
}

export interface TownState {
  season: Season;
  particleCount: number;
  particles: Particle[];
  smokeParticles: SmokeParticle[];
  houses: House[];
  trees: Tree[];
  frame: number;
}
