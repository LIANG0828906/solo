export type IngredientType = 'greens' | 'tofu' | 'fish' | 'meat' | 'chili';
export type FireLevel = 'gentle' | 'medium' | 'strong';
export type StoveState = 'idle' | 'cooking' | 'completed';

export interface Ingredient {
  type: IngredientType;
  name: string;
  color: string;
  idealTime: number;
  bowlIndex: number;
}

export interface IngredientData {
  type: IngredientType;
  name: string;
  color: string;
  idealTime: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'flame' | 'smoke' | 'steam' | 'spark' | 'combo' | 'gold';
  stoveIndex?: number;
}

export interface Stove {
  index: number;
  x: number;
  y: number;
  state: StoveState;
  ingredient: IngredientType | null;
  fireLevel: FireLevel;
  cookTime: number;
  maxCookTime: number;
  startTime: number;
  elapsedTime: number;
  warningActive: boolean;
  warningCount: number;
  warningStartTime: number;
  ringActive: boolean;
  ringStartTime: number;
  flyingDish: FlyingDish | null;
}

export interface FlyingDish {
  ingredient: IngredientType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startTime: number;
  duration: number;
  arcHeight: number;
  score: number;
}

export interface CompletedDish {
  ingredient: IngredientType;
  score: number;
  x: number;
  y: number;
  placedTime: number;
  plateIndex: number;
}

export interface ScorePopup {
  score: number;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}

export interface DataPanelState {
  cookingCount: number;
  avgScore: number;
  highScoreStreak: number;
  lastUpdate: number;
}

export const INGREDIENTS_DATA: Record<IngredientType, IngredientData> = {
  greens: { type: 'greens', name: '青菜', color: '#228B22', idealTime: 8 },
  tofu: { type: 'tofu', name: '豆腐', color: '#FFFFF0', idealTime: 15 },
  fish: { type: 'fish', name: '鱼片', color: '#F5DEB3', idealTime: 10 },
  meat: { type: 'meat', name: '肉块', color: '#8B4513', idealTime: 18 },
  chili: { type: 'chili', name: '辣椒', color: '#DC143C', idealTime: 5 }
};

export const FIRE_CONFIG: Record<FireLevel, { particles: number; duration: number; color: string }> = {
  gentle: { particles: 20, duration: 20, color: 'gentle' },
  medium: { particles: 40, duration: 12, color: 'medium' },
  strong: { particles: 60, duration: 6, color: 'strong' }
};

export const STOVE_RADIUS = 60;
export const BOWL_RADIUS = 25;
export const PLATE_RADIUS = 40;
export const RING_RADIUS = 30;
