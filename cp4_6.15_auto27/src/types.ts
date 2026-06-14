export type TeaVariety =
  | '绿茶'
  | '红茶'
  | '乌龙茶'
  | '白茶'
  | '黄茶'
  | '黑茶'
  | '普洱'
  | '再加工茶';

export type Season = '春' | '夏' | '秋' | '冬';

export type PourMethod = '高冲' | '低冲' | '环绕' | '定点';

export type Vessel = '盖碗' | '紫砂壶' | '玻璃杯' | '瓷杯';

export type LiquorColor = '金黄' | '橙黄' | '浅绿' | '红褐' | '深褐' | '其他';

export type Taste = '甘甜' | '苦涩' | '醇厚' | '鲜爽' | '滑润' | '其他';

export type StarScore = 1 | 2 | 3 | 4 | 5;

export interface Tea {
  id: string;
  name: string;
  province: string;
  city: string;
  region: string;
  variety: TeaVariety;
  year: number;
  season: Season;
  processType: string;
  appearance: string;
  photos: string[];
  description: string;
  lastBrewDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BrewRecord {
  id: string;
  teaId: string;
  temperature: number;
  teaAmount: number;
  brewTime: number;
  brewCount: number;
  pourMethod: PourMethod;
  vessel: Vessel;
  createdAt: string;
}

export interface TastingNote {
  id: string;
  brewRecordId: string;
  dryAroma: string;
  liquorColor: LiquorColor;
  wetAroma: string;
  taste: Taste;
  huiganScore: StarScore;
  leafCompleteness: StarScore;
  leafUniformity: StarScore;
  notes: string;
  overallScore: number;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  teaIds: string[];
  sortOrder: number;
  createdAt: string;
}

export interface TeaFilters {
  variety?: TeaVariety | '';
  province?: string;
  city?: string;
  region?: string;
  year?: number | '';
}
