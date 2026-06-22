import { SpeciesType, Organism, Snapshot, AllSpeciesParams } from '../types';

const GRID_SIZE = 200;
const MAX_AGE = 80;
const PLANT_REPRODUCTION_INTERVAL = 10;
const INITIAL_ENERGY = 10;
const MOVE_ENERGY_COST = 1;
const HERBIVORE_EAT_ENERGY_GAIN = 5;
const CARNIVORE_EAT_ENERGY_GAIN = 8;

export const DEFAULT_PARAMS: AllSpeciesParams = {
  [SpeciesType.PLANT]: {
    initialCount: 50,
    moveSpeed: 0,
    reproductionThreshold: 5,
    predationEfficiency: 0,
  },
  [SpeciesType.HERBIVORE]: {
    initialCount: 50,
    moveSpeed: 1,
    reproductionThreshold: 10,
    predationEfficiency: 0.5,
  },
  [SpeciesType.CARNIVORE]: {
    initialCount: 50,
    moveSpeed: 2,
    reproductionThreshold: 15,
    predationEfficiency: 0.5,
  },
};

export class EcoEngine {
  private organisms: Organism[] = [];
  private generation: number = 0;
  private nextId: number = 1;
  private grid: (Organism | null)[][] = [];
  private params: AllSpeciesParams;

  constructor(params?: Partial<AllSpeciesParams>) {
    this.params = { ...DEFAULT_PARAMS, ...params };
    this.initializeGrid();
    this.populateInitial();
  }

  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      this.grid[y] = [];
      for (let x = 0; x < GRID_SIZE; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  private populateInitial(): void {
    this.organisms = [];
    this.initializeGrid();
    this.nextId = 1;
    this.generation = 0;

    for (const species of [SpeciesType.PLANT, SpeciesType.HERBIVORE, SpeciesType.CARNIVORE]) {
      const count = this.params[species].initialCount;
      for (let i = 0; i < count; i++) {
        this.placeOrganismRandom(species);
      }
    }
  }

  private placeOrganismRandom(species: SpeciesType): Organism | null {
    let attempts = 0;
    while (attempts < 100) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!this.grid[y][x]) {
        return this.createOrganism(species, x, y);
      }
      attempts++;
    }
    return null;
  }

  private createOrganism(species: SpeciesType, x: number, y: number): Organism {
    const organism: Organism = {
      id: this.nextId++,
      species,
      x,
      y,
      energy: INITIAL_ENERGY,
      age: 0,
    };
    this.organisms.push(organism);
    this.grid[y][x] = organism;
    return organism;
  }

  public setParams(params: AllSpeciesParams, reinitialize: boolean = false): void {
    this.params = { ...params };
    if (reinitialize) {
      this.populateInitial();
    }
  }

  public getParams(): AllSpeciesParams {
    return { ...this.params };
  }

  public addPerturbation(): void {
    const speciesTypes = [SpeciesType.PLANT, SpeciesType.HERBIVORE, SpeciesType.CARNIVORE];
    const targetSpecies = speciesTypes[Math.floor(Math.random() * speciesTypes.length)];
    const targetOrganisms = this.organisms.filter(o => o.species === targetSpecies);
    const toRemove = Math.max(1, Math.floor(targetOrganisms.length * 0.1));

    const shuffled = [...targetOrganisms].sort(() => Math.random() - 0.5);
    for (let i = 0; i < toRemove && i < shuffled.length; i++) {
      const organism = shuffled[i];
      organism.flashing = true;
      organism.flashStart = Date.now();
    }

    setTimeout(() => {
      for (let i = 0; i < toRemove && i < shuffled.length; i++) {
        this.removeOrganism(shuffled[i]);
      }
    }, 300);
  }

  private removeOrganism(organism: Organism): void {
    if (this.grid[organism.y] && this.grid[organism.y][organism.x] === organism) {
      this.grid[organism.y][organism.x] = null;
    }
    const idx = this.organisms.indexOf(organism);
    if (idx !== -1) {
      this.organisms.splice(idx, 1);
    }
  }

  private markDying(organism: Organism): void {
    organism.dying = true;
    organism.dyingStart = Date.now();
    if (this.grid[organism.y] && this.grid[organism.y][organism.x] === organism) {
      this.grid[organism.y][organism.x] = null;
    }
    setTimeout(() => {
      this.removeOrganism(organism);
    }, 500);
  }

  private getNeighbors(x: number, y: number): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],          [1, 0],
      [-1, 1], [0, 1], [1, 1],
    ];
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
        neighbors.push({ x: nx, y: ny });
      }
    }
    return neighbors;
  }

  private getEmptyNeighbors(x: number, y: number): { x: number; y: number }[] {
    return this.getNeighbors(x, y).filter(n => !this.grid[n.y][n.x]);
  }

  private moveOrganism(organism: Organism): void {
    if (organism.species === SpeciesType.PLANT) return;

    const speed = this.params[organism.species].moveSpeed;
    for (let step = 0; step < speed; step++) {
      if (organism.energy <= 0) break;

      const neighbors = this.getNeighbors(organism.x, organism.y);
      let target: { x: number; y: number } | null = null;

      if (organism.species === SpeciesType.HERBIVORE) {
        const plantNeighbor = neighbors.find(n => {
          const o = this.grid[n.y][n.x];
          return o && o.species === SpeciesType.PLANT;
        });
        if (plantNeighbor) {
          const plant = this.grid[plantNeighbor.y][plantNeighbor.x]!;
          const efficiency = this.params[SpeciesType.HERBIVORE].predationEfficiency;
          if (Math.random() < efficiency) {
            organism.energy += HERBIVORE_EAT_ENERGY_GAIN;
            this.markDying(plant);
          }
          continue;
        }
        const emptyNeighbors = neighbors.filter(n => !this.grid[n.y][n.x]);
        if (emptyNeighbors.length > 0) {
          target = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
        }
      } else if (organism.species === SpeciesType.CARNIVORE) {
        const herbivoreNeighbor = neighbors.find(n => {
          const o = this.grid[n.y][n.x];
          return o && o.species === SpeciesType.HERBIVORE;
        });
        if (herbivoreNeighbor) {
          const herbivore = this.grid[herbivoreNeighbor.y][herbivoreNeighbor.x]!;
          const efficiency = this.params[SpeciesType.CARNIVORE].predationEfficiency;
          if (Math.random() < efficiency) {
            organism.energy += CARNIVORE_EAT_ENERGY_GAIN;
            this.markDying(herbivore);
          }
          continue;
        }
        const emptyNeighbors = neighbors.filter(n => !this.grid[n.y][n.x]);
        if (emptyNeighbors.length > 0) {
          target = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
        }
      }

      if (target) {
        this.grid[organism.y][organism.x] = null;
        organism.x = target.x;
        organism.y = target.y;
        this.grid[organism.y][organism.x] = organism;
        organism.energy -= MOVE_ENERGY_COST;
      }
    }
  }

  private reproduce(organism: Organism): void {
    const threshold = this.params[organism.species].reproductionThreshold;
    if (organism.energy < threshold) return;

    if (organism.species === SpeciesType.PLANT) {
      if (this.generation % PLANT_REPRODUCTION_INTERVAL !== 0) return;
      if (Math.random() > 0.3) return;
    }

    const emptyNeighbors = this.getEmptyNeighbors(organism.x, organism.y);
    if (emptyNeighbors.length === 0) return;

    const target = emptyNeighbors[Math.floor(Math.random() * emptyNeighbors.length)];
    this.createOrganism(organism.species, target.x, target.y);
    organism.energy = Math.floor(organism.energy / 2);
  }

  public tick(): void {
    this.generation++;

    const aliveOrganisms = this.organisms.filter(o => !o.dying && !o.flashing);

    for (const organism of aliveOrganisms) {
      organism.age++;
      if (organism.age >= MAX_AGE) {
        this.markDying(organism);
        continue;
      }
      if (organism.energy <= 0 && organism.species !== SpeciesType.PLANT) {
        this.markDying(organism);
        continue;
      }
      this.moveOrganism(organism);
      this.reproduce(organism);
    }
  }

  public getSnapshot(): Snapshot {
    const counts = {
      [SpeciesType.PLANT]: 0,
      [SpeciesType.HERBIVORE]: 0,
      [SpeciesType.CARNIVORE]: 0,
    };
    const energySums = {
      [SpeciesType.PLANT]: 0,
      [SpeciesType.HERBIVORE]: 0,
      [SpeciesType.CARNIVORE]: 0,
    };
    const aliveOrganisms = this.organisms.filter(o => !o.dying);

    for (const organism of aliveOrganisms) {
      counts[organism.species]++;
      energySums[organism.species] += organism.energy;
    }

    const avgEnergy = {
      [SpeciesType.PLANT]: counts[SpeciesType.PLANT] > 0 ? energySums[SpeciesType.PLANT] / counts[SpeciesType.PLANT] : 0,
      [SpeciesType.HERBIVORE]: counts[SpeciesType.HERBIVORE] > 0 ? energySums[SpeciesType.HERBIVORE] / counts[SpeciesType.HERBIVORE] : 0,
      [SpeciesType.CARNIVORE]: counts[SpeciesType.CARNIVORE] > 0 ? energySums[SpeciesType.CARNIVORE] / counts[SpeciesType.CARNIVORE] : 0,
    };

    return {
      generation: this.generation,
      organisms: this.organisms.map(o => ({ ...o })),
      counts,
      avgEnergy,
    };
  }

  public getGeneration(): number {
    return this.generation;
  }
}
