import type {
  EnvParams,
  GeneWeights,
  GrowthStage,
  LeafData,
  PhenotypeModifier,
  PlantState,
  StemSegment,
  FlowerData,
  FruitData,
} from './types';
import { STAGE_DURATIONS, TOTAL_GROWTH_TIME } from './types';
import { calculatePhotosyntheticEfficiency, lerpColor } from './envParams';

const BASE_LEAF_COLOR = '#2E7D32';
const YELLOW_LEAF = '#FDD835';
const BURN_EDGE = '#BF360C';
const PURPLE_EDGE = '#6A1B9A';
const YELLOW_EDGE = '#FFB300';
const WHITE_FLOWER = '#FFFFFF';
const RED_FLOWER = '#F44336';
const GREEN_FRUIT = '#7CB342';
const RIPE_FRUIT = '#F44336';

export function getStageAtTime(t: number): {
  stage: GrowthStage;
  stageProgress: number;
  stageElapsed: number;
} {
  if (t < STAGE_DURATIONS.seed) {
    return {
      stage: 'seed',
      stageProgress: t / STAGE_DURATIONS.seed,
      stageElapsed: t,
    };
  }
  let acc = STAGE_DURATIONS.seed;
  if (t < acc + STAGE_DURATIONS.vegetative) {
    const elapsed = t - acc;
    return {
      stage: 'vegetative',
      stageProgress: elapsed / STAGE_DURATIONS.vegetative,
      stageElapsed: elapsed,
    };
  }
  acc += STAGE_DURATIONS.vegetative;
  if (t < acc + STAGE_DURATIONS.reproductive) {
    const elapsed = t - acc;
    return {
      stage: 'reproductive',
      stageProgress: elapsed / STAGE_DURATIONS.reproductive,
      stageElapsed: elapsed,
    };
  }
  acc += STAGE_DURATIONS.reproductive;
  const elapsed = Math.min(t - acc, STAGE_DURATIONS.fruiting);
  return {
    stage: 'fruiting',
    stageProgress: elapsed / STAGE_DURATIONS.fruiting,
    stageElapsed: elapsed,
  };
}

export function computeTargetPhenotype(env: EnvParams): PhenotypeModifier {
  let leafColorTint = BASE_LEAF_COLOR;
  if (env.light < 20) {
    const t = (20 - env.light) / 20;
    leafColorTint = lerpColor(BASE_LEAF_COLOR, YELLOW_LEAF, t);
  } else if (env.light > 80) {
    const t = Math.min(1, (env.light - 80) / 20);
    leafColorTint = lerpColor(BASE_LEAF_COLOR, BURN_EDGE, t * 0.5);
  }

  let leafCurlAmount = 0;
  if (env.water < 30) {
    leafCurlAmount = (30 - env.water) / 30;
  }

  let stemShrinkFactor = 1;
  let leafBurnEdge = false;
  if (env.light > 80) {
    stemShrinkFactor = 1 - ((env.light - 80) / 20) * 0.25;
    leafBurnEdge = true;
  }

  let stemWrinkling = 0;
  if (env.water < 30) {
    stemWrinkling = (30 - env.water) / 30;
  }

  let leafTranslucency = 0;
  if (env.water > 80) {
    leafTranslucency = Math.min(0.5, (env.water - 80) / 20);
  }

  let leafEdgeColor = 'transparent';
  if (env.ph < 5.0) {
    const t = (5.0 - env.ph) / 1.0;
    leafEdgeColor = lerpColor('transparent', PURPLE_EDGE, t);
  } else if (env.ph > 7.5) {
    const t = Math.min(1, (env.ph - 7.5) / 0.5);
    leafEdgeColor = lerpColor('transparent', YELLOW_EDGE, t);
  }

  return {
    leafColorTint,
    leafCurlAmount,
    stemShrinkFactor,
    stemWrinkling,
    leafTranslucency,
    leafEdgeColor,
    leafBurnEdge,
  };
}

export function lerpPhenotype(
  current: PhenotypeModifier,
  target: PhenotypeModifier,
  dt: number,
  blendTime = 15
): PhenotypeModifier {
  const t = Math.min(1, dt / blendTime);
  return {
    leafColorTint: lerpColor(current.leafColorTint, target.leafColorTint, t),
    leafCurlAmount: current.leafCurlAmount + (target.leafCurlAmount - current.leafCurlAmount) * t,
    stemShrinkFactor: current.stemShrinkFactor + (target.stemShrinkFactor - current.stemShrinkFactor) * t,
    stemWrinkling: current.stemWrinkling + (target.stemWrinkling - current.stemWrinkling) * t,
    leafTranslucency: current.leafTranslucency + (target.leafTranslucency - current.leafTranslucency) * t,
    leafEdgeColor: lerpColor(current.leafEdgeColor === 'transparent' ? '#00000000' : current.leafEdgeColor,
      target.leafEdgeColor === 'transparent' ? '#00000000' : target.leafEdgeColor, t),
    leafBurnEdge: target.leafBurnEdge,
  };
}

function seededRandom(seed: number): () => number {
  let s = seed || 1;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function buildStems(
  gene: GeneWeights,
  totalHeight: number,
  stage: GrowthStage
): StemSegment[] {
  const stems: StemSegment[] = [];
  const segmentCount = stage === 'seed' ? 1 : Math.max(2, Math.round(4 + gene.branchDensity * 4));
  let accY = 0;
  for (let i = 0; i < segmentCount; i++) {
    const ratio = (i + 1) / segmentCount;
    const segLen = (totalHeight / segmentCount) * (0.8 + ratio * 0.4);
    const radius = 0.12 * (1 - i * 0.08);
    stems.push({
      length: segLen,
      radius: Math.max(0.04, radius),
      yOffset: accY,
      rotation: [0, 0, 0],
    });
    accY += segLen;
  }
  return stems;
}

function buildLeaves(
  gene: GeneWeights,
  totalHeight: number,
  stage: GrowthStage,
  stageProgress: number,
  rand: () => number,
  growthTime: number
): LeafData[] {
  const leaves: LeafData[] = [];
  if (stage === 'seed') {
    if (stageProgress > 0.5) {
      const scale = gene.leafSize * 0.6 * (stageProgress - 0.5) * 2;
      leaves.push({
        id: 'l-seed',
        position: [0, totalHeight * 0.6, 0],
        rotation: [Math.PI / 4, 0, 0],
        scale: [scale, 1, scale],
        baseColor: BASE_LEAF_COLOR,
        curl: 0,
        size: gene.leafSize,
        appearAt: 2.5,
      });
    }
    return leaves;
  }

  const baseCount = Math.round(3 + gene.branchDensity * 10);
  for (let i = 0; i < baseCount; i++) {
    const appearAt = 5 + (i / baseCount) * 15;
    if (growthTime < appearAt - 0.5) continue;
    const yRatio = 0.2 + (i / baseCount) * 0.7;
    const y = totalHeight * yRatio;
    const angle = (i / baseCount) * Math.PI * 2 + rand() * 0.4;
    const dist = 0.1 + rand() * 0.2;
    const size = (0.5 + gene.leafSize * 1.3) * (0.8 + rand() * 0.4);
    const grow = Math.min(1, (growthTime - appearAt + 0.5) / 1.5);
    leaves.push({
      id: `l-${i}`,
      position: [Math.cos(angle) * dist, y, Math.sin(angle) * dist],
      rotation: [Math.PI / 3 + rand() * 0.3, angle, rand() * 0.3],
      scale: [size * grow, 1, size * grow],
      baseColor: BASE_LEAF_COLOR,
      curl: 0,
      size: gene.leafSize,
      appearAt,
    });
  }
  return leaves;
}

function buildFlowers(
  gene: GeneWeights,
  totalHeight: number,
  stage: GrowthStage,
  stageProgress: number,
  rand: () => number,
  growthTime: number
): FlowerData[] {
  const flowers: FlowerData[] = [];
  if (stage !== 'reproductive' && stage !== 'fruiting') return flowers;

  const flowerCount = Math.round(1 + gene.branchDensity * 4);
  const baseAppear = 20;
  for (let i = 0; i < flowerCount; i++) {
    const appearAt = baseAppear + (i / flowerCount) * 8;
    if (growthTime < appearAt - 0.3) continue;
    const yRatio = 0.75 + (i / flowerCount) * 0.25;
    const y = totalHeight * yRatio;
    const angle = (i / flowerCount) * Math.PI * 2 + rand() * 0.3;
    const dist = 0.15 + rand() * 0.1;
    const t = gene.flowerColor;
    const color = lerpColor(WHITE_FLOWER, RED_FLOWER, t);
    const localProgress = stage === 'reproductive'
      ? Math.min(1, (growthTime - appearAt + 0.3) / 3)
      : Math.max(0, 1 - (growthTime - 35) / 2);
    flowers.push({
      id: `f-${i}`,
      position: [Math.cos(angle) * dist, y, Math.sin(angle) * dist],
      scale: 0.4 * localProgress,
      color,
      bloom: localProgress,
      appearAt,
    });
  }
  return flowers;
}

function buildFruits(
  gene: GeneWeights,
  totalHeight: number,
  stage: GrowthStage,
  stageProgress: number,
  _rand: () => number,
  growthTime: number
): FruitData[] {
  const fruits: FruitData[] = [];
  if (stage !== 'fruiting') return fruits;

  const fruitCount = Math.round(1 + gene.branchDensity * 2);
  const baseAppear = 35;
  for (let i = 0; i < fruitCount; i++) {
    const appearAt = baseAppear + i * 1.5;
    if (growthTime < appearAt - 0.3) continue;
    const yRatio = 0.75 + (i / fruitCount) * 0.2;
    const y = totalHeight * yRatio;
    const angle = (i / fruitCount) * Math.PI * 2;
    const dist = 0.12;
    const localProgress = Math.min(1, (growthTime - appearAt + 0.3) / 5);
    const ripeness = Math.min(1, (growthTime - appearAt) / 10);
    const color = lerpColor(GREEN_FRUIT, RIPE_FRUIT, ripeness);
    fruits.push({
      id: `fr-${i}`,
      position: [Math.cos(angle) * dist, y, Math.sin(angle) * dist],
      scale: (0.3 + gene.fruitTexture * 0.3) * localProgress,
      color,
      ripeness,
      appearAt,
    });
  }
  return fruits;
}

export function calculateTotalHeight(
  gene: GeneWeights,
  growthTime: number,
  phenotype: PhenotypeModifier
): number {
  const eff = calculatePhotosyntheticEfficiency({ light: 50, water: 60, temperature: 22, ph: 6.2, nitrogen: 50, phosphorus: 50, potassium: 50 });
  const t = Math.min(growthTime, TOTAL_GROWTH_TIME);
  let height: number;
  if (t < 5) {
    height = 3 * (t / 5);
  } else if (t < 20) {
    height = 3 + 9 * ((t - 5) / 15);
  } else {
    height = 12;
  }
  const geneMod = 0.6 + gene.stemHeight * 0.8;
  return height * geneMod * phenotype.stemShrinkFactor * (0.7 + eff * 0.6);
}

export interface GrowthStepInput {
  plantId: string;
  geneWeights: GeneWeights;
  growthTime: number;
  prevState: PlantState | null;
  env: EnvParams;
  dt: number;
}

export function growthStep(input: GrowthStepInput): {
  state: PlantState;
  stageChanged: boolean;
  prevStage: GrowthStage | null;
} {
  const { plantId, geneWeights, growthTime, prevState, env, dt } = input;
  const rand = seededRandom(
    plantId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  );

  const targetPheno = computeTargetPhenotype(env);
  const currentPheno = prevState?.phenotype ?? targetPheno;
  const phenotype = lerpPhenotype(currentPheno, targetPheno, dt);

  const prevStage = prevState?.stage ?? null;
  const { stage, stageProgress } = getStageAtTime(growthTime);

  const totalHeight = calculateTotalHeight(geneWeights, growthTime, phenotype);
  const stems = buildStems(geneWeights, totalHeight, stage);
  const leaves = buildLeaves(
    geneWeights,
    totalHeight,
    stage,
    stageProgress,
    rand,
    growthTime
  );
  const flowers = buildFlowers(
    geneWeights,
    totalHeight,
    stage,
    stageProgress,
    rand,
    growthTime
  );
  const fruits = buildFruits(
    geneWeights,
    totalHeight,
    stage,
    stageProgress,
    rand,
    growthTime
  );

  let haloPulse = prevState?.haloPulse ?? 0;
  const stageChanged = prevStage !== null && prevStage !== stage;
  if (stageChanged) {
    haloPulse = 0.5;
  } else if (haloPulse > 0) {
    haloPulse = Math.max(0, haloPulse - dt);
  }

  return {
    state: {
      currentHeight: totalHeight,
      stage,
      stageProgress,
      stems,
      leaves,
      flowers,
      fruits,
      phenotype,
      haloPulse,
    },
    stageChanged,
    prevStage,
  };
}

export function createInitialPlantState(): PlantState {
  const phenotype = computeTargetPhenotype({
    light: 50, water: 60, temperature: 22, ph: 6.2,
    nitrogen: 50, phosphorus: 50, potassium: 50,
  });
  return {
    currentHeight: 0,
    stage: 'seed',
    stageProgress: 0,
    stems: [],
    leaves: [],
    flowers: [],
    fruits: [],
    phenotype,
    haloPulse: 0,
  };
}
