import type { IngredientRatio, BakingParams, IngredientType } from '@/types/recipe';
import { INGREDIENT_CONFIGS } from '@/data/presetRecipes';

export function normalizeRatio(
  ratios: IngredientRatio,
  changedKey: IngredientType,
  newValue: number
): IngredientRatio {
  const newRatios = { ...ratios };
  newRatios[changedKey] = newValue;

  const otherKeys = Object.keys(newRatios).filter(
    (key) => key !== changedKey
  ) as IngredientType[];

  const otherSum = otherKeys.reduce((sum, key) => sum + newRatios[key], 0);
  const remaining = 100 - newValue;

  if (otherSum === 0) {
    const equalShare = remaining / otherKeys.length;
    otherKeys.forEach((key) => {
      newRatios[key] = equalShare;
    });
  } else {
    const scaleFactor = remaining / otherSum;
    otherKeys.forEach((key) => {
      newRatios[key] = newRatios[key] * scaleFactor;
    });
  }

  return newRatios;
}

export function calculateBakingParams(
  ingredients: IngredientRatio,
  baseWeight: number = 500
): BakingParams {
  const humidity = Math.max(
    30,
    Math.min(80, (ingredients.milk * 0.8 + ingredients.egg * 0.7) * 100)
  );

  const sugarButterRatio = Math.max(
    0.3,
    Math.min(2.5, ingredients.sugar / (ingredients.butter + 0.001))
  );

  const calories = Object.entries(ingredients).reduce((sum, [key, value]) => {
    const config = INGREDIENT_CONFIGS[key as IngredientType];
    return sum + value * config.unitCalories;
  }, 0);

  const cost = Object.entries(ingredients).reduce((sum, [key, value]) => {
    const config = INGREDIENT_CONFIGS[key as IngredientType];
    return sum + value * config.unitPrice * baseWeight / 100;
  }, 0);

  return {
    humidity,
    sugarButterRatio,
    calories,
    cost,
  };
}

export function getGradientColor(
  value: number,
  min: number,
  max: number
): string {
  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));

  let r: number, g: number, b: number;

  if (ratio <= 0.5) {
    const t = ratio * 2;
    r = Math.round(34 + (234 - 34) * t);
    g = Math.round(197 + (179 - 197) * t);
    b = Math.round(94 + (8 - 94) * t);
  } else {
    const t = (ratio - 0.5) * 2;
    r = Math.round(234 + (239 - 234) * t);
    g = Math.round(179 + (68 - 179) * t);
    b = Math.round(8 + (68 - 8) * t);
  }

  return `rgb(${r}, ${g}, ${b})`;
}
