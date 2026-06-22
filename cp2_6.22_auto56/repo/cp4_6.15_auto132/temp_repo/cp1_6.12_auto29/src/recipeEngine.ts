export interface PetInfo {
  breed: string;
  age: number;
  weight: number;
  activityLevel: 'low' | 'medium' | 'high';
}

export type IngredientCategory = 'staple' | 'meat' | 'vegetable' | 'supplement';

export interface Ingredient {
  name: string;
  grams: number;
  percentage: number;
  category: IngredientCategory;
}

export interface Recipe {
  id: string;
  totalGrams: number;
  ingredients: Ingredient[];
  trend: 'up' | 'down' | 'stable';
  trendPercentage?: number;
  generatedAt: string;
  previousTotalGrams?: number;
}

export type FeedbackType = 'all_eaten' | 'half_left' | 'quarter_left' | 'hardly_eaten' | 'vomited';

export interface FeedbackRecord {
  id: string;
  recipeId: string;
  type: FeedbackType;
  timestamp: string;
}

const MEAT_OPTIONS = ['鸡胸肉', '牛肉', '三文鱼', '鸭肉', '羊肉', '火鸡肉'];
const VEGETABLE_OPTIONS = ['胡萝卜', '西兰花', '南瓜', '菠菜', '红薯', '青豆'];
const STAPLE_OPTIONS = ['糙米', '燕麦', '红薯', '藜麦'];
const SUPPLEMENT_OPTIONS = ['鱼油', '维生素粉', '钙粉', '益生菌'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function calculateNutrients(petInfo: PetInfo): { baseCalories: number; baseGrams: number } {
  const { weight, age, activityLevel } = petInfo;

  const rer = 70 * Math.pow(weight, 0.75);

  let activityFactor = 1.0;
  if (activityLevel === 'low') activityFactor = 1.2;
  else if (activityLevel === 'medium') activityFactor = 1.6;
  else if (activityLevel === 'high') activityFactor = 2.0;

  let ageFactor = 1.0;
  if (age < 1) ageFactor = 2.0;
  else if (age < 7) ageFactor = 1.0;
  else ageFactor = 0.9;

  const baseCalories = rer * activityFactor * ageFactor;
  const baseGrams = Math.round((baseCalories / 3.5) * 10) / 10;

  return { baseCalories, baseGrams };
}

export function adjustPortions(
  baseGrams: number,
  feedbackHistory: FeedbackRecord[],
  currentMeat?: string
): { adjustedGrams: number; trend: 'up' | 'down' | 'stable'; trendPercentage?: number; newMeat?: string } {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recentFeedbacks = feedbackHistory.filter((f) => new Date(f.timestamp) >= threeDaysAgo);

  let adjustedGrams = baseGrams;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendPercentage: number | undefined = undefined;
  let newMeat: string | undefined = undefined;

  const lastTwo = recentFeedbacks.slice(-2);
  const allEatenCount = lastTwo.filter((f) => f.type === 'all_eaten').length;

  if (allEatenCount === 2 && lastTwo.length === 2) {
    adjustedGrams = Math.round(baseGrams * 1.05 * 10) / 10;
    trend = 'up';
    trendPercentage = 5;
  }

  const hasVomited = recentFeedbacks.some((f) => f.type === 'vomited');
  if (hasVomited) {
    adjustedGrams = Math.round(baseGrams * 0.9 * 10) / 10;
    trend = 'down';
    trendPercentage = 10;
    const availableMeats = MEAT_OPTIONS.filter((m) => m !== currentMeat);
    newMeat = getRandomItem(availableMeats);
  }

  return { adjustedGrams, trend, trendPercentage, newMeat };
}

export function generateRecipe(
  petInfo: PetInfo,
  feedbackHistory: FeedbackRecord[] = [],
  previousRecipe?: Recipe
): Recipe {
  const { baseGrams } = calculateNutrients(petInfo);

  const previousMeat = previousRecipe?.ingredients.find((i) => i.category === 'meat')?.name;
  const previousTotal = previousRecipe?.totalGrams;

  const { adjustedGrams, trend, trendPercentage, newMeat } = adjustPortions(
    previousTotal ?? baseGrams,
    feedbackHistory,
    previousMeat
  );

  const finalGrams = adjustedGrams;

  const stapleName = getRandomItem(STAPLE_OPTIONS);
  const meatName = newMeat || previousMeat || getRandomItem(MEAT_OPTIONS);
  const vegetableName = getRandomItem(VEGETABLE_OPTIONS);
  const supplementName = getRandomItem(SUPPLEMENT_OPTIONS);

  const staplePercentage = 45;
  const meatPercentage = 35;
  const vegetablePercentage = 15;
  const supplementPercentage = 5;

  const ingredients: Ingredient[] = [
    {
      name: stapleName,
      grams: Math.round(finalGrams * (staplePercentage / 100) * 10) / 10,
      percentage: staplePercentage,
      category: 'staple',
    },
    {
      name: meatName,
      grams: Math.round(finalGrams * (meatPercentage / 100) * 10) / 10,
      percentage: meatPercentage,
      category: 'meat',
    },
    {
      name: vegetableName,
      grams: Math.round(finalGrams * (vegetablePercentage / 100) * 10) / 10,
      percentage: vegetablePercentage,
      category: 'vegetable',
    },
    {
      name: supplementName,
      grams: Math.round(finalGrams * (supplementPercentage / 100) * 10) / 10,
      percentage: supplementPercentage,
      category: 'supplement',
    },
  ];

  return {
    id: generateId(),
    totalGrams: finalGrams,
    ingredients,
    trend,
    trendPercentage,
    generatedAt: new Date().toISOString(),
    previousTotalGrams: previousTotal,
  };
}

export const BREED_OPTIONS = [
  '金毛寻回犬',
  '拉布拉多犬',
  '柯基犬',
  '柴犬',
  '比熊犬',
  '泰迪犬',
  '哈士奇',
  '边境牧羊犬',
  '英国短毛猫',
  '美国短毛猫',
  '布偶猫',
  '暹罗猫',
  '狸花猫',
  '橘猫',
];
