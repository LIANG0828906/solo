import { Vector3 } from 'three';

export enum BeeRole {
  WORKER = 'worker',
  NURSE = 'nurse',
  GUARD = 'guard',
  DRONE = 'drone'
}

export const BEE_COLORS: Record<BeeRole, string> = {
  [BeeRole.WORKER]: '#FF9F43',
  [BeeRole.NURSE]: '#2ED573',
  [BeeRole.GUARD]: '#FF4757',
  [BeeRole.DRONE]: '#747D8C'
};

export interface PheromoneCell {
  worker: number;
  nurse: number;
  guard: number;
  drone: number;
}

export type PheromoneGrid = PheromoneCell[][][];

export interface BeeState {
  id: number;
  position: Vector3;
  targetPosition: Vector3;
  role: BeeRole;
  pheromoneRate: number;
  speed: number;
  trail: Vector3[];
  trailTimes: number[];
}

export interface StatisticsData {
  totalBees: number;
  roleCounts: Record<BeeRole, number>;
  rolePercentages: Record<BeeRole, number>;
  health: number;
  avgPheromone: number;
}

const GRID_SIZE = 21;
const CELL_SIZE = 2;
const MAX_TRAIL_LENGTH = 15;
const TRAIL_LIFETIME = 2000;
const ROLE_TRANSITION_THRESHOLD = 60;
const ROLE_TRANSITION_PROBABILITY = 0.3;
const GUARD_TRANSITION_PROBABILITY = 0.2;
const FOOD_SIGNAL_DURATION = 10000;

let nextId = 0;

export class BeeAgent implements BeeState {
  id: number;
  position: Vector3;
  targetPosition: Vector3;
  role: BeeRole;
  pheromoneRate: number;
  speed: number;
  trail: Vector3[];
  trailTimes: number[];
  private isIdle: boolean;
  private foodSignalActive: boolean;
  private foodSignalEndTime: number;

  constructor(position: Vector3, role: BeeRole = BeeRole.WORKER) {
    this.id = nextId++;
    this.position = position.clone();
    this.targetPosition = this.generateNewTarget();
    this.role = role;
    this.pheromoneRate = 10 + Math.random() * 40;
    this.speed = 0.02 + Math.random() * 0.02;
    this.trail = [];
    this.trailTimes = [];
    this.isIdle = true;
    this.foodSignalActive = false;
    this.foodSignalEndTime = 0;
  }

  update(grid: PheromoneGrid, deltaTime: number, currentTime: number): void {
    if (this.foodSignalActive && currentTime > this.foodSignalEndTime) {
      this.foodSignalActive = false;
    }

    this.senseNeighbors(grid);
    this.decideMovement(currentTime);
    this.move(deltaTime);
    this.releasePheromone(grid);
    this.updateTrail(currentTime);
    this.checkRoleTransition(grid);
  }

  private generateNewTarget(): Vector3 {
    const halfGrid = (GRID_SIZE - 1) / 2;
    const x = (Math.random() * GRID_SIZE - halfGrid) * CELL_SIZE;
    const y = (Math.random() * GRID_SIZE - halfGrid) * CELL_SIZE;
    const z = (Math.random() * 3 - 1.5) * CELL_SIZE * 2;
    return new Vector3(x, y, z);
  }

  senseNeighbors(grid: PheromoneGrid): { worker: number; nurse: number; guard: number; drone: number } {
    const halfGrid = Math.floor(GRID_SIZE / 2);
    const gx = Math.round(this.position.x / CELL_SIZE) + halfGrid;
    const gy = Math.round(this.position.y / CELL_SIZE) + halfGrid;
    const gz = Math.round(this.position.z / (CELL_SIZE * 2)) + 1;

    let totalWorker = 0;
    let totalNurse = 0;
    let totalGuard = 0;
    let totalDrone = 0;
    let count = 0;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;
          const nx = gx + dx;
          const ny = gy + dy;
          const nz = gz + dz;
          if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && nz >= 0 && nz < 3) {
            const cell = grid[nx][ny][nz];
            totalWorker += cell.worker;
            totalNurse += cell.nurse;
            totalGuard += cell.guard;
            totalDrone += cell.drone;
            count++;
          }
        }
      }
    }

    return {
      worker: count > 0 ? totalWorker / count : 0,
      nurse: count > 0 ? totalNurse / count : 0,
      guard: count > 0 ? totalGuard / count : 0,
      drone: count > 0 ? totalDrone / count : 0
    };
  }

  decideMovement(currentTime: number): void {
    const dist = this.position.distanceTo(this.targetPosition);
    
    if (dist < 0.5) {
      if (this.role === BeeRole.GUARD && this.isAlarmActive(currentTime)) {
        this.targetPosition = new Vector3(0, 0, 0);
      } else if (this.foodSignalActive && this.role === BeeRole.WORKER) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 15 + Math.random() * 5;
        this.targetPosition = new Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius,
          this.position.z
        );
      } else {
        this.targetPosition = this.generateNewTarget();
      }
    }
  }

  private isAlarmActive(currentTime: number): boolean {
    return this.foodSignalActive && currentTime < this.foodSignalEndTime;
  }

  private move(deltaTime: number): void {
    const direction = new Vector3()
      .subVectors(this.targetPosition, this.position)
      .normalize();
    
    const speed = this.speed * (deltaTime / 16.67);
    this.position.addScaledVector(direction, speed);

    const halfGrid = (GRID_SIZE - 1) / 2 * CELL_SIZE;
    this.position.x = Math.max(-halfGrid, Math.min(halfGrid, this.position.x));
    this.position.y = Math.max(-halfGrid, Math.min(halfGrid, this.position.y));
    this.position.z = Math.max(-CELL_SIZE * 3, Math.min(CELL_SIZE * 3, this.position.z));
  }

  releasePheromone(grid: PheromoneGrid): void {
    const halfGrid = Math.floor(GRID_SIZE / 2);
    const gx = Math.round(this.position.x / CELL_SIZE) + halfGrid;
    const gy = Math.round(this.position.y / CELL_SIZE) + halfGrid;
    const gz = Math.round(this.position.z / (CELL_SIZE * 2)) + 1;

    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE && gz >= 0 && gz < 3) {
      const cell = grid[gx][gy][gz];
      const rate = this.pheromoneRate * 0.01;
      
      switch (this.role) {
        case BeeRole.WORKER:
          cell.worker = Math.min(100, cell.worker + rate);
          break;
        case BeeRole.NURSE:
          cell.nurse = Math.min(100, cell.nurse + rate);
          break;
        case BeeRole.GUARD:
          cell.guard = Math.min(100, cell.guard + rate);
          break;
        case BeeRole.DRONE:
          cell.drone = Math.min(100, cell.drone + rate);
          break;
      }
    }
  }

  private updateTrail(currentTime: number): void {
    this.trail.push(this.position.clone());
    this.trailTimes.push(currentTime);

    while (this.trail.length > MAX_TRAIL_LENGTH || 
           (this.trailTimes.length > 0 && currentTime - this.trailTimes[0] > TRAIL_LIFETIME)) {
      this.trail.shift();
      this.trailTimes.shift();
    }
  }

  checkRoleTransition(grid: PheromoneGrid): void {
    const neighbors = this.senseNeighbors(grid);

    if (this.role === BeeRole.WORKER && this.isIdle) {
      if (neighbors.nurse > ROLE_TRANSITION_THRESHOLD) {
        if (Math.random() < ROLE_TRANSITION_PROBABILITY) {
          this.role = BeeRole.NURSE;
          this.pheromoneRate = 15 + Math.random() * 35;
        }
      } else if (neighbors.guard > ROLE_TRANSITION_THRESHOLD) {
        if (Math.random() < GUARD_TRANSITION_PROBABILITY) {
          this.role = BeeRole.GUARD;
          this.pheromoneRate = 20 + Math.random() * 40;
        }
      }
    }
  }

  activateFoodSignal(duration: number = FOOD_SIGNAL_DURATION, currentTime: number): void {
    this.foodSignalActive = true;
    this.foodSignalEndTime = currentTime + duration;
  }

  getRole(): BeeRole {
    return this.role;
  }

  getState(): BeeState {
    return {
      id: this.id,
      position: this.position.clone(),
      targetPosition: this.targetPosition.clone(),
      role: this.role,
      pheromoneRate: this.pheromoneRate,
      speed: this.speed,
      trail: [...this.trail],
      trailTimes: [...this.trailTimes]
    };
  }

  static resetIdCounter(): void {
    nextId = 0;
  }
}
