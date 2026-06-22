import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, WeekPlan, MealCategory } from './types';
import { filterRecipes, calculateWeeklyNutrition, formatChartData, calculateNutrition } from './mealPlanner';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let recipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '燕麦牛奶粥',
    category: 'breakfast',
    ingredients: [
      { name: '燕麦', grams: 50 },
      { name: '牛奶', grams: 200 },
      { name: '香蕉', grams: 100 },
    ],
    steps: ['将燕麦放入碗中', '加入牛奶搅拌', '放入微波炉加热2分钟', '加入切好的香蕉片'],
    nutrition: { calories: 423, protein: 15.4, carbs: 73.2, fat: 7.7 },
  },
  {
    id: uuidv4(),
    name: '煎蛋三明治',
    category: 'breakfast',
    ingredients: [
      { name: '面包', grams: 60 },
      { name: '鸡蛋', grams: 50 },
      { name: '黄油', grams: 10 },
    ],
    steps: ['面包切片', '平底锅加热黄油', '煎蛋至两面金黄', '将煎蛋夹入面包中'],
    nutrition: { calories: 310, protein: 14.6, carbs: 29.5, fat: 15 },
  },
  {
    id: uuidv4(),
    name: '鸡胸肉西兰花饭',
    category: 'lunch',
    ingredients: [
      { name: '鸡胸肉', grams: 150 },
      { name: '西兰花', grams: 200 },
      { name: '米饭', grams: 200 },
      { name: '橄榄油', grams: 10 },
    ],
    steps: ['鸡胸肉切块腌制', '西兰花切小朵焯水', '热锅倒油炒熟鸡肉', '加入西兰花翻炒', '配米饭食用'],
    nutrition: { calories: 510, protein: 55.3, carbs: 59.4, fat: 14.6 },
  },
  {
    id: uuidv4(),
    name: '番茄牛肉面',
    category: 'dinner',
    ingredients: [
      { name: '牛肉', grams: 100 },
      { name: '番茄', grams: 150 },
      { name: '面条', grams: 150 },
      { name: '橄榄油', grams: 5 },
    ],
    steps: ['牛肉切片腌制', '番茄切块', '热锅炒香牛肉盛出', '炒番茄出汁加水煮沸', '下面条煮熟', '加入牛肉拌匀'],
    nutrition: { calories: 574, protein: 37.5, carbs: 82.7, fat: 17.5 },
  },
  {
    id: uuidv4(),
    name: '水果沙拉',
    category: 'snack',
    ingredients: [
      { name: '苹果', grams: 100 },
      { name: '香蕉', grams: 100 },
      { name: '黄瓜', grams: 50 },
    ],
    steps: ['苹果切丁', '香蕉切片', '黄瓜切丝', '混合均匀即可'],
    nutrition: { calories: 158, protein: 2, carbs: 40.6, fat: 0.7 },
  },
];

const initialRecipesIds = new Set(recipes.map(r => r.id));

let weekPlan: WeekPlan = Array(7).fill(null).map(() => ({
  breakfast: null,
  lunch: null,
  dinner: null,
  snack: null,
}));

app.get('/api/recipes', (req, res) => {
  const { category, search } = req.query;
  const filtered = filterRecipes(recipes, category as MealCategory, search as string);
  res.json(filtered);
});

app.post('/api/recipes', (req, res) => {
  const { name, category, ingredients, steps } = req.body;
  if (!name || !category || !ingredients) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  const nutrition = calculateNutrition(ingredients);
  const newRecipe: Recipe = {
    id: uuidv4(),
    name,
    category,
    ingredients,
    steps: steps || [],
    nutrition,
  };
  recipes.push(newRecipe);
  res.status(201).json(newRecipe);
});

app.put('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const idx = recipes.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '食谱不存在' });
  }
  const { name, category, ingredients, steps } = req.body;
  const nutrition = ingredients ? calculateNutrition(ingredients) : recipes[idx].nutrition;
  recipes[idx] = {
    ...recipes[idx],
    name: name || recipes[idx].name,
    category: category || recipes[idx].category,
    ingredients: ingredients || recipes[idx].ingredients,
    steps: steps || recipes[idx].steps,
    nutrition,
  };
  res.json(recipes[idx]);
});

app.delete('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const idx = recipes.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '食谱不存在' });
  }
  recipes.splice(idx, 1);
  for (let i = 0; i < weekPlan.length; i++) {
    const day = weekPlan[i];
    if (day.breakfast?.id === id) day.breakfast = null;
    if (day.lunch?.id === id) day.lunch = null;
    if (day.dinner?.id === id) day.dinner = null;
    if (day.snack?.id === id) day.snack = null;
  }
  res.json({ message: '删除成功' });
});

app.get('/api/week-plan', (_req, res) => {
  const weeklyNutrition = calculateWeeklyNutrition(weekPlan);
  const chartData = formatChartData(weeklyNutrition);
  res.json({ plan: weekPlan, nutrition: weeklyNutrition, chartData });
});

app.put('/api/week-plan/:dayIndex/:mealType', (req, res) => {
  const { dayIndex, mealType } = req.params;
  const dayIdx = parseInt(dayIndex);
  if (isNaN(dayIdx) || dayIdx < 0 || dayIdx > 6) {
    return res.status(400).json({ error: '无效的日期索引' });
  }
  const validMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMeals.includes(mealType)) {
    return res.status(400).json({ error: '无效的餐次类型' });
  }
  const { recipeId } = req.body;
  const mealKey = mealType as keyof DayMeals;
  if (recipeId === null) {
    weekPlan[dayIdx][mealKey] = null;
  } else {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) {
      return res.status(404).json({ error: '食谱不存在' });
    }
    weekPlan[dayIdx][mealKey] = recipe;
  }
  const weeklyNutrition = calculateWeeklyNutrition(weekPlan);
  const chartData = formatChartData(weeklyNutrition);
  res.json({ plan: weekPlan, nutrition: weeklyNutrition, chartData });
});

app.put('/api/week-plan/swap', (req, res) => {
  const { fromDay, fromMeal, toDay, toMeal } = req.body;
  if (
    typeof fromDay !== 'number' || typeof fromMeal !== 'string' ||
    typeof toDay !== 'number' || typeof toMeal !== 'string'
  ) {
    return res.status(400).json({ error: '参数无效' });
  }
  const validMeals = ['breakfast', 'lunch', 'dinner', 'snack'];
  if (!validMeals.includes(fromMeal) || !validMeals.includes(toMeal)) {
    return res.status(400).json({ error: '无效的餐次类型' });
  }
  const fromKey = fromMeal as keyof DayMeals;
  const toKey = toMeal as keyof DayMeals;
  const temp = weekPlan[fromDay][fromKey];
  weekPlan[fromDay][fromKey] = weekPlan[toDay][toKey];
  weekPlan[toDay][toKey] = temp;
  const weeklyNutrition = calculateWeeklyNutrition(weekPlan);
  const chartData = formatChartData(weeklyNutrition);
  res.json({ plan: weekPlan, nutrition: weeklyNutrition, chartData });
});

app.post('/api/reset', (_req, res) => {
  recipes = recipes.filter(r => initialRecipesIds.has(r.id));
  weekPlan = Array(7).fill(null).map(() => ({
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  }));
  const weeklyNutrition = calculateWeeklyNutrition(weekPlan);
  const chartData = formatChartData(weeklyNutrition);
  res.json({ plan: weekPlan, recipes, nutrition: weeklyNutrition, chartData });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
