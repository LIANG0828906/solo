import type { GeneWeights } from './types';
import { GENE_KEYS } from './types';

export function createDefaultGeneWeights(): GeneWeights {
  return {
    stemHeight: 0.6,
    branchDensity: 0.5,
    leafSize: 0.55,
    flowerColor: 0.4,
    fruitTexture: 0.5,
  };
}

export function createRandomGeneWeights(): GeneWeights {
  return {
    stemHeight: Math.random(),
    branchDensity: Math.random(),
    leafSize: Math.random(),
    flowerColor: Math.random(),
    fruitTexture: Math.random(),
  };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function hybridize(
  parentA: GeneWeights,
  parentB: GeneWeights,
  mutationRate = 0.05,
  mutationMagnitude = 0.2
): GeneWeights {
  const result: Partial<GeneWeights> = {} as GeneWeights;
  for (const key of GENE_KEYS) {
    const fromA = Math.random() < 0.5;
    let value = fromA ? parentA[key] : parentB[key];
    if (Math.random() < mutationRate) {
      const direction = Math.random() < 0.5 ? -1 : 1;
      value = value * (1 + direction * Math.random() * mutationMagnitude);
    }
    result[key] = clamp(value);
  }
  return result as GeneWeights;
}

export function mutate(
  genes: GeneWeights,
  mutationMagnitude = 0.2
): GeneWeights {
  const result: Partial<GeneWeights> = {} as GeneWeights;
  for (const key of GENE_KEYS) {
    const direction = Math.random() < 0.5 ? -1 : 1;
    result[key] = clamp(
      genes[key] * (1 + direction * Math.random() * mutationMagnitude)
    );
  }
  return result as GeneWeights;
}

export function cloneGenes(genes: GeneWeights): GeneWeights {
  return { ...genes };
}

export function lerpGenes(
  a: GeneWeights,
  b: GeneWeights,
  t: number
): GeneWeights {
  const result: Partial<GeneWeights> = {} as GeneWeights;
  for (const key of GENE_KEYS) {
    result[key] = a[key] + (b[key] - a[key]) * t;
  }
  return result as GeneWeights;
}

export function geneDistance(a: GeneWeights, b: GeneWeights): number {
  let sum = 0;
  for (const key of GENE_KEYS) {
    sum += Math.pow(a[key] - b[key], 2);
  }
  return Math.sqrt(sum);
}
