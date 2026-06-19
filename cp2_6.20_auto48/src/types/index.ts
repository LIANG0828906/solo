export interface Ingredient {
  id: string;
  name: string;
  type: 'base' | 'mixer' | 'garnish';
  color: string;
  abv: number;
  amount: number;
  unit: string;
  labelColor?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  steps: string[];
  glassType: string;
}

export interface MixStep {
  ingredientId: string;
  ingredientName: string;
  timestamp: number;
  order: number;
  type: 'base' | 'mixer' | 'garnish';
}

export interface ScoreResult {
  accuracy: number;
  stars: 1 | 2 | 3 | 4 | 5;
  starColor: 'gold' | 'silver' | 'bronze';
  feedback: string;
  timeBonus: number;
}

export interface BottleData {
  id: string;
  name: string;
  color: string;
  abv: number;
  type: 'base' | 'mixer' | 'garnish';
  labelColor?: string;
}

export type ShakerState = 'idle' | 'shaking' | 'shaken';
export type GlassState = 'empty' | 'filling' | 'filled';
