import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

export interface Particle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  trail: THREE.Vector3[];
}

export interface SimulationParams {
  particleCount: number;
  temperature: number;
  gravityCoeff: number;
  repulsionCoeff: number;
  isRunning: boolean;
}

export interface RenderState {
  mode: 'sphere' | 'points';
  showBonds: boolean;
  showTrails: boolean;
}

export const PARTICLE_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7'
];

export const LJ_EPSILON = 1.0;
export const LJ_SIGMA = 1.5;
export const BOUNDARY_RADIUS = 12;
export const INITIAL_RADIUS = 8;
export const PARTICLE_RADIUS = 0.3;
export const TRAIL_LENGTH = 20;
export const MAX_BONDS = 50;
export const BOND_DISTANCE = 1.0;

export function createParticle(position?: THREE.Vector3): Particle {
  const color = PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)];
  const pos = position || new THREE.Vector3(
    (Math.random() - 0.5) * 2 * INITIAL_RADIUS,
    (Math.random() - 0.5) * 2 * INITIAL_RADIUS,
    (Math.random() - 0.5) * 2 * INITIAL_RADIUS
  );
  
  while (pos.length() > INITIAL_RADIUS) {
    pos.set(
      (Math.random() - 0.5) * 2 * INITIAL_RADIUS,
      (Math.random() - 0.5) * 2 * INITIAL_RADIUS,
      (Math.random() - 0.5) * 2 * INITIAL_RADIUS
    );
  }
  
  return {
    id: uuidv4(),
    position: pos,
    velocity: new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1,
      (Math.random() - 0.5) * 0.1
    ),
    color,
    trail: []
  };
}
