import * as THREE from 'three';

export type GameState = 'menu' | 'playing' | 'gameover';

export type PowerUpType = 'speed' | 'shield' | 'double';

export type ObstacleType = 'barrier' | 'wreck' | 'dynamicTruck';

export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface ObstacleData {
  id: string;
  type: ObstacleType;
  position: THREE.Vector3;
  mesh: THREE.Mesh | THREE.Group;
  aabb: AABB;
  isDynamic?: boolean;
  warningActive?: boolean;
  moveDirection?: number;
}

export interface PowerUpData {
  id: string;
  type: PowerUpType;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  aabb: AABB;
}

export interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  color: THREE.Color;
  type: 'debris' | 'glow' | 'speedline';
}

export interface RoadSegment {
  id: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  length: number;
  curve: number;
  hasHill: boolean;
}

export const POWERUP_COLORS: Record<PowerUpType, number> = {
  speed: 0x00BFFF,
  shield: 0x00FF7F,
  double: 0xFFD700,
};

export const POWERUP_SCORES: Record<PowerUpType, number> = {
  speed: 50,
  shield: 80,
  double: 150,
};

export const POWERUP_DURATIONS: Record<PowerUpType, number> = {
  speed: 3,
  shield: 5,
  double: 10,
};

export const POWERUP_LABELS: Record<PowerUpType, string> = {
  speed: 'S',
  shield: 'D',
  double: '2x',
};
