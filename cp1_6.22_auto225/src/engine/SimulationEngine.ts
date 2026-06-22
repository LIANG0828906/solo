import { Vector3 } from 'three';
import { BeeAgent, BeeRole, PheromoneGrid, PheromoneCell, BeeState, StatisticsData } from './BeeAgent';

const GRID_SIZE = 21;
const CELL_SIZE = 2;
const GRID_RADIUS = 3;
const DECAY_RATE = 0.98;
const MAX_BEES = 200;
const OPTIMAL_BEES = 80;
const INITIAL_WORKERS = 40;
const INITIAL_NURSES = 10;
const INITIAL_GUARDS = 5;
const ALARM_PHEROMONE_STRENGTH = 80;
const FOOD_SIGNAL_DURATION = 10000;

export class SimulationEngine {
  private bees: BeeAgent[] = [];
  private pheromoneGrid: PheromoneGrid;
  private tempGrid: PheromoneGrid;
  private gaussianKernel: number[][][];
  private alarmActive: boolean = false;
  private alarmEndTime: number = 0;
  private foodSignalActive: boolean = false;
  private foodSignalEndTime: number = 0;

  constructor() {
    this.pheromoneGrid = this.createEmptyGrid();
    this.tempGrid = this.createEmptyGrid();
    this.gaussianKernel = this.createGaussianKernel(GRID_RADIUS);
  }

  private createEmptyGrid(): PheromoneGrid {
    const grid: PheromoneGrid = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[x] = [];
      for (let y = 0; y < GRID_SIZE; y++) {
        grid[x][y] = [];
        for (let z = 0; z < 3; z++) {
          grid[x][y][z] = {
            worker: 0,
            nurse: 0,
            guard: 0,
            drone: 0
          };
        }
      }
    }
    return grid;
  }

  private createGaussianKernel(radius: number): number[][][] {
    const kernel: number[][][] = [];
    const sigma = radius / 3;
    let sum = 0;

    for (let x = -radius; x <= radius; x++) {
      kernel[x + radius] = [];
      for (let y = -radius; y <= radius; y++) {
        kernel[x + radius][y + radius] = [];
        for (let z = -1; z <= 1; z++) {
          const dist = Math.sqrt(x * x + y * y + (z * 2) * (z * 2));
          const value = Math.exp(-(dist * dist) / (2 * sigma * sigma));
          kernel[x + radius][y + radius][z + 1] = value;
          sum += value;
        }
      }
    }

    for (let x = 0; x < kernel.length; x++) {
      for (let y = 0; y < kernel[x].length; y++) {
        for (let z = 0; z < kernel[x][y].length; z++) {
          kernel[x][y][z] /= sum;
        }
      }
    }

    return kernel;
  }

  init(): void {
    this.bees = [];
    BeeAgent.resetIdCounter();
    this.clearGrid();
    
    for (let i = 0; i < INITIAL_WORKERS; i++) {
      this.bees.push(new BeeAgent(this.getRandomPosition(3), BeeRole.WORKER));
    }
    for (let i = 0; i < INITIAL_NURSES; i++) {
      this.bees.push(new BeeAgent(this.getRandomPosition(3), BeeRole.NURSE));
    }
    for (let i = 0; i < INITIAL_GUARDS; i++) {
      this.bees.push(new BeeAgent(this.getRandomPosition(3), BeeRole.GUARD));
    }

    this.alarmActive = false;
    this.foodSignalActive = false;
  }

  private getRandomPosition(maxLayers: number = 3): Vector3 {
    const halfGrid = (GRID_SIZE - 1) / 2;
    const x = (Math.random() * GRID_SIZE - halfGrid) * CELL_SIZE;
    const y = (Math.random() * GRID_SIZE - halfGrid) * CELL_SIZE;
    const z = (Math.random() * maxLayers - (maxLayers - 1) / 2) * CELL_SIZE * 2;
    return new Vector3(x, y, z);
  }

  private clearGrid(): void {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < 3; z++) {
          this.pheromoneGrid[x][y][z] = {
            worker: 0,
            nurse: 0,
            guard: 0,
            drone: 0
          };
        }
      }
    }
  }

  update(deltaTime: number, currentTime: number): void {
    if (this.alarmActive && currentTime > this.alarmEndTime) {
      this.alarmActive = false;
    }

    if (this.foodSignalActive && currentTime > this.foodSignalEndTime) {
      this.foodSignalActive = false;
    }

    for (const bee of this.bees) {
      bee.update(this.pheromoneGrid, deltaTime, currentTime);
    }

    this.diffusePheromones();
    this.decayPheromones();
  }

  private diffusePheromones(): void {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < 3; z++) {
          this.tempGrid[x][y][z] = {
            worker: 0,
            nurse: 0,
            guard: 0,
            drone: 0
          };
        }
      }
    }

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < 3; z++) {
          const cell = this.pheromoneGrid[x][y][z];
          if (cell.worker === 0 && cell.nurse === 0 && cell.guard === 0 && cell.drone === 0) {
            continue;
          }

          for (let kx = -GRID_RADIUS; kx <= GRID_RADIUS; kx++) {
            for (let ky = -GRID_RADIUS; ky <= GRID_RADIUS; ky++) {
              for (let kz = -1; kz <= 1; kz++) {
                const nx = x + kx;
                const ny = y + ky;
                const nz = z + kz;
                
                if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && nz >= 0 && nz < 3) {
                  const weight = this.gaussianKernel[kx + GRID_RADIUS][ky + GRID_RADIUS][kz + 1];
                  const target = this.tempGrid[nx][ny][nz];
                  target.worker += cell.worker * weight;
                  target.nurse += cell.nurse * weight;
                  target.guard += cell.guard * weight;
                  target.drone += cell.drone * weight;
                }
              }
            }
          }
        }
      }
    }

    [this.pheromoneGrid, this.tempGrid] = [this.tempGrid, this.pheromoneGrid];
  }

  private decayPheromones(): void {
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < 3; z++) {
          const cell = this.pheromoneGrid[x][y][z];
          cell.worker *= DECAY_RATE;
          cell.nurse *= DECAY_RATE;
          cell.guard *= DECAY_RATE;
          cell.drone *= DECAY_RATE;
        }
      }
    }
  }

  addBees(count: number, role: BeeRole = BeeRole.WORKER): number {
    const actualCount = Math.min(count, MAX_BEES - this.bees.length);
    if (actualCount <= 0) return 0;

    for (let i = 0; i < actualCount; i++) {
      this.bees.push(new BeeAgent(this.getRandomPosition(3), role));
    }
    return actualCount;
  }

  triggerAlarm(currentTime: number): void {
    this.alarmActive = true;
    this.alarmEndTime = currentTime + 5000;

    const center = Math.floor(GRID_SIZE / 2);
    for (let dx = -3; dx <= 3; dx++) {
      for (let dy = -3; dy <= 3; dy++) {
        for (let dz = 0; dz < 3; dz++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= 3) {
            const x = center + dx;
            const y = center + dy;
            if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
              this.pheromoneGrid[x][y][dz].guard = Math.min(
                100,
                this.pheromoneGrid[x][y][dz].guard + ALARM_PHEROMONE_STRENGTH * (1 - dist / 4)
              );
            }
          }
        }
      }
    }

    for (const bee of this.bees) {
      if (bee.getRole() === BeeRole.GUARD) {
        bee.activateFoodSignal(5000, currentTime);
      }
    }
  }

  releaseFoodSignal(currentTime: number): void {
    this.foodSignalActive = true;
    this.foodSignalEndTime = currentTime + FOOD_SIGNAL_DURATION;

    for (const bee of this.bees) {
      if (bee.getRole() === BeeRole.WORKER) {
        bee.activateFoodSignal(FOOD_SIGNAL_DURATION, currentTime);
      }
    }
  }

  reset(): void {
    this.init();
  }

  getBeeStates(): BeeState[] {
    return this.bees.map(bee => bee.getState());
  }

  getPheromoneData(): PheromoneGrid {
    return this.pheromoneGrid;
  }

  getStatistics(): StatisticsData {
    const roleCounts: Record<BeeRole, number> = {
      [BeeRole.WORKER]: 0,
      [BeeRole.NURSE]: 0,
      [BeeRole.GUARD]: 0,
      [BeeRole.DRONE]: 0
    };

    for (const bee of this.bees) {
      roleCounts[bee.getRole()]++;
    }

    const totalBees = this.bees.length;
    const rolePercentages: Record<BeeRole, number> = {
      [BeeRole.WORKER]: totalBees > 0 ? (roleCounts[BeeRole.WORKER] / totalBees) * 100 : 0,
      [BeeRole.NURSE]: totalBees > 0 ? (roleCounts[BeeRole.NURSE] / totalBees) * 100 : 0,
      [BeeRole.GUARD]: totalBees > 0 ? (roleCounts[BeeRole.GUARD] / totalBees) * 100 : 0,
      [BeeRole.DRONE]: totalBees > 0 ? (roleCounts[BeeRole.DRONE] / totalBees) * 100 : 0
    };

    let totalPheromone = 0;
    let cellCount = 0;
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let z = 0; z < 3; z++) {
          const cell = this.pheromoneGrid[x][y][z];
          totalPheromone += cell.worker + cell.nurse + cell.guard + cell.drone;
          cellCount++;
        }
      }
    }
    const avgPheromone = cellCount > 0 ? totalPheromone / (cellCount * 4) : 0;

    const health = Math.min(100, Math.max(0,
      (avgPheromone / 50) * (totalBees / OPTIMAL_BEES) * 100));

    return {
      totalBees,
      roleCounts,
      rolePercentages,
      health,
      avgPheromone
    };
  }

  getTotalBees(): number {
    return this.bees.length;
  }

  getMaxBees(): number {
    return MAX_BEES;
  }

  isAlarmActive(): boolean {
    return this.alarmActive;
  }

  isFoodSignalActive(): boolean {
    return this.foodSignalActive;
  }

  getGridSize(): number {
    return GRID_SIZE;
  }

  getCellSize(): number {
    return CELL_SIZE;
  }
}
