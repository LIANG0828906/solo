export interface Vector2 {
  x: number;
  y: number;
}

export interface Ship {
  position: Vector2;
  velocity: Vector2;
  angle: number;
  angularVelocity: number;
  armor: number;
  maxArmor: number;
  energy: number;
  maxEnergy: number;
  shieldActive: boolean;
  shieldTimer: number;
  radius: number;
}

export interface Asteroid {
  id: string;
  position: Vector2;
  velocity: Vector2;
  radius: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  vertices: Vector2[];
}

export interface EnergyOrb {
  id: string;
  position: Vector2;
  radius: number;
  pulsePhase: number;
  collected: boolean;
}

export interface Particle {
  id: string;
  position: Vector2;
  velocity: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'exhaust' | 'debris' | 'celebration';
}

export interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

export interface SpaceStation {
  position: Vector2;
  radius: number;
  pulsePhase: number;
}

export interface GameState {
  status: 'playing' | 'won' | 'lost';
  score: number;
  energyCollected: number;
  energyTarget: number;
  time: number;
}

export interface ThrustInput {
  angle: number;
  magnitude: number;
}

export interface ScreenShake {
  active: boolean;
  duration: number;
  intensity: number;
  time: number;
}

export interface ArmorFlash {
  active: boolean;
  duration: number;
  frequency: number;
  time: number;
}
