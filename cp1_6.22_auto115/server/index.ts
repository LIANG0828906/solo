import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Ingredient {
  name: string;
  amount: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

interface NutritionPer100g {
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
}

interface Rating {
  userId: string;
  userName: string;
  score: number;
  comment: string;
}

interface Recipe {
  id: string;
  name: string;
  category: '中餐' | '西餐' | '甜品' | '其他';
  cookTime: number;
  steps: string[];
  ingredients: Ingredient[];
  nutritionPer100g: NutritionPer100g;
  author: string;
  authorId: string;
  authorAvatar: string;
  coverGradient: string;
  ratings: Rating[];
  avgRating: number;
  createdAt: number;
}

interface User {
  id: string;
  name: string;
  avatar: string;
}

const nutritionMap: Record<string, { protein: number; fat: number; carbs: number; calories: number }> = {
  '鸡胸肉': { protein: 20, fat: 2.5, carbs: 0, calories: 110 },
  '牛肉': { protein: 26, fat: 15, carbs: 0, calories: 250 },
  '鸡蛋': { protein: 13, fat: 11, carbs: 1.1, calories: 155 },
  '米饭': { protein: 2.7, fat: 0.3, carbs: 28, calories: 130 },
  '面条': { protein: 5, fat: 1, carbs: 25, calories: 130 },
  '西红柿': { protein: 0.9, fat: 0.2, carbs: 4, calories: 20 },
  '西兰花': { protein: 2.8, fat: 0.4, carbs: 7, calories: 34 },
  '胡萝卜': { protein: 0.9, fat: 0.2, carbs: 10, calories: 41 },
  '洋葱': { protein: 1.1, fat: 0.1, carbs: 9, calories: 40 },
  '大蒜': { protein: 6.4, fat: 0.5, carbs: 33, calories: 149 },
  '橄榄油': { protein: 0, fat: 100, carbs: 0, calories: 900 },
  '盐': { protein: 0, fat: 0, carbs: 0, calories: 0 },
  '糖': { protein: 0, fat: 0, carbs: 100, calories: 400 },
  '酱油': { protein: 8, fat: 0.3, carbs: 10, calories: 75 },
  '醋': { protein: 0, fat: 0, carbs: 3, calories: 12 },
  '面粉': { protein: 10, fat: 1.2, carbs: 76, calories: 364 },
  '牛奶': { protein: 3.4, fat: 3.2, carbs: 5, calories: 60 },
  '黄油': { protein: 0.9, fat: 81, carbs: 0.1, calories: 717 },
  '巧克力': { protein: 7.6, fat: 43, carbs: 54, calories: 627 },
  '草莓': { protein: 0.8, fat: 0.4, carbs: 8, calories: 32 },
  '苹果': { protein: 0.3, fat: 0.2, carbs: 14, calories: 52 },
  '香蕉': { protein: 1.1, fat: 0.3, carbs: 23, calories: 89 },
  '猪肉': { protein: 27, fat: 28, carbs: 0, calories: 357 },
  '豆腐': { protein: 8, fat: 4.8, carbs: 2, calories: 81 },
  '土豆': { protein: 2, fat: 0.1, carbs: 17, calories: 77 },
  '青椒': { protein: 0.9, fat: 0.2, carbs: 4, calories: 20 },
  '茄子': { protein: 1, fat: 0.2, carbs: 6, calories: 25 },
  '黄瓜': { protein: 0.8, fat: 0.2, carbs: 3, calories: 16 },
  '白菜': { protein: 1.5, fat: 0.1, carbs: 3, calories: 17 },
  '虾': { protein: 24, fat: 0.7, carbs: 0.2, calories: 99 },
  '鱼肉': { protein: 22, fat: 5, carbs: 0, calories: 131 },
  '面包': { protein: 8, fat: 3, carbs: 50, calories: 265 },
};

const categoryGradients: Record<string, string> = {
  '中餐': 'linear-gradient(135deg, #FF9A56 0%, #FF6B35 100%',
  '西餐': 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%',
  '甜品': 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%',
  '其他': 'linear-gradient(135deg, #A8E6CF 0%, #88D8B0 100%',
};

function parseAmount(amountStr: string): number {
  const match = amountStr.match(/(\d+\.?\d*)/);
  if (!match) return 100;
  const num = parseFloat(match[0]);
  if (amountStr.includes('kg')) return num * 1000;
  if (amountStr.includes('g')) return num;
  if (amountStr.includes('ml')) return num;
  if (amountStr.includes('个')) return num * 50;
  if (amountStr.includes('只')) return num * 50;
  return num;
}

function findNutrition(name: string) {
  for (const key of Object.keys(nutritionMap)) {
    if (name.includes(key) || key.includes(name)) {
      return nutritionMap[key];
    }
  }
  return { protein: 2, fat: 0.5, carbs: 5, calories: 30 };
}

function calculateNutrition(ingredients: { name: string; amount: string }[]): {
  ingredients: Ingredient[];
  nutritionPer100g: NutritionPer100g;
} {
  let totalProtein = 0;
  let totalFat = 0;
  let totalCarbs = 0;
  let totalCalories = 0;
  let totalWeight = 0;

  const calculatedIngredients: Ingredient[] = [];

  for (const ing of ingredients) {
    const weight = parseAmount(ing.amount);
    const nutrition = findNutrition(ing.name);
    const factor = weight / 100;

    const protein = nutrition.protein * factor;
    const fat = nutrition.fat * factor;
    const carbs = nutrition.carbs * factor;
    const calories = nutrition.calories * factor;

    totalProtein += protein;
    totalFat += fat;
    totalCarbs += carbs;
    totalCalories += calories;
    totalWeight += weight;

    calculatedIngredients.push({
      name: ing.name,
      amount: ing.amount,
      protein: parseFloat(protein.toFixed(1)),
      fat: parseFloat(fat.toFixed(1)),
      carbs: parseFloat(carbs.toFixed(1)),
      calories: parseFloat(calories.toFixed(0)),
    });
  }

  const factor = totalWeight > 0 ? 100 / totalWeight : 0;

  return {
    ingredients: calculatedIngredients,
    nutritionPer100g: {
      protein: parseFloat((totalProtein * factor).toFixed(1)),
      fat: parseFloat((totalFat * factor).toFixed(1)),
      carbs: parseFloat((totalCarbs * factor).toFixed(1)),
      calories: parseFloat((totalCalories * factor).toFixed(0)),
    },
  };
}

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const recipes = new Map<string, Recipe>();
const users = new Map<string, User>();

const mockUsers: User[] = [
  { id: 'user1', name: '美食家小王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
  { id: 'user2', name: '健身达人李', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  { id: 'user3', name: '甜品师张', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
];

mockUsers.forEach(u => users.set(u.id, u));

const mockRecipes: Omit<Recipe, 'id'>[] = [
  {
    name: '番茄炒蛋',
    category: '中餐',
    cookTime: 15,
    steps: ['西红柿洗净切块', '鸡蛋打散加少许盐', '热锅下油炒鸡蛋盛出', '炒西红柿出汁', '加入鸡蛋翻炒', '加盐调味出锅'],
    author: '美食家小王',
    authorId: 'user1',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    coverGradient: categoryGradients['中餐'],
    ratings: [
      { userId: 'user2', userName: '健身达人李', score: 5, comment: '非常好吃，做法简单！' },
    ],
    avgRating: 5,
    createdAt: Date.now() - 86400000,
    ...calculateNutrition([
      { name: '西红柿', amount: '300g' },
      { name: '鸡蛋', amount: '2个' },
      { name: '橄榄油', amount: '10g' },
      { name: '盐', amount: '3g' },
    ]),
  },
  {
    name: '黑椒牛排',
    category: '西餐',
    cookTime: 25,
    steps: ['牛排用黑胡椒和盐腌制20分钟', '热锅放黄油', '煎牛排至喜欢的熟度', '盛出静置5分钟', '淋上黑椒汁'],
    author: '健身达人李',
    authorId: 'user2',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    coverGradient: categoryGradients['西餐'],
    ratings: [
      { userId: 'user1', userName: '美食家小王', score: 4, comment: '很嫩，好吃！' },
      { userId: 'user3', userName: '甜品师张', score: 5, comment: '完美的教程！' },
    ],
    avgRating: 4.5,
    createdAt: Date.now() - 172800000,
    ...calculateNutrition([
      { name: '牛肉', amount: '200g' },
      { name: '黄油', amount: '15g' },
      { name: '盐', amount: '2g' },
      { name: '黑胡椒', amount: '2g' },
    ]),
  },
  {
    name: '草莓蛋糕',
    category: '甜品',
    cookTime: 60,
    steps: ['制作蛋糕胚', '打发淡奶油', '蛋糕切片抹奶油', '铺草莓', '冷藏2小时'],
    author: '甜品师张',
    authorId: 'user3',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    coverGradient: categoryGradients['甜品'],
    ratings: [
      { userId: 'user1', userName: '美食家小王', score: 5, comment: '太美味了！' },
    ],
    avgRating: 5,
    createdAt: Date.now() - 259200000,
    ...calculateNutrition([
      { name: '面粉', amount: '150g' },
      { name: '鸡蛋', amount: '3个' },
      { name: '糖', amount: '80g' },
      { name: '牛奶', amount: '100ml' },
      { name: '草莓', amount: '200g' },
      { name: '黄油', amount: '50g' },
    ]),
  },
  {
    name: '宫保鸡丁',
    category: '中餐',
    cookTime: 30,
    steps: ['鸡胸肉切丁腌制', '花生米炒熟备用', '炒香干辣椒和花椒', '下鸡丁翻炒', '加调味汁', '最后加花生米出锅'],
    author: '美食家小王',
    authorId: 'user1',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    coverGradient: categoryGradients['中餐'],
    ratings: [],
    avgRating: 0,
    createdAt: Date.now() - 345600000,
    ...calculateNutrition([
      { name: '鸡胸肉', amount: '300g' },
      { name: '花生米', amount: '50g' },
      { name: '干辣椒', amount: '10g' },
      { name: '酱油', amount: '15ml' },
      { name: '醋', amount: '10ml' },
      { name: '糖', amount: '10g' },
    ]),
  },
  {
    name: '意大利面',
    category: '西餐',
    cookTime: 20,
    steps: ['煮面条8分钟', '炒香蒜末', '加番茄酱汁', '加入煮好的面条', '撒上帕玛森芝士'],
    author: '健身达人李',
    authorId: 'user2',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    coverGradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%',
    ratings: [
      { userId: 'user3', userName: '甜品师张', score: 4, comment: '很好吃！' },
    ],
    avgRating: 4,
    createdAt: Date.now() - 432000000,
    ...calculateNutrition([
      { name: '面条', amount: '200g' },
      { name: '西红柿', amount: '200g' },
      { name: '大蒜', amount: '10g' },
      { name: '橄榄油', amount: '15g' },
      { name: '盐', amount: '3g' },
    ]),
  },
  {
    name: '巧克力慕斯',
    category: '甜品',
    cookTime: 45,
    steps: ['巧克力融化', '打发淡奶油', '混合吉利丁液', '倒入模具冷藏4小时', '脱模装饰'],
    author: '甜品师张',
    authorId: 'user3',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    coverGradient: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%',
    ratings: [
      { userId: 'user1', userName: '美食家小王', score: 5, comment: '入口即化！' },
      { userId: 'user2', userName: '健身达人李', score: 4, comment: '有点甜但是很好吃' },
    ],
    avgRating: 4.5,
    createdAt: Date.now() - 518400000,
    ...calculateNutrition([
      { name: '巧克力', amount: '150g' },
      { name: '牛奶', amount: '200ml' },
      { name: '糖', amount: '50g' },
    ]),
  },
];

mockRecipes.forEach(recipe => {
  const id = uuidv4();
  recipes.set(id, { ...recipe, id });
});

app.get('/api/recipes', (req: Request, res: Response) => {
  const { search, category } = req.query;
  let result = Array.from(recipes.values());

  if (search) {
    const searchStr = String(search).toLowerCase();
    result = result.filter(r => r.name.toLowerCase().includes(searchStr));
  }

  if (category && category !== '全部') {
    result = result.filter(r => r.category === category);
  }

  result.sort((a, b) => b.createdAt - a.createdAt);

  res.json(result);
});

app.get('/api/recipes/:id', (req: Request, res: Response) => {
  const recipe = recipes.get(req.params.id);
  if (!recipe) {
    res.status(404).json({ error: '菜谱不存在' });
    return;
  }
  res.json(recipe);
});

app.post('/api/recipes', (req: Request, res: Response) => {
  const { name, category, cookTime, steps, ingredients, authorId } = req.body;

  if (!authorId) {
    res.status(400).json({ error: '请先登录' });
    return;
  }

  const user = users.get(authorId);
  if (!user) {
    res.status(400).json({ error: '用户不存在' });
    return;
  }

  const { ingredients: calculatedIngredients, nutritionPer100g } = calculateNutrition(ingredients);

  const recipe: Recipe = {
    id: uuidv4(),
    name,
    category,
    cookTime: Number(cookTime),
    steps,
    ingredients: calculatedIngredients,
    nutritionPer100g,
    author: user.name,
    authorId: user.id,
    authorAvatar: user.avatar,
    coverGradient: categoryGradients[category] || categoryGradients['其他'],
    ratings: [],
    avgRating: 0,
    createdAt: Date.now(),
  };

  recipes.set(recipe.id, recipe);
  res.status(201).json(recipe);
});

app.post('/api/recipes/:id/rate', (req: Request, res: Response) => {
  const recipe = recipes.get(req.params.id);
  if (!recipe) {
    res.status(404).json({ error: '菜谱不存在' });
    return;
  }

  const { userId, userName, score, comment } = req.body;

  const existingIndex = recipe.ratings.findIndex(r => r.userId === userId);
  const newRating: Rating = { userId, userName, score: Number(score), comment };

  if (existingIndex >= 0) {
    recipe.ratings[existingIndex] = newRating;
  } else {
    recipe.ratings.push(newRating);
  }

  recipe.avgRating = recipe.ratings.length > 0
    ? recipe.ratings.reduce((sum, r) => sum + r.score, 0) / recipe.ratings.length
    : 0;

  res.json(recipe);
});

app.post('/api/login', (req: Request, res: Response) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400).json({ error: '请输入昵称' });
    return;
  }

  let user = Array.from(users.values()).find(u => u.name === name);
  if (!user) {
    user = {
      id: uuidv4(),
      name: name.trim(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
    };
    users.set(user.id, user);
  }

  res.json(user);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
