export type GrowthStage = 0 | 1 | 2 | 3 | 4;

export type LogActionType = '浇水' | '施肥' | '除虫' | '修剪' | '观察';

export type SymbiosisType = 'beneficial' | 'harmful' | 'neutral';

export interface PlantSpecies {
  id: string;
  name: string;
  color: string;
  growthDays: number;
  lightNeed: '全日照' | '半日照' | '耐阴';
  icon: string;
}

export interface LogEntry {
  id: string;
  date: string;
  type: LogActionType;
  content: string;
}

export interface Plant {
  id: string;
  speciesId: string;
  customName?: string;
  plantDate: string;
  stage: GrowthStage;
  notes: string;
  gridIndex: number;
  logs: LogEntry[];
}

export interface SymbiosisRelation {
  speciesA: string;
  speciesB: string;
  type: SymbiosisType;
  reason: string;
}

export interface SymbiosisPartnerInfo {
  speciesId: string;
  type: SymbiosisType;
  reason: string;
}

export interface AdviceItem {
  id: string;
  speciesA: string;
  speciesB: string;
  reason: string;
}

export const GROWTH_STAGE_NAMES: string[] = ['播种', '发芽', '幼苗', '成熟', '收获/开花'];

export const GROWTH_STAGE_GRADIENTS: string[] = [
  'linear-gradient(90deg, #A5D6A7, #81C784)',
  'linear-gradient(90deg, #81C784, #66BB6A)',
  'linear-gradient(90deg, #66BB6A, #4CAF50)',
  'linear-gradient(90deg, #FFB74D, #FF9800)',
  'linear-gradient(90deg, #FF8A65, #F4511E)',
];
