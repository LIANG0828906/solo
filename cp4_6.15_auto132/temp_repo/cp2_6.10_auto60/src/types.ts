export type ProcessStage = 'smoke' | 'pounding' | 'molding' | 'drying' | 'gilding' | 'complete';

export type MoldPattern = 'dragon' | 'phoenix' | 'pineCrane' | 'fiveFu' | 'longevity' | 'doubleCoin';

export type InkGrade = 'inferior' | 'common' | 'superior';

export interface InkBatch {
  id: string;
  pattern: MoldPattern;
  hardness: number;
  gildingCoverage: number;
  grade: InkGrade;
  createdAt: number;
  dryCompleteAt: number;
  isDried: boolean;
  isGilded: boolean;
}

export interface Order {
  id: string;
  pattern: MoldPattern;
  requiredGrade: InkGrade;
  quantity: number;
  reward: number;
  fulfilled: number;
}

export interface Materials {
  glue: number;
  pineSoot: number;
  water: number;
}

export interface RecipeTemplate {
  id: string;
  name: string;
  glueRatio: number;
  waterRatio: number;
  optimalTemp: number;
  targetHardness: number;
}

export interface ProcessData {
  currentStage: ProcessStage;
  temperature: number;
  glueAdded: boolean;
  mixtureProgress: number;
  poundingCount: number;
  hardness: number;
  hardnessHistory: number[];
  selectedMold: MoldPattern | null;
  pressingProgress: number;
  isPressing: boolean;
}
