import { v4 as uuidv4 } from 'uuid';

export interface Genotype {
  attack: number;
  defense: number;
  speed: number;
  perception: number;
  breedThreshold: number;
  colorPreference: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

const MUTATION_RATE = 0.1;
const MUTATION_RANGE = 0.2;
const TRAIL_LENGTH = 10;
const ENERGY_COST_PER_MOVE = 0.1;
const BREED_OFFSET_RANGE = 20;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function createRandomGenotype(): Genotype {
  return {
    attack: randomRange(0, 100),
    defense: randomRange(0, 100),
    speed: randomRange(1, 5),
    perception: randomRange(20, 100),
    breedThreshold: randomRange(50, 200),
    colorPreference: randomRange(0, 360),
  };
}

function mutateGene(value: number, min: number, max: number): number {
  if (Math.random() > MUTATION_RATE) {
    return value;
  }
  const mutationAmount = value * MUTATION_RANGE;
  const mutated = value + randomRange(-mutationAmount, mutationAmount);
  return clamp(mutated, min, max);
}

function breedGenotype(parent: Genotype): Genotype {
  return {
    attack: mutateGene(parent.attack, 0, 100),
    defense: mutateGene(parent.defense, 0, 100),
    speed: mutateGene(parent.speed, 1, 5),
    perception: mutateGene(parent.perception, 20, 100),
    breedThreshold: mutateGene(parent.breedThreshold, 50, 200),
    colorPreference: mutateGene(parent.colorPreference, 0, 360),
  };
}

export class Creature {
  public id: string;
  public x: number;
  public y: number;
  public energy: number;
  public genotype: Genotype;
  public age: number;
  public isAlive: boolean;
  public vx: number;
  public vy: number;
  public trail: TrailPoint[];

  constructor(x: number, y: number, genotype?: Genotype) {
    this.id = uuidv4();
    this.x = x;
    this.y = y;
    this.energy = 100;
    this.genotype = genotype ?? createRandomGenotype();
    this.age = 0;
    this.isAlive = true;
    this.trail = [];

    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * this.genotype.speed;
    this.vy = Math.sin(angle) * this.genotype.speed;
  }

  move(deltaTime: number): void {
    if (!this.isAlive) return;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.energy -= ENERGY_COST_PER_MOVE;
    this.age += deltaTime;

    if (this.energy <= 0) {
      this.energy = 0;
      this.isAlive = false;
      return;
    }

    this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });

    if (this.trail.length > TRAIL_LENGTH) {
      this.trail.pop();
    }

    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha = 1 - i / TRAIL_LENGTH;
    }
  }

  breed(): Creature {
    const offspringGenotype = breedGenotype(this.genotype);
    const offsetX = randomRange(-BREED_OFFSET_RANGE, BREED_OFFSET_RANGE);
    const offsetY = randomRange(-BREED_OFFSET_RANGE, BREED_OFFSET_RANGE);
    const offspring = new Creature(this.x + offsetX, this.y + offsetY, offspringGenotype);
    this.energy -= this.genotype.breedThreshold;
    return offspring;
  }

  static createRandom(x: number, y: number): Creature {
    return new Creature(x, y, createRandomGenotype());
  }

  getColorHsl(): string {
    return `hsl(${this.genotype.colorPreference}, 70%, 50%)`;
  }
}
