import { Recipe, Ingredient, MatchedRecipe, IngredientCategory } from './types';

const MEAT_KEYWORDS = ['猪肉', '牛肉', '鸡肉', '羊肉', '鱼肉', '虾', '鸡蛋', '培根', '火腿', '排骨', '鸭', '鹅'];
const VEGETABLE_KEYWORDS = ['白菜', '青菜', '番茄', '西红柿', '土豆', '胡萝卜', '黄瓜', '茄子', '辣椒', '青椒', '洋葱', '大蒜', '葱', '姜', '蘑菇', '香菇', '菠菜', '西兰花', '玉米', '豆角', '豆腐', '豆芽', '南瓜', '冬瓜', '莲藕', '芹菜', '韭菜', '生菜'];
const SEASONING_KEYWORDS = ['盐', '糖', '酱油', '醋', '料酒', '生抽', '老抽', '蚝油', '鸡精', '味精', '花椒', '八角', '桂皮', '香叶', '辣椒', '孜然', '芝麻', '香油', '橄榄油', '花生油', '菜油', '蜂蜜', '番茄酱', '豆瓣酱', '淀粉', '面粉'];

export function categorizeIngredient(name: string): IngredientCategory {
  const lowerName = name.toLowerCase();
  if (MEAT_KEYWORDS.some(k => lowerName.includes(k))) return 'meat';
  if (VEGETABLE_KEYWORDS.some(k => lowerName.includes(k))) return 'vegetable';
  if (SEASONING_KEYWORDS.some(k => lowerName.includes(k))) return 'seasoning';
  return 'other';
}

export function parseIngredients(raw: string): Ingredient[] {
  if (!raw.trim()) return [];
  return raw.split(/[,，、]/).map(item => {
    const trimmed = item.trim();
    const match = trimmed.match(/^(.+?)[（(\s]([^（）()\s]+)[）)\s]?$/);
    let name = trimmed;
    let amount = '适量';
    if (match) {
      name = match[1].trim();
      amount = match[2].trim();
    } else {
      const spaceMatch = trimmed.match(/^(.+?)\s+(.+)$/);
      if (spaceMatch) {
        name = spaceMatch[1].trim();
        amount = spaceMatch[2].trim();
      }
    }
    return {
      name,
      amount,
      category: categorizeIngredient(name)
    };
  }).filter(i => i.name);
}

export function parseSteps(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(/\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => s.replace(/^\d+[\.、)\s]+/, '').trim());
}

function getIngredientNamesByCategory(recipe: Recipe, category: IngredientCategory): string[] {
  return recipe.ingredients
    .filter(i => i.category === category)
    .map(i => i.name);
}

function countMatches(listA: string[], listB: string[]): number {
  const setA = new Set(listA.map(n => n.toLowerCase()));
  let count = 0;
  for (const name of listB) {
    const lower = name.toLowerCase();
    for (const a of setA) {
      if (a.includes(lower) || lower.includes(a)) {
        count++;
        break;
      }
    }
  }
  return count;
}

export function calculateMatchScore(recipeA: Recipe, recipeB: Recipe): number {
  const meatsA = getIngredientNamesByCategory(recipeA, 'meat');
  const meatsB = getIngredientNamesByCategory(recipeB, 'meat');
  const meatMatches = countMatches(meatsA, meatsB);

  const vegsA = getIngredientNamesByCategory(recipeA, 'vegetable');
  const vegsB = getIngredientNamesByCategory(recipeB, 'vegetable');
  const vegMatches = countMatches(vegsA, vegsB);

  const seasA = getIngredientNamesByCategory(recipeA, 'seasoning');
  const seasB = getIngredientNamesByCategory(recipeB, 'seasoning');
  const seaMatches = countMatches(seasA, seasB);

  const mainScore = (meatMatches + vegMatches) * 30;
  const seasoningScore = seaMatches * 10;
  return mainScore + seasoningScore;
}

function calculateMaxPossibleScore(recipe: Recipe): number {
  const mainCount = recipe.ingredients.filter(i => i.category === 'meat' || i.category === 'vegetable').length;
  const seasoningCount = recipe.ingredients.filter(i => i.category === 'seasoning').length;
  return mainCount * 30 + seasoningCount * 10;
}

export function getMatchingRecipes(currentRecipe: Recipe, allRecipes: Recipe[], limit: number = 10): MatchedRecipe[] {
  const maxScore = calculateMaxPossibleScore(currentRecipe);
  return allRecipes
    .filter(r => r.id !== currentRecipe.id)
    .map(recipe => {
      const matchScore = calculateMatchScore(currentRecipe, recipe);
      const matchPercentage = maxScore > 0 ? Math.min(Math.round((matchScore / maxScore) * 100), 100) : 0;
      return { ...recipe, matchScore, matchPercentage };
    })
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
