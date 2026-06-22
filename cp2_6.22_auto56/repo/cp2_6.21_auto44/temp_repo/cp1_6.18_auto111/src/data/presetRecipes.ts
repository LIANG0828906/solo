import type { IngredientConfig, IngredientType } from '@/types/recipe';

export const INGREDIENT_CONFIGS: Record<IngredientType, IngredientConfig> = {
  flour: {
    name: '面粉',
    unitCalories: 3.64,
    unitPrice: 0.008,
    color: '#F5DEB3',
  },
  milk: {
    name: '牛奶',
    unitCalories: 0.42,
    unitPrice: 0.012,
    color: '#FFFFFF',
  },
  egg: {
    name: '鸡蛋',
    unitCalories: 1.55,
    unitPrice: 0.02,
    color: '#FFFACD',
  },
  sugar: {
    name: '糖',
    unitCalories: 4.0,
    unitPrice: 0.01,
    color: '#FFFFFF',
  },
  butter: {
    name: '黄油',
    unitCalories: 7.17,
    unitPrice: 0.05,
    color: '#FFD700',
  },
  salt: {
    name: '盐',
    unitCalories: 0.0,
    unitPrice: 0.005,
    color: '#F0F0F0',
  },
  yeast: {
    name: '酵母',
    unitCalories: 0.325,
    unitPrice: 0.03,
    color: '#D2B48C',
  },
};
