export interface IPlantState {
  stemHeight: number;
  leafCount: number;
  budState: number;
  growthDay: number;
  isWilting: boolean;
  leafYellowing: boolean;
}

export interface IEnvironmentParams {
  lightIntensity: number;
  lightColor: string;
  waterAmount: number;
}

export enum GrowthStage {
  SEED = '种子',
  SEEDLING = '幼苗',
  ADULT = '成株',
  FLOWERING = '开花',
  WITHERING = '凋谢'
}

export type LeafStatus = '健康' | '缺光' | '水涝';
