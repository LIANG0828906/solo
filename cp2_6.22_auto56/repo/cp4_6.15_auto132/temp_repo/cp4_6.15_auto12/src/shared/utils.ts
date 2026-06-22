import type { Ingredient, Recipe, RecipeIngredient, RecipeScore, RecipeDifficulty } from './types';

const SYNONYMS: Record<string, string[]> = {
  '土豆': ['马铃薯', '洋芋'],
  '马铃薯': ['土豆', '洋芋'],
  '洋芋': ['土豆', '马铃薯'],
  '鸡蛋': ['蛋', '鸡子'],
  '蛋': ['鸡蛋', '鸡子'],
  '鸡子': ['鸡蛋', '蛋'],
  '西红柿': ['番茄'],
  '番茄': ['西红柿'],
  '圆白菜': ['包菜', '卷心菜', '高丽菜'],
  '包菜': ['圆白菜', '卷心菜', '高丽菜'],
  '卷心菜': ['圆白菜', '包菜', '高丽菜'],
  '高丽菜': ['圆白菜', '包菜', '卷心菜'],
  '香菜': ['芫荽'],
  '芫荽': ['香菜'],
  '菜花': ['花椰菜', '花菜'],
  '花椰菜': ['菜花', '花菜'],
  '花菜': ['菜花', '花椰菜'],
  '猪肉': ['猪', '五花肉', '里脊', '猪里脊'],
  '五花肉': ['猪肉'],
  '里脊': ['猪肉', '猪里脊'],
  '猪里脊': ['猪肉', '里脊'],
  '牛肉': ['牛', '牛腩', '牛里脊'],
  '牛腩': ['牛肉'],
  '鸡肉': ['鸡', '鸡胸', '鸡腿', '鸡脯'],
  '鸡胸': ['鸡肉', '鸡脯'],
  '鸡脯': ['鸡肉', '鸡胸'],
  '鸡腿': ['鸡肉'],
  '食用油': ['油', '花生油', '菜籽油', '玉米油', '橄榄油', '色拉油'],
  '油': ['食用油', '花生油', '菜籽油', '玉米油', '橄榄油', '色拉油'],
  '葱': ['大葱', '小葱', '香葱', '葱花'],
  '大葱': ['葱', '香葱', '葱花'],
  '小葱': ['葱', '香葱', '葱花'],
  '香葱': ['葱', '大葱', '小葱'],
  '葱花': ['葱', '大葱', '小葱'],
  '姜': ['生姜', '老姜'],
  '生姜': ['姜', '老姜'],
  '老姜': ['姜', '生姜'],
  '蒜': ['大蒜', '蒜头'],
  '大蒜': ['蒜', '蒜头'],
  '蒜头': ['蒜', '大蒜'],
  '盐': ['食盐', '精盐'],
  '酱油': ['生抽', '老抽'],
  '生抽': ['酱油'],
  '老抽': ['酱油'],
  '醋': ['陈醋', '香醋', '米醋'],
  '陈醋': ['醋'],
  '香醋': ['醋'],
  '米醋': ['醋'],
  '糖': ['白糖', '冰糖', '白砂糖'],
  '白糖': ['糖', '白砂糖'],
  '冰糖': ['糖'],
  '白砂糖': ['糖', '白糖'],
  '料酒': ['黄酒', '米酒'],
  '黄酒': ['料酒'],
  '米酒': ['料酒'],
  '淀粉': ['生粉', '玉米淀粉', '芡粉'],
  '生粉': ['淀粉', '玉米淀粉', '芡粉'],
  '玉米淀粉': ['淀粉', '生粉'],
  '芡粉': ['淀粉', '生粉'],
  '豆腐': ['北豆腐', '南豆腐', '嫩豆腐'],
  '木耳': ['黑木耳'],
  '香菇': ['蘑菇', '冬菇'],
  '蘑菇': ['香菇', '冬菇'],
  '冬菇': ['香菇', '蘑菇'],
  '辣椒': ['干辣椒', '青椒', '红椒'],
  '青椒': ['辣椒'],
  '红椒': ['辣椒'],
  '胡萝卜': ['红萝卜'],
  '红萝卜': ['胡萝卜'],
};

function getCanonicalName(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [canonical, synonyms] of Object.entries(SYNONYMS)) {
    if (lower === canonical.toLowerCase() || synonyms.some((s) => s.toLowerCase() === lower)) {
      return canonical.toLowerCase();
    }
  }
  return lower;
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

export function isIngredientMatch(userName: string, recipeName: string): boolean {
  const userCanonical = getCanonicalName(userName);
  const recipeCanonical = getCanonicalName(recipeName);
  if (userCanonical === recipeCanonical) return true;
  if (userCanonical.includes(recipeCanonical) || recipeCanonical.includes(userCanonical)) return true;
  return stringSimilarity(userCanonical, recipeCanonical) >= 0.65;
}

export function calculateMatchRate(
  userIngredients: Ingredient[],
  recipeIngredients: RecipeIngredient[]
): { rate: number; matched: RecipeIngredient[]; missing: RecipeIngredient[] } {
  const userCanonicalNames = userIngredients.map((i) => i.name);
  const matched: RecipeIngredient[] = [];
  const missing: RecipeIngredient[] = [];

  for (const ri of recipeIngredients) {
    const isMatch = userCanonicalNames.some((userName) => isIngredientMatch(userName, ri.name));
    if (isMatch) {
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
