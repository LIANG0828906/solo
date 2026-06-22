import { v4 as uuidv4 } from 'uuid';
import {
  Species,
  SpeciesType,
  EnvironmentParams,
  GenerationState,
  PopulationHistory,
  EventHandler,
} from './types';
import { eventBus } from './EventBus';
import { environmentManager } from './EnvironmentManager';

const FRAME_INTERVAL = 50;
const MAX_INITIAL_PER_SPECIES = 10;
const EXTINCTION_DURATION = 500;
const ANIMATION_DURATION = 300;
const HISTORY_INTERVAL = 10;
const CHANGE_THRESHOLD = 0.2;

export class EcosystemEngine {
  private generation: number = 0;
  private species: Species[] = [];
  private environment: EnvironmentParams;
  private populationHistory: PopulationHistory[] = [];
  private running: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;

  constructor() {
    this.environment = environmentManager.getParams();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('env:change', (params) => {
      this.environment = params;
    });

    eventBus.on('species:place', ({ type, x, y }) => {
      this.placeSpecies(type, x, y);
    });

    eventBus.on('species:remove', ({ id }) => {
      this.removeSpecies(id);
    });
  }

  placeSpecies(type: SpeciesType, x: number, y: number): void {
    const existingCount = this.species.filter(
      (s) => s.type === type && !s.isExtinct
    ).length;

    if (existingCount >= MAX_INITIAL_PER_SPECIES) {
      return;
    }

    const overlap = this.species.find(
      (s) => s.x === x && s.y === y && !s.isExtinct
    );
    if (overlap) {
      return;
    }

    const newSpecies: Species = {
      id: uuidv4(),
      type,
      x,
      y,
      population: 5,
      isExtinct: false,
      extinctionTimer: 0,
      lastPopulation: 5,
      animationTimer: 0,
    };

    this.species.push(newSpecies);
    this.emitUpdate();

    if (!this.running && this.species.length > 0) {
      this.start();
    }
  }

  removeSpecies(id: string): void {
    this.species = this.species.filter((s) => s.id !== id);
    this.emitUpdate();
  }

  getState(): GenerationState {
    return {
      generation: this.generation,
      species: this.species.map((s) => ({ ...s })),
      environment: { ...this.environment },
      populationHistory: this.populationHistory.map((h) => ({ ...h })),
    };
  }

  onUpdate(handler: EventHandler<GenerationState>): () => void {
    eventBus.on('generation:update', handler);
    return () => eventBus.off('generation:update', handler);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastFrameTime = performance.now();
    this.loop();
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private loop = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    if (elapsed >= FRAME_INTERVAL) {
      this.lastFrameTime = now - (elapsed % FRAME_INTERVAL);
      this.tick();
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private tick(): void {
    this.generation++;
    this.computeGeneration();
    this.updateAnimations();

    if (this.generation % HISTORY_INTERVAL === 0) {
      this.recordHistory();
    }

    this.emitUpdate();
  }

  private computeGeneration(): void {
    const totalPlants = this.sumPopulation(SpeciesType.PLANT);
    const totalHerbivores = this.sumPopulation(SpeciesType.HERBIVORE);
    const totalCarnivores = this.sumPopulation(SpeciesType.CARNIVORE);

    const lightFactor = this.environment.light / 2000;
    const tempOptimal = this.gaussian(this.environment.temperature, 25, 15);
    const humidityFactor = this.environment.humidity / 100;

    const tempStress =
      this.environment.temperature > 40 || this.environment.temperature < 0
        ? 0.15
        : 0;

    const plantGrowthRate = 0.08 * lightFactor * tempOptimal * (0.5 + 0.5 * humidityFactor);
    const plantMortality = 0.02;
    const herbivoreEfficiency = 0.003;
    const herbivoreMortality = 0.04 + tempStress;
    const carnivoreEfficiency = 0.004;
    const carnivoreMortality = 0.06;

    for (const sp of this.species) {
      if (sp.isExtinct) continue;

      sp.lastPopulation = sp.population;
      let delta = 0;

      switch (sp.type) {
        case SpeciesType.PLANT: {
          const competition = totalPlants > 0 ? Math.min(1, 100 / (totalPlants + 1)) : 1;
          delta = sp.population * (plantGrowthRate * competition - plantMortality);
          break;
        }
        case SpeciesType.HERBIVORE: {
          const food = totalPlants > 0 ? totalPlants / (totalHerbivores + 1) : 0;
          delta =
            sp.population * (herbivoreEfficiency * food - herbivoreMortality);
          break;
        }
        case SpeciesType.CARNIVORE: {
          const food = totalHerbivores > 0 ? totalHerbivores / (totalCarnivores + 1) : 0;
          delta =
            sp.population * (carnivoreEfficiency * food - carnivoreMortality);
          break;
        }
      }

      sp.population = Math.max(0, sp.population + delta);

      if (Math.abs(sp.population - sp.lastPopulation) / Math.max(1, sp.lastPopulation) > CHANGE_THRESHOLD) {
        sp.animationTimer = ANIMATION_DURATION;
      }

      if (sp.population < 1) {
        sp.population = 0;
        sp.isExtinct = true;
        sp.extinctionTimer = EXTINCTION_DURATION;
      }
    }

    this.spatialDiffusion();
  }

  private spatialDiffusion(): void {
    const activeSpecies = this.species.filter((s) => !s.isExtinct);

    for (const sp of activeSpecies) {
      if (sp.population > 15 && Math.random() < 0.05) {
        const directions = [
          [-1, 0],
          [1, 0],
          [0, -1],
          [0, 1],
        ];
        const dir = directions[Math.floor(Math.random() * directions.length)];
        const nx = sp.x + dir[0];
        const ny = sp.y + dir[1];

        if (nx >= 0 && nx < 20 && ny >= 0 && ny < 15) {
          const exists = this.species.find(
            (s) => s.x === nx && s.y === ny && s.type === sp.type && !s.isExtinct
          );
          if (!exists) {
            const migrants = Math.floor(sp.population * 0.3);
            if (migrants >= 1) {
              sp.population -= migrants;
              const newSp: Species = {
                id: uuidv4(),
                type: sp.type,
                x: nx,
                y: ny,
                population: migrants,
                isExtinct: false,
                extinctionTimer: 0,
                lastPopulation: migrants,
                animationTimer: ANIMATION_DURATION,
              };
              this.species.push(newSp);
            }
          }
        }
      }
    }
  }

  private updateAnimations(): void {
    this.species = this.species.filter((sp) => {
      if (sp.isExtinct) {
        sp.extinctionTimer -= FRAME_INTERVAL;
        return sp.extinctionTimer > 0;
      }
      if (sp.animationTimer > 0) {
        sp.animationTimer -= FRAME_INTERVAL;
      }
      return true;
    });
  }

  private sumPopulation(type: SpeciesType): number {
    return this.species
      .filter((s) => s.type === type && !s.isExtinct)
      .reduce((sum, s) => sum + s.population, 0);
  }

  private recordHistory(): void {
    const entry: PopulationHistory = {
      generation: this.generation,
      plants: Math.round(this.sumPopulation(SpeciesType.PLANT)),
      herbivores: Math.round(this.sumPopulation(SpeciesType.HERBIVORE)),
      carnivores: Math.round(this.sumPopulation(SpeciesType.CARNIVORE)),
    };
    this.populationHistory.push(entry);
    if (this.populationHistory.length > 100) {
      this.populationHistory.shift();
    }
  }

  private gaussian(x: number, mean: number, sigma: number): number {
    const exp = -((x - mean) ** 2) / (2 * sigma ** 2);
    return Math.exp(exp);
  }

  private emitUpdate(): void {
    eventBus.emit('generation:update', this.getState());
  }
}

export const ecosystemEngine = new EcosystemEngine();
