import { v4 as uuidv4 } from 'uuid';

export interface Genotype {
  id: string;
  bodySize: number;
  skinColor: number;
  hornLength: number;
  tailType: number;
  limbLength: number;
  headSize: number;
  eyeSize: number;
  spineCurve: number;
  fitness: number;
}

export interface PopulationStats {
  mean: number[];
  std: number[];
  max: number[];
  min: number[];
}

export interface GenerationSnapshot {
  generation: number;
  population: Genotype[];
  stats: PopulationStats;
  positions: { x: number; z: number }[];
  mutationEvents: string[];
}

export const GENE_NAMES = [
  'bodySize',
  'skinColor',
  'hornLength',
  'tailType',
  'limbLength',
  'headSize',
  'eyeSize',
  'spineCurve',
] as const;

export const GENE_LABELS = [
  '体型',
  '肤色',
  '角长',
  '尾型',
  '肢长',
  '头型',
  '眼型',
  '脊柱曲度',
];

export const GENE_WEIGHTS = [0.15, 0.10, 0.15, 0.10, 0.12, 0.12, 0.13, 0.13];

const GENE_COUNT = 8;
const POPULATION_SIZE = 30;
const MAX_GENERATIONS = 20;
const TARGET_GENE_VALUE = 0.5;

export class EvolutionEngine {
  private population: Genotype[] = [];
  private generation = 0;
  private selectionPressure = 0.3;
  private mutationRate = 0.05;

  constructor(selectionPressure = 0.3, mutationRate = 0.05) {
    this.selectionPressure = selectionPressure;
    this.mutationRate = mutationRate;
  }

  setSelectionPressure(pressure: number): void {
    this.selectionPressure = Math.max(0.1, Math.min(1.0, pressure));
  }

  setMutationRate(rate: number): void {
    this.mutationRate = Math.max(0.01, Math.min(0.2, rate));
  }

  getMaxGenerations(): number {
    return MAX_GENERATIONS;
  }

  getPopulationSize(): number {
    return POPULATION_SIZE;
  }

  initializePopulation(): Genotype[] {
    this.generation = 1;
    this.population = [];

    for (let i = 0; i < POPULATION_SIZE; i++) {
      const individual = this.createRandomIndividual();
      individual.fitness = this.calculateFitness(individual);
      this.population.push(individual);
    }

    this.sortPopulation();
    return this.population;
  }

  private createRandomIndividual(): Genotype {
    return {
      id: uuidv4(),
      bodySize: Math.random(),
      skinColor: Math.random(),
      hornLength: Math.random(),
      tailType: Math.random(),
      limbLength: Math.random(),
      headSize: Math.random(),
      eyeSize: Math.random(),
      spineCurve: Math.random(),
      fitness: 0,
    };
  }

  calculateFitness(individual: Genotype): number {
    let totalFitness = 0;

    for (let i = 0; i < GENE_COUNT; i++) {
      const geneName = GENE_NAMES[i];
      const geneValue = individual[geneName];
      const weight = GENE_WEIGHTS[i];

      const distance = Math.abs(geneValue - TARGET_GENE_VALUE);
      const geneFitness = 1 - distance * 2;
      const scaledFitness = Math.pow(Math.max(0, geneFitness), 1 / this.selectionPressure);

      totalFitness += scaledFitness * weight;
    }

    return totalFitness;
  }

  calculatePopulationStats(population: Genotype[]): PopulationStats {
    const mean: number[] = new Array(GENE_COUNT).fill(0);
    const std: number[] = new Array(GENE_COUNT).fill(0);
    const max: number[] = new Array(GENE_COUNT).fill(0);
    const min: number[] = new Array(GENE_COUNT).fill(1);

    for (let i = 0; i < GENE_COUNT; i++) {
      const geneName = GENE_NAMES[i];
      let sum = 0;
      let sumSq = 0;

      for (const individual of population) {
        const value = individual[geneName];
        sum += value;
        sumSq += value * value;
        max[i] = Math.max(max[i], value);
        min[i] = Math.min(min[i], value);
      }

      mean[i] = sum / population.length;
      const variance = sumSq / population.length - mean[i] * mean[i];
      std[i] = Math.sqrt(Math.max(0, variance));
    }

    return { mean, std, max, min };
  }

  detectExtremeMutations(population: Genotype[], stats: PopulationStats): string[] {
    const mutations: string[] = [];

    for (const individual of population) {
      for (let i = 0; i < GENE_COUNT; i++) {
        const geneName = GENE_NAMES[i];
        const value = individual[geneName];
        const mean = stats.mean[i];
        const std = stats.std[i];

        if (std > 0) {
          const zScore = Math.abs((value - mean) / std);
          if (zScore > 3) {
            mutations.push(individual.id);
            break;
          }
        }
      }
    }

    return mutations;
  }

  private sortPopulation(): void {
    this.population.sort((a, b) => b.fitness - a.fitness);
  }

  private rouletteWheelSelection(): Genotype {
    const totalFitness = this.population.reduce((sum, ind) => sum + ind.fitness, 0);

    if (totalFitness <= 0) {
      return this.population[Math.floor(Math.random() * this.population.length)];
    }

    let random = Math.random() * totalFitness;

    for (const individual of this.population) {
      random -= individual.fitness;
      if (random <= 0) {
        return individual;
      }
    }

    return this.population[this.population.length - 1];
  }

  private singlePointCrossover(parent1: Genotype, parent2: Genotype): Genotype {
    const crossoverPoint = Math.floor(Math.random() * GENE_COUNT);
    const child: Genotype = {
      id: uuidv4(),
      bodySize: 0,
      skinColor: 0,
      hornLength: 0,
      tailType: 0,
      limbLength: 0,
      headSize: 0,
      eyeSize: 0,
      spineCurve: 0,
      fitness: 0,
    };

    for (let i = 0; i < GENE_COUNT; i++) {
      const geneName = GENE_NAMES[i];
      child[geneName] = i < crossoverPoint ? parent1[geneName] : parent2[geneName];
    }

    return child;
  }

  private gaussianMutation(individual: Genotype): Genotype {
    const mutated = { ...individual };

    for (let i = 0; i < GENE_COUNT; i++) {
      if (Math.random() < this.mutationRate) {
        const geneName = GENE_NAMES[i];
        const mutation = this.randomGaussian() * 0.15;
        mutated[geneName] = Math.max(0, Math.min(1, mutated[geneName] + mutation));
      }
    }

    return mutated;
  }

  private randomGaussian(): number {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  generateNextGeneration(): {
    population: Genotype[];
    generation: number;
    stats: PopulationStats;
    mutationEvents: string[];
    isComplete: boolean;
  } {
    this.generation++;

    const newPopulation: Genotype[] = [];

    const elitismCount = Math.max(1, Math.floor(POPULATION_SIZE * 0.1));
    for (let i = 0; i < elitismCount; i++) {
      newPopulation.push({ ...this.population[i], id: uuidv4() });
    }

    while (newPopulation.length < POPULATION_SIZE) {
      const parent1 = this.rouletteWheelSelection();
      const parent2 = this.rouletteWheelSelection();

      let child = this.singlePointCrossover(parent1, parent2);
      child = this.gaussianMutation(child);
      child.fitness = this.calculateFitness(child);

      newPopulation.push(child);
    }

    this.population = newPopulation;
    this.sortPopulation();

    const stats = this.calculatePopulationStats(this.population);
    const mutationEvents = this.detectExtremeMutations(this.population, stats);
    const isComplete = this.generation >= MAX_GENERATIONS;

    return {
      population: this.population,
      generation: this.generation,
      stats,
      mutationEvents,
      isComplete,
    };
  }

  calculateCircularPositions(radius = 10): { x: number; z: number }[] {
    const positions: { x: number; z: number }[] = [];

    for (let i = 0; i < this.population.length; i++) {
      const angle = (i / this.population.length) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      positions.push({ x, z });
    }

    return positions;
  }

  getCurrentGeneration(): number {
    return this.generation;
  }

  getCurrentPopulation(): Genotype[] {
    return this.population;
  }
}
