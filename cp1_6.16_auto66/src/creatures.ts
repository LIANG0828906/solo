export type CreatureType = 'producer' | 'consumer' | 'decomposer';

export interface CreatureConfig {
  initialEnergy: number;
  baseSpeed: number;
  reproductionThreshold: number;
  radius: number;
  color: string;
  glowColor: string;
  energyDecayPerSecond: number;
}

export const CREATURE_CONFIGS: Record<CreatureType, CreatureConfig> = {
  producer: {
    initialEnergy: 100,
    baseSpeed: 0,
    reproductionThreshold: 150,
    radius: 10,
    color: '#00ff88',
    glowColor: 'rgba(0, 255, 136, 0.5)',
    energyDecayPerSecond: 0.5,
  },
  consumer: {
    initialEnergy: 80,
    baseSpeed: 60,
    reproductionThreshold: 120,
    radius: 12,
    color: '#ff6b6b',
    glowColor: 'rgba(255, 107, 107, 0.5)',
    energyDecayPerSecond: 1.0,
  },
  decomposer: {
    initialEnergy: 60,
    baseSpeed: 45,
    reproductionThreshold: 100,
    radius: 9,
    color: '#a0a0a0',
    glowColor: 'rgba(160, 160, 160, 0.5)',
    energyDecayPerSecond: 0.7,
  },
};

export interface Creature {
  id: string;
  type: CreatureType;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  energy: number;
  speed: number;
  rotation: number;
  isAlive: boolean;
  deathTime: number | null;
  trail: { x: number; y: number; alpha: number }[];
  lastEnergyGain: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface LogEvent {
  id: string;
  timestamp: number;
  message: string;
  type: 'eat' | 'decompose' | 'reproduce' | 'death';
}

export interface EcosystemStats {
  producerCount: number;
  consumerCount: number;
  decomposerCount: number;
  corpseCount: number;
  totalEnergy: number;
}

export interface EcosystemSnapshot {
  creatures: Creature[];
  corpses: Creature[];
  particles: Particle[];
  stats: EcosystemStats;
  events: LogEvent[];
}

export interface EcosystemParams {
  poolWidth: number;
  poolHeight: number;
  energyDecayRate: number;
  reproductionThresholdMultiplier: number;
  movementSpeedMultiplier: number;
}

export const DEFAULT_PARAMS: EcosystemParams = {
  poolWidth: 800,
  poolHeight: 600,
  energyDecayRate: 0.5,
  reproductionThresholdMultiplier: 1.0,
  movementSpeedMultiplier: 5,
};
