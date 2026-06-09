// 花香类型
export type FlowerType = 'osmanthus' | 'rose' | 'jasmine' | 'plum';

// 油脂类型
export type OilType = 'olive' | 'coconut' | 'almond' | 'jojoba';

// 贴纸类型
export type StickerType = 'cloud' | 'crane' | 'peony' | 'wave' | 'meander' | 'lotus';

// 步骤类型
export type StepType = 'select' | 'mix' | 'heat' | 'cool' | 'decorate' | 'complete';

// 香膏状态
export type BalmState = 'liquid' | 'solid';

// 粒子类型
export type ParticleType = 'flower' | 'oil' | 'sparkle';

// 花香配置接口
export interface Flower {
  id: FlowerType;
  name: string;
  color: string;
}

// 油脂配置接口
export interface Oil {
  id: OilType;
  name: string;
  color: string;
  gradient: string[];
}

// 贴纸配置接口
export interface Sticker {
  id: string;
  type: StickerType;
  x: number;
  y: number;
  rotation: number;
  scale: number;
}

// 贴纸类型配置接口
export interface StickerTypeConfig {
  type: StickerType;
  name: string;
}

// 步骤配置接口
export interface Step {
  type: StepType;
  name: string;
  description: string;
}

// 香膏制作状态接口
export interface PerfumeState {
  currentStep: StepType;
  selectedFlower: FlowerType | null;
  selectedOil: OilType | null;
  flowerOilRatio: number;
  fixativeAmount: number;
  thickness: number;
  transparency: number;
  heatingProgress: number;
  balmState: BalmState;
  stickers: Sticker[];
  createdAt: number;
}

// 粒子系统接口
export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: ParticleType;
}

// 主题色配置接口
export interface ThemeColors {
  background: string;
  panel: string;
  potDark: string;
  potLight: string;
  wood: string;
  gold: string;
  textPrimary: string;
  textSecondary: string;
}
