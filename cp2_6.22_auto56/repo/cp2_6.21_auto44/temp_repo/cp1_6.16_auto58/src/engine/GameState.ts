export interface Position {
  x: number;
  y: number;
}

export interface MineCart {
  position: Position;
  durability: number;
  targetY: number;
  lightAngle: number;
  targetLightAngle: number;
  attachedBats: number;
}

export interface Crystal {
  id: string;
  position: Position;
  isLit: boolean;
  isCollected: boolean;
  glowIntensity: number;
}

export interface Bat {
  id: string;
  position: Position;
  velocity: Position;
  isStunned: boolean;
  stunTimer: number;
  isAttached: boolean;
  sinePhase: number;
  rotation: number;
}

export interface GasCloud {
  id: string;
  position: Position;
  radius: number;
  warningIntensity: number;
}

export interface Particle {
  id: string;
  position: Position;
  velocity: Position;
  type: 'crystal' | 'explosion' | 'bullet';
  life: number;
  maxLife: number;
  rotation: number;
  color: string;
}

export interface SonicBullet {
  id: string;
  position: Position;
  radius: number;
  maxRadius: number;
  speed: number;
}

export interface PathConfig {
  id: string;
  crystalDensity: number;
  batIntensity: number;
  width: number;
  topBoundary: (x: number) => number;
  bottomBoundary: (x: number) => number;
}

export interface ForkState {
  active: boolean;
  position: number;
  timer: number;
  leftPath: PathConfig;
  rightPath: PathConfig;
  selectedPath: 'left' | 'right' | null;
}

export interface ScreenShake {
  active: boolean;
  amplitude: number;
  duration: number;
  timer: number;
  offset: Position;
}

export interface PathTransition {
  active: boolean;
  duration: number;
  timer: number;
  progress: number;
}

export interface GameState {
  isRunning: boolean;
  isGameOver: boolean;
  score: number;
  crystalsCollected: number;
  batsKilled: number;
  survivalTime: number;
  distanceTraveled: number;
  scrollSpeed: number;

  mineCart: MineCart;
  crystals: Crystal[];
  bats: Bat[];
  gasClouds: GasCloud[];
  particles: Particle[];
  sonicBullets: SonicBullet[];

  currentPath: PathConfig;
  forkState: ForkState;
  screenShake: ScreenShake;
  pathTransition: PathTransition;

  lightSpot: {
    x: number;
    y: number;
    radius: number;
  };
}
