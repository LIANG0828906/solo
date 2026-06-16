import * as THREE from 'three';

export enum WorkerState {
  IDLE = 'idle',
  MOVING_TO_TARGET = 'moving_to_target',
  COLLECTING = 'collecting',
  RETURNING_TO_NEST = 'returning_to_nest',
  EVACUATING = 'evacuating',
  DEAD = 'dead',
}

export interface Worker {
  id: number;
  mesh: THREE.Group;
  state: WorkerState;
  position: THREE.Vector3;
  target: THREE.Vector3 | null;
  carryingFood: boolean;
  speed: number;
  baseSpeed: number;
  lastPheromoneTime: number;
  collectStartTime: number;
  evacuateDirection: THREE.Vector3;
  evacuateEndTime: number;
}

export interface PheromonePoint {
  id: number;
  position: THREE.Vector3;
  intensity: number;
  createdAt: number;
  color: THREE.Color;
  mesh: THREE.Mesh;
}

export interface Predator {
  id: number;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  state: 'patrolling' | 'chasing';
  chaseStartTime: number;
  currentTarget: number | null;
}

export interface FoodSource {
  id: number;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  amount: number;
}

export interface CollectionTask {
  id: number;
  position: THREE.Vector3;
  assignedWorkerId: number | null;
  createdAt: number;
}

export interface GameStats {
  totalWorkers: number;
  carryingFood: number;
  foodCollected: number;
  pheromoneCount: number;
  predatorCount: number;
}

export interface PredatorEvent {
  time: string;
  timestamp: number;
}
