export interface Gear {
  id: string;
  x: number;
  y: number;
  radius: number;
  teeth: number;
  rotationAngle: number;
  isActive: boolean;
  linkedTo: string[];
  isError?: boolean;
  errorStartTime?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Glow {
  id: string;
  x: number;
  y: number;
  radius: number;
  life: number;
  maxLife: number;
}

export interface Store {
  gears: Gear[];
  particles: Particle[];
  glows: Glow[];
  rotationSpeed: number;
  gaugeValue: number;
  isRunning: boolean;
  addGear: (gear: Omit<Gear, 'id' | 'rotationAngle' | 'isActive' | 'linkedTo'>) => void;
  removeGear: (id: string) => void;
  updateGearPosition: (id: string, x: number, y: number) => void;
  checkMeshing: () => void;
  startEngine: () => void;
  stopEngine: () => void;
  updateRotation: (deltaTime: number) => void;
  addParticles: (x: number, y: number, count: number) => void;
  addGlow: (x: number, y: number, radius: number) => void;
  updateEffects: (deltaTime: number) => void;
  updateGauge: () => void;
  setGearError: (id: string) => void;
}
