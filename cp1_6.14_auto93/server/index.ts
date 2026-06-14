import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import type {
  Food,
  MealEntry,
  UserProfile,
  WeeklyPlan,
  DayPlan,
  PlanMeal,
} from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

interface DBData {
  foods: Food[];
  mealEntries: MealEntry[];
  userProfile: UserProfile | null;
  weeklyPlans: WeeklyPlan[];
}

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbFile = path.join(dbDir, 'db.json');

const adapter = new JSONFile<DBData>(dbFile);
const defaultData: DBData = {
  foods: [],
  mealEntries: [],
  userProfile: null,
  weeklyPlans: [],
};
const db = new Low(adapter, defaultData);

await db.read();

const FOODS_RAW: Omit<Food, 'id'>[] = [
  { name: '白米饭', category: '主食', calories: 116, protein: 2.6, carbs: 25.6, fat: 0.3, servingSize: 100, servingUnit: '克' },
  { name: '糙米饭', category: '主食', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, servingSize: 100, servingUnit: '克' },
  { name: '全麦面包', category: '主食', calories: 246, protein: 13, carbs: 41, fat: 4.2, servingSize: 100, servingUnit: '克' },
  { name: '燕麦片', category: '主食', calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, servingSize: 100, servingUnit: '克' },
  { name: '红薯', category: '主食', calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1, servingSize: 100, servingUnit: '克' },
  { name: '玉米', category: '主食', calories: 106, protein: 4, carbs: 22.8, fat: 1.2, servingSize: 100, servingUnit: '克' },
  { name: '意大利面', category: '主食', calories: 371, protein: 13, carbs: 75, fat: 1.5, servingSize: 100, servingUnit: '克' },
  { name: '鸡胸肉', category: '肉类', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, servingUnit: '克' },
  { name: '牛肉(瘦)', category: '肉类', calories: 250, protein: 26, carbs: 0, fat: 15, servingSize: 100, servingUnit: '克' },
  { name: '猪里脊', category: '肉类', calories: 155, protein: 20.2, carbs: 1.7, fat: 7.9, servingSize: 100, servingUnit: '克' },
  { name: '三文鱼', category: '海鲜', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100, servingUnit: '克' },
  { name: '虾', category: '海鲜', calories: 99, protein: 24, carbs: 0.2, fat: 0.3, servingSize: 100, servingUnit: '克' },
  { name: '金枪鱼', category: '海鲜', calories: 144, protein: 23.3, carbs: 0, fat: 4.9, servingSize: 100, servingUnit: '克' },
  { name: '鸡蛋', category: '蛋奶', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, servingUnit: '克' },
  { name: '牛奶', category: '蛋奶', calories: 54, protein: 3.2, carbs: 5, fat: 3.2, servingSize: 100, servingUnit: '毫升' },
  { name: '希腊酸奶', category: '蛋奶', calories: 97, protein: 10, carbs: 3.6, fat: 4.1, servingSize: 100, servingUnit: '克' },
  { name: '奶酪', category: '蛋奶', calories: 402, protein: 25.7, carbs: 2.4, fat: 33.3, servingSize: 100, servingUnit: '克' },
  { name: '豆腐', category: '豆制品', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, servingSize: 100, servingUnit: '克' },
  { name: '豆浆', category: '豆制品', calories: 54, protein: 3.3, carbs: 5.6, fat: 1.8, servingSize: 100, servingUnit: '毫升' },
  { name: '西兰花', category: '蔬菜', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, servingSize: 100, servingUnit: '克' },
  { name: '菠菜', category: '蔬菜', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, servingSize: 100, servingUnit: '克' },
  { name: '生菜', category: '蔬菜', calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '番茄', category: '蔬菜', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '黄瓜', category: '蔬菜', calories: 15, protein: 0.8, carbs: 2.9, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '胡萝卜', category: '蔬菜', calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '土豆', category: '蔬菜', calories: 77, protein: 2, carbs: 17, fat: 0.1, servingSize: 100, servingUnit: '克' },
  { name: '蘑菇', category: '蔬菜', calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3, servingSize: 100, servingUnit: '克' },
  { name: '青椒', category: '蔬菜', calories: 20, protein: 0.9, carbs: 4.6, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '洋葱', category: '蔬菜', calories: 40, protein: 1.1, carbs: 9.3, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '苹果', category: '水果', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '香蕉', category: '水果', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, servingUnit: '克' },
  { name: '橙子', category: '水果', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, servingSize: 100, servingUnit: '克' },
  { name: '蓝莓', category: '水果', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, servingSize: 100, servingUnit: '克' },
  { name: '草莓', category: '水果', calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, servingSize: 100, servingUnit: '克' },
  { name: '牛油果', category: '水果', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: 100, servingUnit: '克' },
  { name: '葡萄', category: '水果', calories: 69, protein: 0.6, carbs: 18, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '西瓜', category: '水果', calories: 30, protein: 0.6, carbs: 8, fat: 0.2, servingSize: 100, servingUnit: '克' },
  { name: '猕猴桃', category: '水果', calories: 61, protein: 0.8, carbs: 15, fat: 0.5, servingSize: 100, servingUnit: '克' },
  { name: '芒果', category: '水果', calories: 60, protein: 0.5, carbs: 15, fat: 0.4, servingSize: 100, servingUnit: '克' },
  { name: '杏仁', category: '坚果', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 100, servingUnit: '克' },
  { name: '核桃', category: '坚果', calories: 654, protein: 15, carbs: 14, fat: 65, servingSize: 100, servingUnit: '克' },
  { name: '花生', category: '坚果', calories: 567, protein: 26, carbs: 16, fat: 49, servingSize: 100, servingUnit: '克' },
  { name: '橄榄油', category: '油脂', calories: 884, protein: 0, carbs: 0, fat: 100, servingSize: 100, servingUnit: '克' },
  { name: '黄油', category: '油脂', calories: 717, protein: 0.9, carbs: 0.1, fat: 81, servingSize: 100, servingUnit: '克' },
  { name: '蜂蜜', category: '调味品', calories: 304, protein: 0.3, carbs: 82, fat: 0, servingSize: 100, servingUnit: '克' },
  { name: '黑巧克力', category: '零食', calories: 546, protein: 4.9, carbs: 61, fat: 31, servingSize: 100, servingUnit: '克' },
  { name: '薯片', category: '零食', calories: 536, protein: 6.6, carbs: 53, fat: 35, servingSize: 100, servingUnit: '克' },
  { name: '饼干', category: '零食', calories: 450, protein: 7, carbs: 65, fat: 18, servingSize: 100, servingUnit: '克' },
  { name: '咖啡', category: '饮料', calories: 1, protein: 0.3, carbs: 0, fat: 0, servingSize: 100, servingUnit: '毫升' },
  { name: '绿茶', category: '饮料', calories: 1, protein: 0.2, carbs: 0, fat: 0, servingSize: 100, servingUnit: '毫升' },
];

if (db.data.foods.length === 0) {
  db.data.foods = FOODS_RAW.map((f) => ({ ...f, id: uuidv4() }));
  await db.write();
}

const foodSearchIndex: Map<string, Food[]> = new Map();
for (const food of db.data.foods) {
  const nameLower = food.name.toLowerCase();
  for (let i = 0; i < nameLower.length; i++) {
    for (let j = i + 1; j <= nameLower.length; j++) {
      const substr = nameLower.slice(i, j);
      if (!foodSearchIndex.has(substr)) {
        foodSearchIndex.set(substr, []);
      }
      foodSearchIndex.get(substr)!.push(food);
    }
  }
  const catLower = food.category.toLowerCase();
  for (let i = 0; i < catLower.length; i++) {
    for (let j = i + 1; j <= catLower.length; j++) {
      const substr = catLower.slice(i, j);
      if (!foodSearchIndex.has(substr)) {
        foodSearchIndex.set(substr, []);
      }
      if (!foodSearchIndex.get(substr)!.includes(food)) {
        foodSearchIndex.get(substr)!.push(food);
      }
    }
  }
}

function calculateBMR(profile: Partial<UserProfile>): number {
  const { gender = 'male', age = 25, height = 170, currentWeight = 70 } = profile;
  if (gender === 'male') {
    return 88.362 + 13.397 * currentWeight + 4.799 * height - 5.677 * age;
  } else {
    return 447.593 + 9.247 * currentWeight + 3.098 * height - 4.33 * age;
  }
}

function calculateTDEE(profile: Partial<UserProfile>): number {
  const bmr = calculateBMR(profile);
  const activityLevel = profile.activityLevel ?? 3;
  const multipliers = [1.2, 1.375, 1.55, 1.725, 1.9];
  const multiplier = multipliers[Math.min(activityLevel - 1, 4)] ?? 1.375;
  return bmr * multiplier;
}

function calculateTargets(profile: Partial<UserProfile>): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
} {
  let tdee = calculateTDEE(profile);
  const goal = profile.goal ?? 'maintain';
  const cw = profile.currentWeight ?? 70;

  if (goal === 'lose') {
    tdee -= 500;
  } else if (goal === 'gain') {
    tdee += 300;
  }

  const protein = cw * 1.8;
  const fat = cw * 0.8;
  const remainingCalories = tdee - protein * 4 - fat * 9;
  const carbs = Math.max(0, remainingCalories / 4);

  return {
    calories: Math.round(tdee),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  const result: T[] = [];
  const used = new Set<number>();
  while (result.length < n && result.length < arr.length) {
    const idx = Math.floor(Math.random() * arr.length);
    if (!used.has(idx)) {
      used.add(idx);
      result.push(arr[idx]);
    }
  }
  return result;
}

function scaleFoodToTarget(
  foods: Food[],
  targetCalories: number
): PlanMeal['foods'] {
  const portionFactor = 0.3 + Math.random() * 0.7;
  return foods.map((food) => {
    const qtyBase = (targetCalories / Math.max(food.calories, 1)) * portionFactor;
    const qty = Math.round(qtyBase * 100) / 100;
    const servingRatio = (qty * 100) / food.servingSize;
    return {
      foodId: food.id,
      foodName: food.name,
      quantity: Math.round(qty * 100) / 100,
      calories: Math.round(food.calories * servingRatio),
      protein: Math.round(food.protein * servingRatio * 10) / 10,
      carbs: Math.round(food.carbs * servingRatio * 10) / 10,
      fat: Math.round(food.fat * servingRatio * 10) / 10,
    };
  });
}

function generateDayPlan(date: string, targets: {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}): DayPlan {
  const foods = db.data.foods;
  const breakfastFoods = foods.filter((f) =>
    ['蛋奶', '主食', '水果', '坚果'].includes(f.category)
  );
  const lunchDinnerFoods = foods.filter((f) =>
    ['肉类', '海鲜', '主食', '蔬菜', '豆制品'].includes(f.category)
  );
  const snackFoods = foods.filter((f) =>
    ['水果', '坚果', '蛋奶', '零食'].includes(f.category)
  );

  const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayOfWeek = weekdayNames[new Date(date).getDay()];

  const calories = targets.calories;
  const mealCalorieDist = {
    breakfast: 0.25,
    'snack-morning': 0.1,
    lunch: 0.3,
    'snack-afternoon': 0.1,
    dinner: 0.25,
  };

  const meals: PlanMeal[] = [];

  const breakfastMeals = pickRandom(breakfastFoods, 2);
  const breakfastFoodsScaled = scaleFoodToTarget(
    breakfastMeals,
    calories * mealCalorieDist.breakfast
  );
  meals.push({
    mealType: 'breakfast',
    mealName: '早餐',
    foods: breakfastFoodsScaled,
    totalCalories: breakfastFoodsScaled.reduce((s, f) => s + f.calories, 0),
    totalProtein: Math.round(breakfastFoodsScaled.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    totalCarbs: Math.round(breakfastFoodsScaled.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    totalFat: Math.round(breakfastFoodsScaled.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  });

  const morningSnackFoods = pickRandom(snackFoods, 1);
  const morningScaled = scaleFoodToTarget(
    morningSnackFoods,
    calories * mealCalorieDist['snack-morning']
  );
  meals.push({
    mealType: 'snack-morning',
    mealName: '上午加餐',
    foods: morningScaled,
    totalCalories: morningScaled.reduce((s, f) => s + f.calories, 0),
    totalProtein: Math.round(morningScaled.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    totalCarbs: Math.round(morningScaled.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    totalFat: Math.round(morningScaled.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  });

  const lunchFoodsList = pickRandom(lunchDinnerFoods, 3);
  const lunchScaled = scaleFoodToTarget(lunchFoodsList, calories * mealCalorieDist.lunch);
  meals.push({
    mealType: 'lunch',
    mealName: '午餐',
    foods: lunchScaled,
    totalCalories: lunchScaled.reduce((s, f) => s + f.calories, 0),
    totalProtein: Math.round(lunchScaled.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    totalCarbs: Math.round(lunchScaled.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    totalFat: Math.round(lunchScaled.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  });

  const afternoonSnackFoods = pickRandom(snackFoods, 1);
  const afternoonScaled = scaleFoodToTarget(
    afternoonSnackFoods,
    calories * mealCalorieDist['snack-afternoon']
  );
  meals.push({
    mealType: 'snack-afternoon',
    mealName: '下午加餐',
    foods: afternoonScaled,
    totalCalories: afternoonScaled.reduce((s, f) => s + f.calories, 0),
    totalProtein: Math.round(afternoonScaled.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    totalCarbs: Math.round(afternoonScaled.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    totalFat: Math.round(afternoonScaled.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  });

  const dinnerFoodsList = pickRandom(lunchDinnerFoods, 3);
  const dinnerScaled = scaleFoodToTarget(dinnerFoodsList, calories * mealCalorieDist.dinner);
  meals.push({
    mealType: 'dinner',
    mealName: '晚餐',
    foods: dinnerScaled,
    totalCalories: dinnerScaled.reduce((s, f) => s + f.calories, 0),
    totalProtein: Math.round(dinnerScaled.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    totalCarbs: Math.round(dinnerScaled.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    totalFat: Math.round(dinnerScaled.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  });

  return {
    date,
    dayOfWeek,
    totalCalories: meals.reduce((s, m) => s + m.totalCalories, 0),
    totalProtein: Math.round(meals.reduce((s, m) => s + m.totalProtein, 0) * 10) / 10,
    totalCarbs: Math.round(meals.reduce((s, m) => s + m.totalCarbs, 0) * 10) / 10,
    totalFat: Math.round(meals.reduce((s, m) => s + m.totalFat, 0) * 10) / 10,
    meals,
  };
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' });
});

app.get('/api/foods', (req: Request, res: Response) => {
  const query = (req.query.q as string)?.trim().toLowerCase() ?? '';
  const limit = parseInt((req.query.limit as string) ?? '50', 10);

  if (!query) {
    res.status(200).json({
      success: true,
      data: db.data.foods.slice(0, limit),
      count: db.data.foods.length,
    });
    return;
  }

  const exactMatches: Food[] = [];
  const prefixMatches: Food[] = [];
  const substringMatches: Food[] = [];
  const seen = new Set<string>();

  for (const food of db.data.foods) {
    const nameLower = food.name.toLowerCase();
    const catLower = food.category.toLowerCase();
    if (nameLower === query || catLower === query) {
      if (!seen.has(food.id)) {
        seen.add(food.id);
        exactMatches.push(food);
      }
    } else if (nameLower.startsWith(query) || catLower.startsWith(query)) {
      if (!seen.has(food.id)) {
        seen.add(food.id);
        prefixMatches.push(food);
      }
    }
  }

  const indexed = foodSearchIndex.get(query) ?? [];
  for (const food of indexed) {
    if (!seen.has(food.id)) {
      seen.add(food.id);
      substringMatches.push(food);
    }
  }

  const result = [...exactMatches, ...prefixMatches, ...substringMatches].slice(0, limit);

  res.status(200).json({
    success: true,
    data: result,
    count: result.length,
  });
});

app.get('/api/foods/:id', (req: Request, res: Response) => {
  const food = db.data.foods.find((f) => f.id === req.params.id);
  if (!food) {
    res.status(404).json({ success: false, error: '食物未找到' });
    return;
  }
  res.status(200).json({ success: true, data: food });
});

app.get('/api/meals', (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? formatDate(new Date());
  const entries = db.data.mealEntries.filter((m) => m.date === date);
  res.status(200).json({ success: true, data: entries, count: entries.length });
});

app.post('/api/meals', async (req: Request, res: Response) => {
  const body = req.body as Partial<MealEntry>;
  if (!body.foodId || !body.mealType || !body.quantity || !body.date) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }

  const food = db.data.foods.find((f) => f.id === body.foodId);
  if (!food) {
    res.status(404).json({ success: false, error: '食物不存在' });
    return;
  }

  const ratio = (body.quantity * 100) / food.servingSize;
  const entry: MealEntry = {
    id: uuidv4(),
    foodId: food.id,
    foodName: food.name,
    mealType: body.mealType,
    quantity: body.quantity,
    calories: Math.round(food.calories * ratio),
    protein: Math.round(food.protein * ratio * 10) / 10,
    carbs: Math.round(food.carbs * ratio * 10) / 10,
    fat: Math.round(food.fat * ratio * 10) / 10,
    date: body.date,
    createdAt: new Date().toISOString(),
  };

  db.data.mealEntries.push(entry);
  await db.write();

  res.status(201).json({ success: true, data: entry });
});

app.delete('/api/meals/:id', async (req: Request, res: Response) => {
  const idx = db.data.mealEntries.findIndex((m) => m.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, error: '记录不存在' });
    return;
  }
  const [removed] = db.data.mealEntries.splice(idx, 1);
  await db.write();
  res.status(200).json({ success: true, data: removed });
});

app.get('/api/nutrition/daily', (req: Request, res: Response) => {
  const date = (req.query.date as string) ?? formatDate(new Date());
  const entries = db.data.mealEntries.filter((m) => m.date === date);

  const totals = entries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const profile = db.data.userProfile;
  const targets = profile
    ? {
        calories: profile.targetCalories,
        protein: profile.targetProtein,
        carbs: profile.targetCarbs,
        fat: profile.targetFat,
      }
    : calculateTargets({});

  res.status(200).json({
    success: true,
    data: {
      date,
      ...totals,
      protein: Math.round(totals.protein * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      targetCalories: targets.calories,
      targetProtein: targets.protein,
      targetCarbs: targets.carbs,
      targetFat: targets.fat,
    },
  });
});

app.get('/api/nutrition/weekly', (req: Request, res: Response) => {
  const daysRaw = parseInt((req.query.days as string) ?? '7', 10);
  const days = Math.max(1, Math.min(30, daysRaw));
  const result: Array<{
    date: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    targetCalories: number;
  }> = [];

  const profile = db.data.userProfile;
  const targets = profile
    ? {
        calories: profile.targetCalories,
        protein: profile.targetProtein,
        carbs: profile.targetCarbs,
        fat: profile.targetFat,
      }
    : calculateTargets({});

  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = formatDate(d);
    const entries = db.data.mealEntries.filter((m) => m.date === dateStr);
    const dayTotals = entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    result.push({
      date: dateStr,
      ...dayTotals,
      protein: Math.round(dayTotals.protein * 10) / 10,
      carbs: Math.round(dayTotals.carbs * 10) / 10,
      fat: Math.round(dayTotals.fat * 10) / 10,
      targetCalories: targets.calories,
    });
  }

  res.status(200).json({ success: true, data: result, count: result.length });
});

app.get('/api/profile', (_req: Request, res: Response) => {
  if (!db.data.userProfile) {
    const defaultProfile: UserProfile = {
      id: uuidv4(),
      name: '用户',
      age: 25,
      gender: 'male',
      height: 170,
      currentWeight: 70,
      targetWeight: 65,
      activityLevel: 3,
      goal: 'lose',
      ...calculateTargets({
        gender: 'male',
        age: 25,
        height: 170,
        currentWeight: 70,
        goal: 'lose',
        activityLevel: 3,
      }),
    };
    res.status(200).json({ success: true, data: defaultProfile });
    return;
  }
  res.status(200).json({ success: true, data: db.data.userProfile });
});

app.post('/api/profile', async (req: Request, res: Response) => {
  const body = req.body as Partial<UserProfile>;
  const targets = calculateTargets(body);
  const newProfile: UserProfile = {
    id: db.data.userProfile?.id ?? uuidv4(),
    name: body.name ?? db.data.userProfile?.name ?? '用户',
    age: body.age ?? db.data.userProfile?.age ?? 25,
    gender: body.gender ?? db.data.userProfile?.gender ?? 'male',
    height: body.height ?? db.data.userProfile?.height ?? 170,
    currentWeight: body.currentWeight ?? db.data.userProfile?.currentWeight ?? 70,
    targetWeight: body.targetWeight ?? db.data.userProfile?.targetWeight ?? 65,
    activityLevel: body.activityLevel ?? db.data.userProfile?.activityLevel ?? 3,
    goal: body.goal ?? db.data.userProfile?.goal ?? 'maintain',
    ...targets,
  };
  db.data.userProfile = newProfile;
  await db.write();
  res.status(200).json({ success: true, data: newProfile });
});

app.post('/api/profile/calculate', (req: Request, res: Response) => {
  const body = req.body as Partial<UserProfile>;
  const bmr = calculateBMR(body);
  const tdee = calculateTDEE(body);
  const targets = calculateTargets(body);
  res.status(200).json({
    success: true,
    data: {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      ...targets,
    },
  });
});

app.get('/api/plans', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: db.data.weeklyPlans,
    count: db.data.weeklyPlans.length,
  });
});

app.post('/api/plans/generate', async (req: Request, res: Response) => {
  const body = req.body as { startDate?: string } ?? {};
  let startDate: Date;
  if (body.startDate) {
    startDate = new Date(body.startDate);
  } else {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    startDate = now;
  }

  const profile = db.data.userProfile;
  const targets = profile
    ? {
        calories: profile.targetCalories,
        protein: profile.targetProtein,
        carbs: profile.targetCarbs,
        fat: profile.targetFat,
      }
    : calculateTargets({});

  const days: DayPlan[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(generateDayPlan(formatDate(d), targets));
  }

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const plan: WeeklyPlan = {
    id: uuidv4(),
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    days,
    createdAt: new Date().toISOString(),
  };

  db.data.weeklyPlans.push(plan);
  await db.write();

  res.status(201).json({ success: true, data: plan });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'API not found' });
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

const server = app.listen(PORT, () => {
  console.log(`Nutrition API server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => process.exit(0));
});
process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => process.exit(0));
});

export default app;
