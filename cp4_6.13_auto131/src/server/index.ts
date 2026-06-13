import express from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const db = new Database(path.join(__dirname, 'recipe.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);

  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cuisine TEXT NOT NULL,
    emoji TEXT,
    cook_time INTEGER NOT NULL,
    calories INTEGER NOT NULL,
    steps TEXT NOT NULL,
    is_vegetarian INTEGER DEFAULT 0,
    is_low_fat INTEGER DEFAULT 0,
    is_high_protein INTEGER DEFAULT 0,
    is_gluten_free INTEGER DEFAULT 0,
    has_peanut INTEGER DEFAULT 0,
    has_seafood INTEGER DEFAULT 0,
    has_dairy INTEGER DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
  CREATE INDEX IF NOT EXISTS idx_recipes_calories ON recipes(calories);

  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id TEXT PRIMARY KEY,
    recipe_id TEXT NOT NULL,
    ingredient_name TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
  );
  CREATE INDEX IF NOT EXISTS idx_ri_recipe ON recipe_ingredients(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_ri_ingredient ON recipe_ingredients(ingredient_name);
`);

const ingredientCount = db.prepare('SELECT COUNT(*) as cnt FROM ingredients').get() as { cnt: number };
if (ingredientCount.cnt === 0) {
  const seedIngredients: string[] = [
    '番茄', '土豆', '胡萝卜', '洋葱', '大蒜', '生姜', '青椒', '红椒',
    '黄瓜', '茄子', '白菜', '菠菜', '生菜', '西兰花', '蘑菇', '豆腐',
    '鸡蛋', '牛奶', '黄油', '奶酪', '鸡胸肉', '牛肉', '猪肉', '三文鱼',
    '虾仁', '鱿鱼', '大米', '面条', '意大利面', '面包', '花生', '酱油',
    '醋', '盐', '糖', '橄榄油', '花生油', '料酒', '淀粉', '番茄酱'
  ];

  const insertIng = db.prepare('INSERT INTO ingredients (id, name) VALUES (?, ?)');
  const transIng = db.transaction((ings: string[]) => {
    for (const n of ings) insertIng.run(uuidv4(), n);
  });
  transIm(seedIngredients);

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (id, name, cuisine, emoji, cook_time, calories, steps,
      is_vegetarian, is_low_fat, is_high_protein, is_gluten_free,
      has_peanut, has_seafood, has_dairy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRI = db.prepare('INSERT INTO recipe_ingredients (id, recipe_id, ingredient_name) VALUES (?, ?, ?)');

  const seedRecipes: Array<{
    name: string; cuisine: string; emoji: string; cook_time: number; calories: number;
    ingredients: string[]; steps: string;
    flags: [number, number, number, number, number, number, number];
  }> = [
    {
      name: '番茄炒蛋', cuisine: '中餐', emoji: '🍳', cook_time: 15, calories: 320,
      ingredients: ['番茄', '鸡蛋', '盐', '糖', '花生油'],
      steps: '1.番茄切块，鸡蛋打散。2.热油炒蛋盛出。3.炒番茄出汁，加盐糖。4.倒入鸡蛋翻炒均匀。',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '土豆烧牛肉', cuisine: '中餐', emoji: '🥘', cook_time: 60, calories: 580,
      ingredients: ['土豆', '牛肉', '胡萝卜', '洋葱', '酱油', '料酒', '盐'],
      steps: '1.牛肉焯水。2.炒香洋葱。3.加牛肉酱油料酒炖煮。4.加土豆胡萝卜炖软。',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '宫保鸡丁', cuisine: '中餐', emoji: '🍗', cook_time: 25, calories: 450,
      ingredients: ['鸡胸肉', '花生', '青椒', '胡萝卜', '酱油', '醋', '糖'],
      steps: '1.鸡肉切丁腌制。2.爆香辣椒。3.下鸡丁快炒。4.加花生和调味汁翻炒。',
      flags: [0, 0, 1, 1, 1, 0, 0]
    },
    {
      name: '麻婆豆腐', cuisine: '中餐', emoji: '🌶️', cook_time: 20, calories: 380,
      ingredients: ['豆腐', '猪肉', '大蒜', '生姜', '酱油', '淀粉', '盐'],
      steps: '1.豆腐切块焯水。2.炒肉末。3.加豆瓣酱炒香。4.下豆腐轻推勾芡。',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '清炒时蔬', cuisine: '中餐', emoji: '🥬', cook_time: 10, calories: 180,
      ingredients: ['白菜', '大蒜', '盐', '花生油'],
      steps: '1.白菜撕片。2.热油爆蒜。3.下白菜快炒加盐出锅。',
      flags: [1, 1, 0, 1, 0, 0, 0]
    },
    {
      name: '意大利肉酱面', cuisine: '西餐', emoji: '🍝', cook_time: 40, calories: 620,
      ingredients: ['意大利面', '牛肉', '番茄', '洋葱', '大蒜', '番茄酱', '橄榄油'],
      steps: '1.煮意面。2.炒香洋葱大蒜。3.加牛肉末炒散。4.加番茄酱汁熬煮。5.混合拌匀。',
      flags: [0, 0, 1, 0, 0, 0, 0]
    },
    {
      name: '凯撒沙拉', cuisine: '西餐', emoji: '🥗', cook_time: 15, calories: 350,
      ingredients: ['生菜', '面包', '奶酪', '鸡蛋', '橄榄油', '盐'],
      steps: '1.生菜撕片。2.面包切丁烤脆。3.做凯撒酱。4.全部拌匀撒帕玛森。',
      flags: [1, 0, 0, 0, 0, 0, 1]
    },
    {
      name: '奶油蘑菇汤', cuisine: '西餐', emoji: '🍲', cook_time: 30, calories: 420,
      ingredients: ['蘑菇', '洋葱', '黄油', '牛奶', '面粉', '盐'],
      steps: '1.炒香洋葱蘑菇。2.加面粉炒。3.加牛奶搅打。4.调味煮开。',
      flags: [1, 0, 0, 1, 0, 0, 1]
    },
    {
      name: '香煎牛排', cuisine: '西餐', emoji: '🥩', cook_time: 25, calories: 680,
      ingredients: ['牛肉', '盐', '黑胡椒', '黄油', '大蒜', '橄榄油'],
      steps: '1.牛排擦干腌制。2.热锅大火煎。3.加黄油大蒜淋汁。4.静置切片。',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '芝士汉堡', cuisine: '西餐', emoji: '🍔', cook_time: 30, calories: 720,
      ingredients: ['牛肉', '面包', '奶酪', '生菜', '番茄', '洋葱', '盐'],
      steps: '1.牛肉末做饼煎熟。2.面包烤一下。3.依次叠放生菜番茄肉饼奶酪。',
      flags: [0, 0, 1, 0, 0, 0, 1]
    },
    {
      name: '寿司饭', cuisine: '日料', emoji: '🍣', cook_time: 35, calories: 520,
      ingredients: ['大米', '三文鱼', '黄瓜', '胡萝卜', '醋', '盐', '糖'],
      steps: '1.米饭煮好拌醋糖盐。2.三文鱼切片。3.手握饭铺鱼。',
      flags: [0, 1, 1, 1, 0, 1, 0]
    },
    {
      name: '味噌汤', cuisine: '日料', emoji: '🍜', cook_time: 20, calories: 220,
      ingredients: ['豆腐', '蘑菇', '海带', '葱', '盐'],
      steps: '1.煮海带汤。2.加豆腐蘑菇。3.味噌酱调开加入。4.撒葱花。',
      flags: [1, 1, 0, 1, 0, 0, 0]
    },
    {
      name: '天妇罗', cuisine: '日料', emoji: '🍤', cook_time: 25, calories: 560,
      ingredients: ['虾仁', '青椒', '茄子', '胡萝卜', '面粉', '鸡蛋', '花生油'],
      steps: '1.做面衣。2.食材裹面衣。3.油温180度炸金黄。4.配蘸料。',
      flags: [0, 0, 1, 0, 0, 1, 0]
    },
    {
      name: '照烧鸡腿', cuisine: '日料', emoji: '🍗', cook_time: 30, calories: 580,
      ingredients: ['鸡胸肉', '酱油', '糖', '料酒', '大蒜', '生姜'],
      steps: '1.鸡腿腌制。2.煎两面金黄。3.加照烧汁收汁。4.切片装盘。',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '日式咖喱饭', cuisine: '日料', emoji: '🍛', cook_time: 45, calories: 650,
      ingredients: ['大米', '土豆', '胡萝卜', '洋葱', '牛肉', '咖喱块'],
      steps: '1.炒香洋葱。2.加肉蔬菜炒。3.加水煮软。4.加咖喱块融化煮稠。',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '韩式石锅拌饭', cuisine: '韩餐', emoji: '🍚', cook_time: 35, calories: 600,
      ingredients: ['大米', '菠菜', '胡萝卜', '蘑菇', '牛肉', '鸡蛋', '酱油'],
      steps: '1.各蔬菜分别炒好。2.牛肉炒香。3.石锅盛饭摆菜。4.中间放煎蛋辣酱。',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '泰式冬阴功汤', cuisine: '泰餐', emoji: '🍲', cook_time: 30, calories: 380,
      ingredients: ['虾仁', '蘑菇', '柠檬', '辣椒', '大蒜', '盐'],
      steps: '1.煮香茅南姜。2.加蘑菇辣椒。3.放虾煮熟。4.加柠檬汁鱼露调味。',
      flags: [0, 0, 1, 1, 0, 1, 0]
    },
    {
      name: '法式煎蛋卷', cuisine: '西餐', emoji: '🍳', cook_time: 10, calories: 340,
      ingredients: ['鸡蛋', '奶酪', '黄油', '牛奶', '盐'],
      steps: '1.鸡蛋加牛奶打散。2.黄油融化倒蛋液。3.半凝固加奶酪。4.对折出锅。',
      flags: [1, 0, 1, 1, 0, 0, 1]
    },
    {
      name: '蒜蓉西兰花', cuisine: '中餐', emoji: '🥦', cook_time: 12, calories: 200,
      ingredients: ['西兰花', '大蒜', '盐', '橄榄油'],
      steps: '1.西兰花焯水。2.爆香蒜末。3.下西兰花快炒加盐。',
      flags: [1, 1, 0, 1, 0, 0, 0]
    },
    {
      name: '虾仁意面', cuisine: '西餐', emoji: '🦐', cook_time: 25, calories: 560,
      ingredients: ['意大利面', '虾仁', '大蒜', '橄榄油', '盐', '辣椒', '柠檬'],
      steps: '1.煮意面。2.爆香蒜辣椒。3.加虾仁煎熟。4.拌入意面和柠檬。',
      flags: [0, 1, 1, 0, 0, 1, 0]
    }
  ];

  const transRecipes = db.transaction((recipes: typeof seedRecipes) => {
    for (const r of recipes) {
      const rid = uuidv4();
      insertRecipe.run(rid, r.name, r.cuisine, r.emoji, r.cook_time, r.calories, r.steps, ...r.flags);
      for (const ing of r.ingredients) {
        insertRI.run(uuidv4(), rid, ing);
      }
    }
  });
  transRecipes(seedRecipes);
}

interface Recipe {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  cook_time: number;
  calories: number;
  steps: string;
  ingredients: string[];
  matchScore: number;
  is_vegetarian: number;
  is_low_fat: number;
  is_high_protein: number;
  is_gluten_free: number;
  has_peanut: number;
  has_seafood: number;
  has_dairy: number;
}

function getAllRecipes(): Recipe[] {
  const rows = db.prepare(`
    SELECT r.*, GROUP_CONCAT(ri.ingredient_name, ',') as ingredients_list
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    GROUP BY r.id
  `).all() as Array<{ ingredients_list: string } & Omit<Recipe, 'ingredients' | 'matchScore'>>;
  return rows.map(r => ({
    ...r,
    ingredients: (r.ingredients_list || '').split(',').filter(Boolean),
    matchScore: 0
  }));
}

app.get('/api/ingredients', (req, res) => {
  const q = (req.query.q as string) || '';
  const rows = db.prepare(`
    SELECT name FROM ingredients WHERE name LIKE ? ORDER BY name LIMIT 20
  `).all(`%${q}%`) as { name: string }[];
  res.json(rows.map(r => r.name));
});

interface RecommendBody {
  ingredients: string[];
  preferences?: {
    vegetarian?: boolean;
    lowFat?: boolean;
    highProtein?: boolean;
    glutenFree?: boolean;
  };
  allergens?: {
    peanut?: boolean;
    seafood?: boolean;
    dairy?: boolean;
  };
}

app.post('/api/recommend', (req, res) => {
  const { ingredients = [], preferences = {}, allergens = {} } = req.body as RecommendBody;
  const userIngredients = new Set(ingredients.map(i => i.trim()).filter(Boolean));

  let all = getAllRecipes();

  if (preferences.vegetarian) all = all.filter(r => r.is_vegetarian);
  if (preferences.lowFat) all = all.filter(r => r.is_low_fat);
  if (preferences.highProtein) all = all.filter(r => r.is_high_protein);
  if (preferences.glutenFree) all = all.filter(r => r.is_gluten_free);
  if (allergens.peanut) all = all.filter(r => !r.has_peanut);
  if (allergens.seafood) all = all.filter(r => !r.has_seafood);
  if (allergens.dairy) all = all.filter(r => !r.has_dairy);

  const scored = all.map(r => {
    const needed = new Set(r.ingredients);
    if (needed.size === 0) return { ...r, matchScore: 0 };
    let matched = 0;
    for (const ing of needed) {
      if (userIngredients.has(ing)) matched++;
    }
    const coverage = matched / needed.size;
    return { ...r, matchScore: Math.round(coverage * 100) };
  }).filter(r => r.matchScore >= 60)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  res.json(scored);
});

interface GenerateBody {
  selectedRecipes?: string[];
  minCalories?: number;
  maxCalories?: number;
}

const MEAL_NAMES = ['早餐', '午餐', '晚餐'];
const DAY_NAMES = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

app.post('/api/generate-meal-plan', (req, res) => {
  const { selectedRecipes = [], minCalories = 500, maxCalories = 800 } = req.body as GenerateBody;
  const all = getAllRecipes().filter(r => r.calories >= minCalories && r.calories <= maxCalories);

  const selected = selectedRecipes.length > 0
    ? all.filter(r => selectedRecipes.includes(r.id))
    : all;

  const pool = selected.length >= 7 ? selected : all;

  const plan: Array<{ day: string; dayIndex: number; meals: Array<{ meal: string; recipe: Recipe }> }> = [];

  for (let d = 0; d < 7; d++) {
    const dayCuisines = new Set<string>();
    const dayMeals: Array<{ meal: string; recipe: Recipe }> = [];
    let dayCalories = 0;
    const target = (minCalories + maxCalories) / 2 * 3;

    for (let m = 0; m < 3; m++) {
      const remaining = target - dayCalories - (2 - m) * minCalories;
      const upper = Math.min(maxCalories, remaining > 0 ? remaining + 150 : maxCalories);
      const candidates = shuffle(pool.filter(r => {
        if (dayCuisines.has(r.cuisine) && pool.some(x => !dayCuisines.has(x.cuisine))) return false;
        return r.calories >= minCalories && r.calories <= upper;
      }));
      let chosen = candidates[0];
      if (!chosen) {
        const fallback = shuffle(pool.filter(r => !dayCuisines.has(r.cuisine)));
        chosen = fallback[0] || shuffle(pool)[0];
      }
      dayCuisines.add(chosen.cuisine);
      dayCalories += chosen.calories;
      dayMeals.push({ meal: MEAL_NAMES[m], recipe: chosen });
    }
    plan.push({ day: DAY_NAMES[d], dayIndex: d, meals: dayMeals });
  }
  res.json({ plan, totalDays: 7 });
});

interface ReplaceBody {
  dayIndex: number;
  mealIndex: number;
  currentPlan: Array<{ day: string; dayIndex: number; meals: Array<{ meal: string; recipe: Recipe }> }>;
  minCalories?: number;
  maxCalories?: number;
}

app.post('/api/replace-meal', (req, res) => {
  const { dayIndex, mealIndex, currentPlan, minCalories = 500, maxCalories = 800 } = req.body as ReplaceBody;
  const day = currentPlan[dayIndex];
  if (!day) return res.status(400).json({ error: 'Invalid day' });
  const usedCuisines = new Set(day.meals.filter((_, i) => i !== mealIndex).map(m => m.recipe.cuisine));
  const currentId = day.meals[mealIndex]?.recipe.id;

  const all = getAllRecipes().filter(r =>
    r.calories >= minCalories &&
    r.calories <= maxCalories &&
    r.id !== currentId &&
    !usedCuisines.has(r.cuisine)
  );

  const pool = all.length > 0 ? all : getAllRecipes().filter(r => r.id !== currentId);
  const chosen = shuffle(pool)[0];
  res.json({ recipe: chosen });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
