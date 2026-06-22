import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { Recipe, DayMealPlan, MealPlanItem, ShoppingItem } from '../types';
import { useIngredientStore } from './ingredientStore';

interface RecipeState {
  recipes: Recipe[];
  currentRecipe: Recipe | null;
  mealPlans: DayMealPlan[];
  setCurrentRecipe: (recipe: Recipe | null) => void;
  getRecommendedRecipes: () => Recipe[];
  addMealPlan: (date: string, recipeId: string, mealType: 'breakfast' | 'lunch' | 'dinner') => void;
  removeMealPlan: (date: string, mealPlanId: string) => void;
  getMealPlanByDate: (date: string) => DayMealPlan | undefined;
  generateShoppingList: (recipeId: string) => ShoppingItem[];
  moveMealPlan: (fromDate: string, toDate: string, mealPlanId: string) => void;
}

const mockRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=番茄炒蛋%20中式家常菜%20美食摄影&image_size=square',
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    matchScore: 95,
    nutrition: { calories: 280, protein: 18, fat: 20, carbs: 8, fiber: 2 },
    ingredients: [
      { id: '1', name: '西红柿', quantity: 300, unit: 'g' },
      { id: '2', name: '鸡蛋', quantity: 200, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '西红柿洗净切块，鸡蛋打散备用。', duration: 5 },
      { step: 2, description: '热锅放油，倒入蛋液炒至凝固盛出。', duration: 3 },
      { step: 3, description: '锅中再加少许油，放入西红柿翻炒出汁。', duration: 4 },
      { step: 4, description: '加入炒好的鸡蛋，加盐调味，翻炒均匀即可。', duration: 3 },
    ],
    tags: ['家常菜', '快手菜', '素菜'],
  },
  {
    id: uuidv4(),
    name: '香煎鸡胸肉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=香煎鸡胸肉%20健身餐%20美食摄影&image_size=square',
    cookTime: 25,
    servings: 2,
    difficulty: 'medium',
    matchScore: 88,
    nutrition: { calories: 320, protein: 45, fat: 12, carbs: 3, fiber: 1 },
    ingredients: [
      { id: '1', name: '鸡胸肉', quantity: 300, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '鸡胸肉用刀背拍松，加入盐、黑胡椒、料酒腌制15分钟。', duration: 15 },
      { step: 2, description: '平底锅加热，放少许油，放入鸡胸肉。', duration: 2 },
      { step: 3, description: '每面煎5-6分钟至金黄熟透。', duration: 10 },
      { step: 4, description: '盛出静置3分钟后切片食用。', duration: 3 },
    ],
    tags: ['健身餐', '高蛋白', '低脂'],
  },
  {
    id: uuidv4(),
    name: '土豆烧牛肉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=土豆烧牛肉%20中式红烧菜%20美食摄影&image_size=square',
    cookTime: 60,
    servings: 4,
    difficulty: 'hard',
    matchScore: 82,
    nutrition: { calories: 450, protein: 35, fat: 25, carbs: 30, fiber: 4 },
    ingredients: [
      { id: '1', name: '牛肉', quantity: 250, unit: 'g' },
      { id: '2', name: '土豆', quantity: 400, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '牛肉切块焯水去血沫，土豆去皮切块。', duration: 10 },
      { step: 2, description: '锅中放油，加葱姜爆香，放入牛肉翻炒。', duration: 5 },
      { step: 3, description: '加生抽、老抽、料酒、冰糖调味，加水烧开。', duration: 5 },
      { step: 4, description: '小火炖煮30分钟。', duration: 30 },
      { step: 5, description: '加入土豆继续炖煮15分钟至汤汁浓稠。', duration: 15 },
    ],
    tags: ['家常菜', '下饭菜', '硬菜'],
  },
  {
    id: uuidv4(),
    name: '青椒土豆丝',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=青椒土豆丝%20中式家常菜%20清爽素菜%20美食摄影&image_size=square',
    cookTime: 20,
    servings: 2,
    difficulty: 'easy',
    matchScore: 90,
    nutrition: { calories: 180, protein: 4, fat: 6, carbs: 30, fiber: 3 },
    ingredients: [
      { id: '1', name: '土豆', quantity: 300, unit: 'g' },
      { id: '2', name: '青椒', quantity: 100, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '土豆去皮切丝，用清水浸泡去淀粉。', duration: 5 },
      { step: 2, description: '青椒切丝备用。', duration: 2 },
      { step: 3, description: '热锅放油，放入土豆丝翻炒。', duration: 5 },
      { step: 4, description: '加入青椒丝，加盐、醋调味，翻炒均匀出锅。', duration: 3 },
    ],
    tags: ['家常菜', '素菜', '快手菜'],
  },
  {
    id: uuidv4(),
    name: '麻婆豆腐',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=麻婆豆腐%20川菜%20美食摄影&image_size=square',
    cookTime: 25,
    servings: 3,
    difficulty: 'medium',
    matchScore: 78,
    nutrition: { calories: 220, protein: 15, fat: 14, carbs: 10, fiber: 3 },
    ingredients: [
      { id: '1', name: '豆腐', quantity: 400, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '豆腐切块，放入加了盐的开水中焯水后捞出。', duration: 5 },
      { step: 2, description: '锅中放油，爆香蒜末和豆瓣酱。', duration: 3 },
      { step: 3, description: '加入适量水烧开，放入豆腐。', duration: 2 },
      { step: 4, description: '小火炖煮5分钟让豆腐入味。', duration: 5 },
      { step: 5, description: '水淀粉勾芡，撒上花椒粉和葱花即可。', duration: 3 },
    ],
    tags: ['川菜', '家常菜', '下饭菜'],
  },
  {
    id: uuidv4(),
    name: '蛋炒饭',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=蛋炒饭%20中式主食%20美食摄影&image_size=square',
    cookTime: 15,
    servings: 2,
    difficulty: 'easy',
    matchScore: 85,
    nutrition: { calories: 380, protein: 12, fat: 15, carbs: 50, fiber: 2 },
    ingredients: [
      { id: '1', name: '米饭', quantity: 300, unit: 'g' },
      { id: '2', name: '鸡蛋', quantity: 100, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '鸡蛋打散，隔夜米饭打散备用。', duration: 3 },
      { step: 2, description: '热锅放油，倒入蛋液炒散。', duration: 2 },
      { step: 3, description: '加入米饭大火翻炒均匀。', duration: 5 },
      { step: 4, description: '加盐、少许生抽调味，撒葱花出锅。', duration: 2 },
    ],
    tags: ['主食', '快手菜', '剩饭利用'],
  },
];

const createMockMealPlans = (): DayMealPlan[] => {
  const today = dayjs();
  return [
    {
      date: today.format('YYYY-MM-DD'),
      meals: [
        {
          id: uuidv4(),
          recipeId: mockRecipes[5].id,
          recipe: mockRecipes[5],
          mealType: 'breakfast',
        },
        {
          id: uuidv4(),
          recipeId: mockRecipes[0].id,
          recipe: mockRecipes[0],
          mealType: 'lunch',
        },
        {
          id: uuidv4(),
          recipeId: mockRecipes[1].id,
          recipe: mockRecipes[1],
          mealType: 'dinner',
        },
      ],
    },
    {
      date: today.add(1, 'day').format('YYYY-MM-DD'),
      meals: [
        {
          id: uuidv4(),
          recipeId: mockRecipes[3].id,
          recipe: mockRecipes[3],
          mealType: 'lunch',
        },
      ],
    },
    {
      date: today.add(3, 'day').format('YYYY-MM-DD'),
      meals: [
        {
          id: uuidv4(),
          recipeId: mockRecipes[2].id,
          recipe: mockRecipes[2],
          mealType: 'dinner',
        },
      ],
    },
  ];
};

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: mockRecipes,
  currentRecipe: null,
  mealPlans: createMockMealPlans(),

  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),

  getRecommendedRecipes: () => {
    const { recipes } = get();
    const ingredients = useIngredientStore.getState().ingredients;
    const scoredRecipes = recipes.map((recipe) => {
      let matchCount = 0;
      recipe.ingredients.forEach((ri) => {
        const hasIngredient = ingredients.find(
          (i) => i.name === ri.name && i.quantity >= ri.quantity * 0.5
        );
        if (hasIngredient) matchCount++;
      });
      const score = Math.round((matchCount / recipe.ingredients.length) * 100);
      return { ...recipe, matchScore: Math.max(score, recipe.matchScore) };
    });
    return scoredRecipes.sort((a, b) => b.matchScore - a.matchScore);
  },

  addMealPlan: (date, recipeId, mealType) => {
    const recipe = get().recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const newMeal: MealPlanItem = {
      id: uuidv4(),
      recipeId,
      recipe,
      mealType,
    };

    set((state) => {
      const existingPlanIndex = state.mealPlans.findIndex(
        (p) => p.date === date
      );
      if (existingPlanIndex >= 0) {
        const newPlans = [...state.mealPlans];
        newPlans[existingPlanIndex] = {
          ...newPlans[existingPlanIndex],
          meals: [...newPlans[existingPlanIndex].meals, newMeal],
        };
        return { mealPlans: newPlans };
      } else {
        return {
          mealPlans: [...state.mealPlans, { date, meals: [newMeal] }],
        };
      }
    });
  },

  removeMealPlan: (date, mealPlanId) => {
    set((state) => {
      const planIndex = state.mealPlans.findIndex((p) => p.date === date);
      if (planIndex < 0) return state;

      const newPlans = [...state.mealPlans];
      newPlans[planIndex] = {
        ...newPlans[planIndex],
        meals: newPlans[planIndex].meals.filter((m) => m.id !== mealPlanId),
      };

      if (newPlans[planIndex].meals.length === 0) {
        newPlans.splice(planIndex, 1);
      }

      return { mealPlans: newPlans };
    });
  },

  getMealPlanByDate: (date) => {
    return get().mealPlans.find((p) => p.date === date);
  },

  generateShoppingList: (recipeId) => {
    const recipe = get().recipes.find((r) => r.id === recipeId);
    if (!recipe) return [];

    const ingredients = useIngredientStore.getState().ingredients;
    const shoppingList: ShoppingItem[] = [];

    recipe.ingredients.forEach((ri) => {
      const existing = ingredients.find(
        (i) => i.name === ri.name && i.unit === ri.unit
      );
      const available = existing ? existing.quantity : 0;
      const needToBuy = Math.max(0, ri.quantity - available);
      if (needToBuy > 0) {
        shoppingList.push({
          name: ri.name,
          quantity: ri.quantity,
          unit: ri.unit,
          needToBuy,
        });
      }
    });

    return shoppingList;
  },

  moveMealPlan: (fromDate, toDate, mealPlanId) => {
    set((state) => {
      const fromPlanIndex = state.mealPlans.findIndex(
        (p) => p.date === fromDate
      );
      if (fromPlanIndex < 0) return state;

      const meal = state.mealPlans[fromPlanIndex].meals.find(
        (m) => m.id === mealPlanId
      );
      if (!meal) return state;

      const newPlans = [...state.mealPlans];
      newPlans[fromPlanIndex] = {
        ...newPlans[fromPlanIndex],
        meals: newPlans[fromPlanIndex].meals.filter((m) => m.id !== mealPlanId),
      };
      if (newPlans[fromPlanIndex].meals.length === 0) {
        newPlans.splice(fromPlanIndex, 1);
      }

      const toPlanIndex = newPlans.findIndex((p) => p.date === toDate);
      if (toPlanIndex >= 0) {
        newPlans[toPlanIndex] = {
          ...newPlans[toPlanIndex],
          meals: [...newPlans[toPlanIndex].meals, meal],
        };
      } else {
        newPlans.push({ date: toDate, meals: [meal] });
      }

      return { mealPlans: newPlans };
    });
  },
}));
