export type IngredientType = 'flour' | 'milk' | 'egg' | 'sugar' | 'butter' | 'salt' | 'yeast';

export interface IngredientRatio {
  flour: number;
  milk: number;
  egg: number;
  sugar: number;
  butter: number;
  salt: number;
  yeast: number;
}

export interface BakingParams {
  humidity: number;
  sugarButterRatio: number;
  calories: number;
  cost: number;
}

export interface IngredientConfig {
  name: string;
  unitCalories: number;
  unitPrice: number;
  color: string;
}
