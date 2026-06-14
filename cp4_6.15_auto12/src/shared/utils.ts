import type { Ingredient, Recipe, RecipeIngredient, RecipeScore, RecipeDifficulty } from './types';

export function calculateMatchRate(
  userIngredients: Ingredient[],
  recipeIngredients: RecipeIngredient[]
): { rate: number; matched: RecipeIngredient[]; missing: RecipeIngredient[] } {
  const userNames = userIngredients.map((i) => i.name.toLowerCase());
  const matched: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];

  for (const ri of recipeIngredients) {
    if (userNames.includes(ri.name.toLowerCase())) {
      matched.push(ri);
    } else {
      missing.push(ri);
    }
  }

  const requiredCount = recipeIngredients.filter((ri) => ri.isRequired).length;
  const matchedRequired = matched.filter((ri) => ri.isRequired).length;
  const rate = requiredCount > 0 ? matchedRequired / requiredCount : matched.length / Math.max(recipeIngredients.length, 1);

  return { rate, matched, missing };
}

const IDEAL_NUTRITION = { carbs: 0.5, protein: 0.3, fat: 0.2 };

export function calculateNutritionScore(nutritionRatio: { carbs: number; protein: number; fat: number }): number {
  const total = nutritionRatio.carbs + nutritionRatio.protein + nutritionRatio.fat;
  if (total === 0) return 0;
  const n = {
    carbs: nutritionRatio.carbs / total,
    protein: nutritionRatio.protein / total,
    fat: nutritionRatio.fat / total,
  };
  const diff =
    Math.abs(n.carbs - IDEAL_NUTRITION.carbs) +
    Math.abs(n.protein - IDEAL_NUTRITION.protein) +
    Math.abs(n.fat - IDEAL_NUTRITION.fat);
  return Math.max(0, 1 - diff);
}

export function calculateDifficultyScore(difficulty: RecipeDifficulty, preference: RecipeDifficulty): number {
  const order: Record<RecipeDifficulty, number> = { easy: 0, medium: 1, hard: 2 };
  return 1 - Math.abs(order[difficulty] - order[preference]) * 0.35;
}

export function scoreRecipes(
  userIngredients: Ingredient[],
  recipes: Recipe[],
  difficultyPreference: RecipeDifficulty = 'easy'
): RecipeScore[] {
  return recipes
    .map((recipe) => {
      const { rate, matched, missing } = calculateMatchRate(userIngredients, recipe.ingredients);
      const matchScore = rate >= 0.8 ? rate * 1.3 : rate;
      const nutritionScore = calculateNutritionScore(recipe.nutritionRatio);
      const difficultyScore = calculateDifficultyScore(recipe.difficulty, difficultyPreference);
      const totalScore = matchScore * 0.5 + nutritionScore * 0.3 + difficultyScore * 0.2;
      return { recipe, matchScore, nutritionScore, difficultyScore, totalScore, missingIngredients: missing, matchedIngredients: matched };
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

export function isExpiringSoon(expiryDate: string, days: number = 3): boolean {
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

export function formatExpiryDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysUntilExpiry(dateStr: string): number {
  const expiry = new Date(dateStr);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
