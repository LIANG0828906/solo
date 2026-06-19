export interface EnvParams {
  light: number;
  water: number;
  temperature: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export interface GeneWeights {
  stemHeight: number;
  branchDensity: number;
  leafSize: number;
  flowerColor: number;
  fruitTexture: number;
}

export type GrowthStage = 'seed' | 'vegetative' | 'reproductive' | 'fruiting';

export interface PhenotypeModifier {
  leafColorTint: string;
  leafCurlAmount: number;
  stemShrinkFactor: number;
  stemWrinkling: number;
  leafTranslucency: number;
  leafEdgeColor: string;
  leafBurnEdge: boolean;
}

export interface StemSegment {
  length: number;
  radius: number;
  yOffset: number;
  rotation: [number, number, number];
}

export interface LeafData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  baseColor: string;
  curl: number;
  size: number;
  appearAt: number;
}

export interface FlowerData {
  id: string;
  position: [number, number, number];
  scale: number;
  color: string;
  bloom: number;
  appearAt: number;
}

export interface FruitData {
  id: string;
  position: [number, number, number];
  scale: number;
  color: string;
  ripeness: number;
  appearAt: number;
}

export interface PlantState {
  currentHeight: number;
  stage: GrowthStage;
  stageProgress: number;
  stems: StemSegment[];
  leaves: LeafData[];
  flowers: FlowerData[];
  fruits: FruitData[];
  phenotype: PhenotypeModifier;
  haloPulse: number;
}

export interface PlantInstance {
  id: string;
  slotIndex: number;
  tagColor: string;
  tagLabel: 'P' | 'M' | 'F';
  parentIds: [string?, string?];
  geneWeights: GeneWeights;
  growthTime: number;
  state: PlantState;
}

export type LogType = 'env' | 'breed' | 'stage';

export interface LogEntry {
  id: string;
  time: number;
  type: LogType;
  message: string;
  detail?: Record<string, unknown>;
}

export const SLOT_POSITIONS: Array<[number, number, number]> = [
  [0, 0, 0],
  [4, 0, 0],
  [-4, 0, 0],
  [0, 0, 4],
  [0, 0, -4],
];

export const TAG_COLORS = {
  parent: '#E91E63',
  mother: '#2196F3',
  filial: '#4CAF50',
};

export const GENE_KEYS: Array<keyof GeneWeights> = [
  'stemHeight',
  'branchDensity',
  'leafSize',
  'flowerColor',
  'fruitTexture',
];

export const GENE_LABELS: Record<keyof GeneWeights, string> = {
  stemHeight: '主茎高度',
  branchDensity: '分枝密度',
  leafSize: '叶片大小',
  flowerColor: '花色倾向',
  fruitTexture: '果实质地',
};

export const STAGE_DURATIONS = {
  seed: 5,
  vegetative: 15,
  reproductive: 15,
  fruiting: 15,
};

export const TOTAL_GROWTH_TIME = Object.values(STAGE_DURATIONS).reduce(
  (a, b) => a + b,
  0
);
