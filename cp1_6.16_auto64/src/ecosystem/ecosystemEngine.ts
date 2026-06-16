import { v4 as uuidv4 } from 'uuid';
import { SPECIES_LIST, getSpeciesById, type SpeciesConfig } from './speciesConfig';

export interface TreeState {
  id: string;
  speciesId: string;
  position: { x: number; z: number };
  height: number;
  targetHeight: number;
  canopyRadius: number;
  targetCanopyRadius: number;
  health: number;
  initialHeight: number;
  negativeGrowthStreak: number;
  isDying: boolean;
  isDead: boolean;
}

export interface EnvironmentParams {
  lightIntensity: number;
  precipitation: number;
  treeDensity: number;
}

export interface ForestStatistics {
  totalCount: number;
  speciesCount: Record<string, number>;
  averageHeight: number;
  dominantSpecies: string | null;
}

const GROWTH_ANIMATION_DURATION = 0.3;
const MIN_TREE_SPACING = 2;
const COMPETITION_RADIUS = 2;
const MAX_HEIGHT_RATIO_THRESHOLD = 0.9;
const DEATH_HEIGHT_RATIO = 0.2;
const DEATH_NEGATIVE_STREAK = 3;

export class EcosystemEngine {
  private trees: TreeState[] = [];
  private environment: EnvironmentParams = {
    lightIntensity: 1.0,
    precipitation: 1.0,
    treeDensity: 50,
  };

  constructor() {
    this.initialize(50);
  }

  initialize(density: number): void {
    this.environment.treeDensity = density;
    this.trees = [];

    const areaSize = 100;
    const halfSize = areaSize / 2;
    const maxAttempts = density * 10;
    let placedCount = 0;
    let attempts = 0;

    while (placedCount < density && attempts < maxAttempts) {
      attempts++;
      const x = (Math.random() - 0.5) * areaSize;
      const z = (Math.random() - 0.5) * areaSize;

      let tooClose = false;
      for (const tree of this.trees) {
        const dx = tree.position.x - x;
        const dz = tree.position.z - z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < MIN_TREE_SPACING) {
          tooClose = true;
          break;
        }
      }

      if (tooClose) continue;

      const species = SPECIES_LIST[Math.floor(Math.random() * SPECIES_LIST.length)];
      const heightRatio = 0.3 + Math.random() * 0.4;
      const initialHeight = species.maxHeight * heightRatio;
      const initialCanopy = species.canopyRadius * heightRatio;

      this.trees.push({
        id: uuidv4(),
        speciesId: species.id,
        position: { x, z },
        height: initialHeight,
        targetHeight: initialHeight,
        canopyRadius: initialCanopy,
        targetCanopyRadius: initialCanopy,
        health: 1.0,
        initialHeight,
        negativeGrowthStreak: 0,
        isDying: false,
        isDead: false,
      });

      placedCount++;
    }
  }

  iterate(): void {
    for (const tree of this.trees) {
      if (tree.isDead) continue;

      const species = getSpeciesById(tree.speciesId);
      if (!species) continue;

      const neighborCount = this.countNeighbors(tree);

      const lightFactor = this.calculateLightFactor(tree, species);
      const waterFactor = this.calculateWaterFactor(species);
      const competitionFactor = this.calculateCompetitionFactor(neighborCount);
      const heightFactor = this.calculateHeightFactor(tree, species);

      const growthAmount =
        species.baseGrowthRate * lightFactor * waterFactor * competitionFactor * heightFactor;

      tree.targetHeight = Math.max(
        tree.initialHeight * 0.1,
        Math.min(species.maxHeight, tree.targetHeight + growthAmount)
      );

      const heightRatio = tree.targetHeight / species.maxHeight;
      tree.targetCanopyRadius = species.canopyRadius * Math.max(0.1, heightRatio);

      const normalGrowthRate = species.baseGrowthRate * this.environment.lightIntensity * this.environment.precipitation;
      const growthRatio = normalGrowthRate > 0 ? growthAmount / normalGrowthRate : 0;

      if (growthRatio >= 0.8) {
        tree.health = Math.min(1, tree.health + 0.05);
      } else if (growthRatio >= 0.5) {
        tree.health = Math.max(0.5, tree.health - 0.02);
      } else {
        tree.health = Math.max(0, tree.health - 0.08);
      }

      if (growthAmount < 0) {
        tree.negativeGrowthStreak++;
      } else {
        tree.negativeGrowthStreak = 0;
      }

      const isShrinking = tree.height < tree.initialHeight * DEATH_HEIGHT_RATIO;
      if (isShrinking && tree.negativeGrowthStreak >= DEATH_NEGATIVE_STREAK) {
        tree.isDying = true;
        tree.health = 0;
      }

      if (tree.isDying && tree.targetCanopyRadius < 0.5) {
        tree.isDead = true;
      }
    }

    this.trees = this.trees.filter((t) => !t.isDead);
  }

  private countNeighbors(tree: TreeState): number {
    let count = 0;
    for (const other of this.trees) {
      if (other.id === tree.id || other.isDead) continue;
      const dx = other.position.x - tree.position.x;
      const dz = other.position.z - tree.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < COMPETITION_RADIUS) {
        count++;
      }
    }
    return count;
  }

  private calculateLightFactor(tree: TreeState, species: SpeciesConfig): number {
    const baseLight = this.environment.lightIntensity;
    const shadeTolerance = species.shadeTolerance;
    const neighborCount = this.countNeighbors(tree);
    const shadeEffect = Math.max(0, 1 - neighborCount * 0.15 * (1 - shadeTolerance));
    return baseLight * shadeEffect;
  }

  private calculateWaterFactor(species: SpeciesConfig): number {
    const precip = this.environment.precipitation;
    const demand = species.waterDemand;
    return Math.min(1.5, precip / demand);
  }

  private calculateCompetitionFactor(neighborCount: number): number {
    if (neighborCount === 0) {
      return 1.2;
    } else if (neighborCount > 3) {
      return 0.5;
    } else {
      return 1.0;
    }
  }

  private calculateHeightFactor(tree: TreeState, species: SpeciesConfig): number {
    const heightRatio = tree.targetHeight / species.maxHeight;
    if (heightRatio >= MAX_HEIGHT_RATIO_THRESHOLD) {
      const excess = (heightRatio - MAX_HEIGHT_RATIO_THRESHOLD) / (1 - MAX_HEIGHT_RATIO_THRESHOLD);
      return Math.max(0, 1 - excess);
    }
    return 1.0;
  }

  updateAnimation(deltaTime: number): void {
    const lerpFactor = deltaTime / GROWTH_ANIMATION_DURATION;
    for (const tree of this.trees) {
      if (tree.isDead) continue;

      tree.height += (tree.targetHeight - tree.height) * Math.min(1, lerpFactor);
      tree.canopyRadius += (tree.targetCanopyRadius - tree.canopyRadius) * Math.min(1, lerpFactor);
    }
  }

  getTreesSnapshot(): TreeState[] {
    return this.trees.map((t) => ({ ...t, position: { ...t.position } }));
  }

  setEnvironment(params: Partial<EnvironmentParams>): void {
    if (params.lightIntensity !== undefined) {
      this.environment.lightIntensity = params.lightIntensity;
    }
    if (params.precipitation !== undefined) {
      this.environment.precipitation = params.precipitation;
    }
    if (params.treeDensity !== undefined && params.treeDensity !== this.environment.treeDensity) {
      this.initialize(params.treeDensity);
    }
  }

  getEnvironment(): EnvironmentParams {
    return { ...this.environment };
  }

  getStatistics(): ForestStatistics {
    const speciesCount: Record<string, number> = {};
    let totalHeight = 0;
    let aliveCount = 0;

    for (const tree of this.trees) {
      if (tree.isDead) continue;
      speciesCount[tree.speciesId] = (speciesCount[tree.speciesId] || 0) + 1;
      totalHeight += tree.height;
      aliveCount++;
    }

    let dominantSpecies: string | null = null;
    let maxCount = 0;
    for (const [speciesId, count] of Object.entries(speciesCount)) {
      if (count > maxCount) {
        maxCount = count;
        dominantSpecies = speciesId;
      }
    }

    return {
      totalCount: aliveCount,
      speciesCount,
      averageHeight: aliveCount > 0 ? totalHeight / aliveCount : 0,
      dominantSpecies,
    };
  }
}
