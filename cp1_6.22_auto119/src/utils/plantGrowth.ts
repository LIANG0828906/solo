export interface GrowthParams {
  light: number;
  water: number;
  soil: number;
}

export type GrowthStage = 'seed' | 'germination' | 'seedling' | 'adult' | 'flowering';

export interface BranchData {
  id: string;
  height: number;
  angle: number;
  direction: number;
  length: number;
}

export interface LeafData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  colorStart: string;
  colorEnd: string;
  yellowing: number;
  curling: number;
  parentType: 'stem' | 'branch';
  parentId?: string;
}

export interface FlowerData {
  petalCount: number;
  petalSize: number;
  petalColor: string;
  centerColor: string;
  opacity: number;
}

export interface PlantMorphology {
  height: number;
  targetHeight: number;
  stemRadius: number;
  stemBend: number;
  stemColorStart: string;
  stemColorEnd: string;
  branchPoints: number[];
  branches: BranchData[];
  leaves: LeafData[];
  flower: FlowerData | null;
  stage: GrowthStage;
  leafYellowing: number;
  leafCurling: number;
  growthSpeedMultiplier: number;
  statusMessage: string;
}

export interface GrowthDataPoint {
  time: number;
  height: number;
}

const BRANCH_POINTS = [0.4, 0.8, 1.2];
const BRANCH_ANGLE = Math.PI / 6;
const STEM_COLOR_START = '#90EE90';
const STEM_COLOR_END = '#228B22';
const LEAF_COLOR_START = '#98FB98';
const LEAF_COLOR_END = '#006400';
const BASE_GROWTH_RATE = 0.02;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const parse = (c: string) => {
    const h = c.replace('#', '');
    return [
      parseInt(h.substring(0, 2), 16),
      parseInt(h.substring(2, 4), 16),
      parseInt(h.substring(4, 6), 16)
    ];
  };
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9999.1) * 10000;
  return x - Math.floor(x);
}

function determineStage(height: number): GrowthStage {
  if (height < 0.2) return 'seed';
  if (height < 0.4) return 'germination';
  if (height < 1.0) return 'seedling';
  if (height < 1.8) return 'adult';
  return 'flowering';
}

function calculateStatusMessage(params: GrowthParams, multiplier: number): string {
  if (params.light < 20) return '光照不足';
  if (params.water > 85) return '水分过多';
  if (params.water < 15) return '水分不足';
  if (params.soil < 20) return '土壤贫瘠';
  if (multiplier > 1.2) return '生长旺盛';
  if (multiplier < 0.5) return '生长缓慢';
  return '生长正常';
}

export function calculateGrowthMultiplier(params: GrowthParams): number {
  const L = 0.3 + (params.light / 100) * 1.4;
  const W = 0.2 + (params.water / 100) * 1.3;
  const S = 0.5 + (params.soil / 100) * 1.0;
  return L * W * S;
}

export function calculateTargetHeight(soil: number): number {
  return 1.0 + (soil / 100) * 2.0;
}

export function calculateStemBend(light: number): number {
  return (1 - light / 100) * 20 * (Math.PI / 180);
}

export function calculateLeafYellowing(water: number): number {
  return Math.max(0, 1 - water / 20);
}

export function calculateLeafCurling(water: number): number {
  return Math.max(0, 1 - water / 25);
}

export function calculateStemRadius(soil: number): number {
  return 0.02 * (0.6 + (soil / 100) * 0.8);
}

export function calculateFlowerPetalSize(soil: number): number {
  return 0.12 * (0.6 + (soil / 100) * 0.8);
}

export function generateBranches(height: number, bend: number): BranchData[] {
  const branches: BranchData[] = [];
  for (let i = 0; i < BRANCH_POINTS.length; i++) {
    const bp = BRANCH_POINTS[i];
    if (height > bp + 0.1) {
      const length = Math.min(0.15, (height - bp) * 0.5);
      for (let d = 0; d < 2; d++) {
        const direction = d === 0 ? 0 : Math.PI;
        const bendOffset = Math.sin(bend) * bp;
        branches.push({
          id: `branch-${i}-${d}`,
          height: bp,
          angle: BRANCH_ANGLE,
          direction: direction + (bendOffset * 0.5),
          length
        });
      }
    }
  }
  return branches;
}

export function generateLeaves(
  height: number,
  branches: BranchData[],
  bend: number,
  yellowing: number,
  curling: number
): LeafData[] {
  const leaves: LeafData[] = [];
  let seedCounter = 1;

  const stemLeafPairs = Math.floor(Math.max(0, height - 0.2) / 0.08);
  for (let i = 0; i < stemLeafPairs; i++) {
    const h = 0.25 + i * 0.08;
    if (h > height) break;
    for (let side = 0; side < 2; side++) {
      const dir = side === 0 ? 0 : Math.PI;
      const bendX = Math.sin(bend) * h;
      const bendZ = Math.cos(bend) * h - h;
      const angleY = dir + pseudoRandom(seedCounter++) * Math.PI * 0.5;
      const angleZ = (pseudoRandom(seedCounter++) - 0.5) * Math.PI * 0.5;
      const t = Math.min(1, h / 2.5);
      leaves.push({
        id: `leaf-stem-${i}-${side}`,
        position: [
          bendX + Math.sin(angleY) * 0.03,
          h,
          bendZ + Math.cos(angleY) * 0.03
        ],
        rotation: [0, angleY, angleZ],
        scale: 0.8 + t * 0.4,
        colorStart: lerpColor(LEAF_COLOR_START, '#FFD700', yellowing * 0.5),
        colorEnd: lerpColor(LEAF_COLOR_END, '#FFD700', yellowing),
        yellowing,
        curling,
        parentType: 'stem'
      });
    }
  }

  for (const branch of branches) {
    const h = branch.height;
    const bendX = Math.sin(bend) * h;
    const bendZ = Math.cos(bend) * h - h;
    for (let i = 0; i < 2; i++) {
      const baseAngle = branch.direction;
      const angleY = baseAngle + (i === 0 ? -0.3 : 0.3) + (pseudoRandom(seedCounter++) - 0.5) * 0.4;
      const angleZ = (pseudoRandom(seedCounter++) - 0.5) * Math.PI * 0.5;
      const branchDirX = Math.sin(branch.direction) * Math.sin(branch.angle);
      const branchDirZ = Math.cos(branch.direction) * Math.sin(branch.angle);
      const branchEndX = bendX + branchDirX * branch.length;
      const branchEndY = h + Math.cos(branch.angle) * branch.length;
      const branchEndZ = bendZ + branchDirZ * branch.length;
      const t = Math.min(1, h / 2.5);
      leaves.push({
        id: `leaf-${branch.id}-${i}`,
        position: [
          branchEndX + Math.sin(angleY) * 0.02,
          branchEndY,
          branchEndZ + Math.cos(angleY) * 0.02
        ],
        rotation: [0, angleY, angleZ],
        scale: 0.7 + t * 0.3,
        colorStart: lerpColor(LEAF_COLOR_START, '#FFD700', yellowing * 0.5),
        colorEnd: lerpColor(LEAF_COLOR_END, '#FFD700', yellowing),
        yellowing,
        curling,
        parentType: 'branch',
        parentId: branch.id
      });
    }
  }

  return leaves;
}

export function generateFlower(height: number, _bend: number, soil: number, stage: GrowthStage): FlowerData | null {
  if (stage !== 'flowering') return null;
  return {
    petalCount: 5,
    petalSize: calculateFlowerPetalSize(soil),
    petalColor: '#FFB6C1',
    centerColor: '#FFD700',
    opacity: Math.min(1, (height - 1.8) / 0.2)
  };
}

export function getFlowerTopPosition(height: number, bend: number): [number, number, number] {
  return [Math.sin(bend) * height, height + 0.05, (Math.cos(bend) - 1) * height];
}

export function computeMorphology(
  currentHeight: number,
  params: GrowthParams,
  deltaTime: number,
  isResetting: boolean
): PlantMorphology {
  const multiplier = calculateGrowthMultiplier(params);
  const targetHeight = calculateTargetHeight(params.soil);
  const stemBend = calculateStemBend(params.light);
  const leafYellowing = calculateLeafYellowing(params.water);
  const leafCurling = calculateLeafCurling(params.water);
  const stemRadius = calculateStemRadius(params.soil);

  let newHeight: number;
  if (isResetting) {
    newHeight = Math.max(0, currentHeight - (deltaTime * 1.0));
  } else {
    const delta = BASE_GROWTH_RATE * multiplier * deltaTime;
    newHeight = Math.min(currentHeight + delta, targetHeight);
  }

  const stage = determineStage(newHeight);
  const heightT = Math.min(1, newHeight / 2.0);
  const stemColorStart = lerpColor(STEM_COLOR_START, STEM_COLOR_END, heightT * 0.3);
  const stemColorEnd = lerpColor(STEM_COLOR_START, STEM_COLOR_END, heightT);

  const branches = generateBranches(newHeight, stemBend);
  const leaves = generateLeaves(newHeight, branches, stemBend, leafYellowing, leafCurling);
  const flower = generateFlower(newHeight, stemBend, params.soil, stage);

  const statusMessage = calculateStatusMessage(params, multiplier);

  return {
    height: newHeight,
    targetHeight,
    stemRadius,
    stemBend,
    stemColorStart,
    stemColorEnd,
    branchPoints: BRANCH_POINTS,
    branches,
    leaves,
    flower,
    stage,
    leafYellowing,
    leafCurling,
    growthSpeedMultiplier: multiplier,
    statusMessage
  };
}

export function createInitialMorphology(): PlantMorphology {
  return {
    height: 0,
    targetHeight: calculateTargetHeight(40),
    stemRadius: calculateStemRadius(40),
    stemBend: calculateStemBend(50),
    stemColorStart: STEM_COLOR_START,
    stemColorEnd: STEM_COLOR_START,
    branchPoints: BRANCH_POINTS,
    branches: [],
    leaves: [],
    flower: null,
    stage: 'seed',
    leafYellowing: 0,
    leafCurling: 0,
    growthSpeedMultiplier: calculateGrowthMultiplier({ light: 50, water: 60, soil: 40 }),
    statusMessage: '等待发芽'
  };
}

export const STAGE_LABELS: Record<GrowthStage, string> = {
  seed: '种子',
  germination: '发芽',
  seedling: '幼苗',
  adult: '成株',
  flowering: '开花'
};
