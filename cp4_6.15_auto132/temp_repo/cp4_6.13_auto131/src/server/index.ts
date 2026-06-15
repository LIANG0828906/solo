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
  const seedIngredients: Array<{ name: string; category: string }> = [
    { name: '番茄', category: '蔬菜' },
    { name: '土豆', category: '蔬菜' },
    { name: '胡萝卜', category: '蔬菜' },
    { name: '洋葱', category: '蔬菜' },
    { name: '大蒜', category: '香料' },
    { name: '生姜', category: '香料' },
    { name: '青椒', category: '蔬菜' },
    { name: '红椒', category: '蔬菜' },
    { name: '黄瓜', category: '蔬菜' },
    { name: '茄子', category: '蔬菜' },
    { name: '白菜', category: '蔬菜' },
    { name: '菠菜', category: '蔬菜' },
    { name: '生菜', category: '蔬菜' },
    { name: '西兰花', category: '蔬菜' },
    { name: '蘑菇', category: '蔬菜' },
    { name: '豆腐', category: '豆制品' },
    { name: '豆皮', category: '豆制品' },
    { name: '豆浆', category: '豆制品' },
    { name: '腐竹', category: '豆制品' },
    { name: '鸡蛋', category: '蛋奶' },
    { name: '牛奶', category: '蛋奶' },
    { name: '黄油', category: '蛋奶' },
    { name: '奶酪', category: '蛋奶' },
    { name: '鸡胸肉', category: '肉类' },
    { name: '牛肉', category: '肉类' },
    { name: '猪肉', category: '肉类' },
    { name: '三文鱼', category: '海鲜' },
    { name: '虾仁', category: '海鲜' },
    { name: '鱿鱼', category: '海鲜' },
    { name: '扇贝', category: '海鲜' },
    { name: '鲈鱼', category: '海鲜' },
    { name: '大米', category: '主食' },
    { name: '面条', category: '主食' },
    { name: '意大利面', category: '主食' },
    { name: '面包', category: '主食' },
    { name: '花生', category: '坚果' },
    { name: '酱油', category: '调料' },
    { name: '醋', category: '调料' },
    { name: '盐', category: '调料' },
    { name: '糖', category: '调料' },
    { name: '橄榄油', category: '油脂' },
    { name: '花生油', category: '油脂' },
    { name: '料酒', category: '调料' },
    { name: '淀粉', category: '调料' },
    { name: '番茄酱', category: '调料' },
    { name: '辣椒', category: '香料' },
    { name: '花椒', category: '香料' },
    { name: '八角', category: '香料' },
    { name: '黑胡椒', category: '香料' },
    { name: '咖喱块', category: '调料' },
    { name: '面粉', category: '主食' },
    { name: '柠檬', category: '水果' },
    { name: '海带', category: '蔬菜' },
    { name: '葱', category: '香料' },
    { name: '香菜', category: '香料' },
    { name: '芝麻', category: '坚果' }
  ];

  const insertIng = db.prepare('INSERT INTO ingredients (id, name, category) VALUES (?, ?, ?)');
  const transIng = db.transaction((ings: typeof seedIngredients) => {
    for (const item of ings) insertIng.run(uuidv4(), item.name, item.category);
  });
  transIng(seedIngredients);

  const insertRecipe = db.prepare(`
    INSERT INTO recipes (id, name, cuisine, emoji, cook_time, calories, steps,
      is_vegetarian, is_low_fat, is_high_protein, is_gluten_free,
      has_peanut, has_seafood, has_dairy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertRI = db.prepare('INSERT INTO recipe_ingredients (id, recipe_id, ingredient_name) VALUES (?, ?, ?)');

  type Flags = [number, number, number, number, number, number, number];

  const seedRecipes: Array<{
    name: string; cuisine: string; emoji: string; cook_time: number; calories: number;
    ingredients: string[]; steps: string; flags: Flags;
  }> = [
    {
      name: '番茄炒蛋', cuisine: '中餐', emoji: '🍳', cook_time: 15, calories: 320,
      ingredients: ['番茄', '鸡蛋', '盐', '糖', '花生油'],
      steps: '1.番茄切块，鸡蛋打散\n2.热油炒蛋盛出\n3.炒番茄出汁，加盐糖调味\n4.倒入鸡蛋翻炒均匀出锅',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '土豆烧牛肉', cuisine: '中餐', emoji: '🥘', cook_time: 60, calories: 580,
      ingredients: ['土豆', '牛肉', '胡萝卜', '洋葱', '酱油', '料酒', '盐'],
      steps: '1.牛肉切块焯水去血沫\n2.炒香洋葱和姜\n3.加牛肉、酱油、料酒炖煮40分钟\n4.加土豆胡萝卜继续炖至软烂',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '宫保鸡丁', cuisine: '中餐', emoji: '🍗', cook_time: 25, calories: 450,
      ingredients: ['鸡胸肉', '花生', '青椒', '胡萝卜', '酱油', '醋', '糖'],
      steps: '1.鸡肉切丁加淀粉腌制\n2.调宫保汁：酱油醋糖淀粉\n3.热油爆香干辣椒花椒\n4.下鸡丁快炒变色，加花生和调味汁翻炒',
      flags: [0, 0, 1, 1, 1, 0, 0]
    },
    {
      name: '麻婆豆腐', cuisine: '中餐', emoji: '🌶️', cook_time: 20, calories: 380,
      ingredients: ['豆腐', '猪肉', '大蒜', '生姜', '酱油', '淀粉', '盐'],
      steps: '1.豆腐切块焯水备用\n2.炒猪肉末至变色\n3.加豆瓣酱、蒜末姜末炒香\n4.下豆腐轻推，勾芡收汁',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '清炒时蔬', cuisine: '中餐', emoji: '🥬', cook_time: 10, calories: 180,
      ingredients: ['白菜', '大蒜', '盐', '花生油'],
      steps: '1.白菜撕成大片洗净\n2.热油爆香蒜末\n3.下白菜大火快炒，加盐出锅',
      flags: [1, 1, 0, 1, 0, 0, 0]
    },
    {
      name: '红烧茄子', cuisine: '中餐', emoji: '🍆', cook_time: 25, calories: 350,
      ingredients: ['茄子', '大蒜', '酱油', '糖', '淀粉', '盐'],
      steps: '1.茄子切滚刀块\n2.油锅炸至金黄捞出\n3.爆香蒜末，加酱油糖调汁\n4.下茄子翻炒勾芡',
      flags: [1, 0, 0, 1, 0, 0, 0]
    },
    {
      name: '鱼香肉丝', cuisine: '中餐', emoji: '🥢', cook_time: 20, calories: 520,
      ingredients: ['猪肉', '青椒', '胡萝卜', '酱油', '醋', '糖', '淀粉'],
      steps: '1.猪肉切丝腌制\n2.调鱼香汁：酱油醋糖淀粉\n3.炒散肉丝盛出\n4.炒蔬菜丝，加肉丝和鱼香汁翻炒',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '蒜蓉西兰花', cuisine: '中餐', emoji: '🥦', cook_time: 12, calories: 200,
      ingredients: ['西兰花', '大蒜', '盐', '橄榄油'],
      steps: '1.西兰花掰小朵焯水\n2.爆香蒜末\n3.下西兰花快炒加盐调味',
      flags: [1, 1, 0, 1, 0, 0, 0]
    },
    {
      name: '意大利肉酱面', cuisine: '西餐', emoji: '🍝', cook_time: 40, calories: 620,
      ingredients: ['意大利面', '牛肉', '番茄', '洋葱', '大蒜', '番茄酱', '橄榄油'],
      steps: '1.煮意面至al dente\n2.炒香洋葱大蒜\n3.加牛肉末炒散\n4.加番茄酱汁小火熬煮20分钟\n5.混合意面拌匀',
      flags: [0, 0, 1, 0, 0, 0, 0]
    },
    {
      name: '凯撒沙拉', cuisine: '西餐', emoji: '🥗', cook_time: 15, calories: 350,
      ingredients: ['生菜', '面包', '奶酪', '鸡蛋', '橄榄油', '盐'],
      steps: '1.生菜撕成片状\n2.面包切丁烤至金黄\n3.制作凯撒酱\n4.拌匀所有食材，撒帕玛森奶酪',
      flags: [1, 0, 0, 0, 0, 0, 1]
    },
    {
      name: '奶油蘑菇汤', cuisine: '西餐', emoji: '🍲', cook_time: 30, calories: 420,
      ingredients: ['蘑菇', '洋葱', '黄油', '牛奶', '面粉', '盐'],
      steps: '1.炒香洋葱和蘑菇\n2.加黄油和面粉炒成面糊\n3.缓缓加入牛奶搅打\n4.调味煮开至浓稠',
      flags: [1, 0, 0, 1, 0, 0, 1]
    },
    {
      name: '香煎牛排', cuisine: '西餐', emoji: '🥩', cook_time: 25, calories: 680,
      ingredients: ['牛肉', '盐', '黑胡椒', '黄油', '大蒜', '橄榄油'],
      steps: '1.牛排擦干水分，撒盐和黑胡椒\n2.热锅大火煎至焦黄\n3.加黄油和大蒜淋汁\n4.静置5分钟切片',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '芝士汉堡', cuisine: '西餐', emoji: '🍔', cook_time: 30, calories: 720,
      ingredients: ['牛肉', '面包', '奶酪', '生菜', '番茄', '洋葱', '盐'],
      steps: '1.牛肉末调味做饼煎熟\n2.面包对半烤至微焦\n3.依次叠放生菜、番茄、肉饼、奶酪',
      flags: [0, 0, 1, 0, 0, 0, 1]
    },
    {
      name: '虾仁意面', cuisine: '西餐', emoji: '🦐', cook_time: 25, calories: 560,
      ingredients: ['意大利面', '虾仁', '大蒜', '橄榄油', '盐', '辣椒', '柠檬'],
      steps: '1.煮意面备用\n2.爆香大蒜和辣椒\n3.加虾仁煎至粉红\n4.拌入意面，挤柠檬汁',
      flags: [0, 1, 1, 0, 0, 1, 0]
    },
    {
      name: '法式煎蛋卷', cuisine: '西餐', emoji: '🍳', cook_time: 10, calories: 340,
      ingredients: ['鸡蛋', '奶酪', '黄油', '牛奶', '盐'],
      steps: '1.鸡蛋加牛奶打散\n2.黄油融化倒入蛋液\n3.半凝固时加奶酪丝\n4.对折出锅',
      flags: [1, 0, 1, 1, 0, 0, 1]
    },
    {
      name: '寿司饭', cuisine: '日料', emoji: '🍣', cook_time: 35, calories: 520,
      ingredients: ['大米', '三文鱼', '黄瓜', '胡萝卜', '醋', '盐', '糖'],
      steps: '1.米饭煮好拌醋糖盐成寿司饭\n2.三文鱼切成薄片\n3.手握饭团，铺上鱼片',
      flags: [0, 1, 1, 1, 0, 1, 0]
    },
    {
      name: '味噌汤', cuisine: '日料', emoji: '🍜', cook_time: 20, calories: 220,
      ingredients: ['豆腐', '蘑菇', '海带', '葱', '盐'],
      steps: '1.海带泡发煮汤底\n2.加豆腐块和蘑菇\n3.味噌酱用汤化开加入\n4.撒葱花出锅',
      flags: [1, 1, 0, 1, 0, 0, 0]
    },
    {
      name: '天妇罗', cuisine: '日料', emoji: '🍤', cook_time: 25, calories: 560,
      ingredients: ['虾仁', '青椒', '茄子', '胡萝卜', '面粉', '鸡蛋', '花生油'],
      steps: '1.冰水调面衣\n2.食材裹薄面衣\n3.油温180度炸至金黄\n4.配天妇罗蘸汁',
      flags: [0, 0, 1, 0, 0, 1, 0]
    },
    {
      name: '照烧鸡腿', cuisine: '日料', emoji: '🍗', cook_time: 30, calories: 580,
      ingredients: ['鸡胸肉', '酱油', '糖', '料酒', '大蒜', '生姜'],
      steps: '1.鸡腿肉划刀腌制\n2.煎至两面金黄\n3.加照烧汁（酱油糖料酒）收汁\n4.切片装盘',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '日式咖喱饭', cuisine: '日料', emoji: '🍛', cook_time: 45, calories: 650,
      ingredients: ['大米', '土豆', '胡萝卜', '洋葱', '牛肉', '咖喱块'],
      steps: '1.炒香洋葱至透明\n2.加肉和蔬菜翻炒\n3.加水煮至食材软烂\n4.加咖喱块融化搅拌至浓稠',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '韩式石锅拌饭', cuisine: '韩餐', emoji: '🍚', cook_time: 35, calories: 600,
      ingredients: ['大米', '菠菜', '胡萝卜', '蘑菇', '牛肉', '鸡蛋', '酱油'],
      steps: '1.各蔬菜分别炒熟调味\n2.牛肉炒香加酱油\n3.石锅盛饭，摆蔬菜和牛肉\n4.中间放煎蛋，加辣酱拌匀',
      flags: [0, 0, 1, 1, 0, 0, 0]
    },
    {
      name: '泰式冬阴功汤', cuisine: '泰餐', emoji: '🍲', cook_time: 30, calories: 380,
      ingredients: ['虾仁', '蘑菇', '柠檬', '辣椒', '大蒜', '盐'],
      steps: '1.煮香茅和南姜出味\n2.加蘑菇和辣椒\n3.放入虾仁煮熟\n4.加柠檬汁和鱼露调味',
      flags: [0, 0, 1, 1, 0, 1, 0]
    },
    {
      name: '泰式绿咖喱鸡', cuisine: '泰餐', emoji: '🥘', cook_time: 35, calories: 550,
      ingredients: ['鸡胸肉', '青椒', '茄子', '蘑菇', '牛奶', '盐', '辣椒'],
      steps: '1.炒香绿咖喱酱\n2.加鸡肉炒变色\n3.加椰奶和蔬菜炖煮\n4.调味至浓稠',
      flags: [0, 0, 1, 1, 0, 0, 1]
    },
    {
      name: '清蒸鲈鱼', cuisine: '中餐', emoji: '🐟', cook_time: 20, calories: 320,
      ingredients: ['鲈鱼', '生姜', '葱', '酱油', '花生油', '盐'],
      steps: '1.鲈鱼处理干净划刀\n2.铺姜片葱段蒸8分钟\n3.倒掉蒸汁，淋酱油\n4.热油浇在鱼上',
      flags: [0, 1, 1, 1, 0, 1, 0]
    },
    {
      name: '腐竹炒肉', cuisine: '中餐', emoji: '�', cook_time: 20, calories: 480,
      ingredients: ['腐竹', '猪肉', '青椒', '酱油', '大蒜', '盐'],
      steps: '1.腐竹泡发切段\n2.炒肉片至变色\n3.加蒜末青椒翻炒\n4.下腐竹加酱油调味',
      flags: [0, 0, 1, 1, 0, 0, 0]
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

interface RecipeRow {
  id: string;
  name: string;
  cuisine: string;
  emoji: string;
  cook_time: number;
  calories: number;
  steps: string;
  ingredients_list: string;
  is_vegetarian: number;
  is_low_fat: number;
  is_high_protein: number;
  is_gluten_free: number;
  has_peanut: number;
  has_seafood: number;
  has_dairy: number;
}

interface Recipe extends Omit<RecipeRow, 'ingredients_list'> {
  ingredients: string[];
  matchScore: number;
}

function getAllRecipes(): Recipe[] {
  const rows = db.prepare(`
    SELECT r.*, GROUP_CONCAT(ri.ingredient_name, ',') as ingredients_list
    FROM recipes r
    LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    GROUP BY r.id
  `).all() as RecipeRow[];
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
    const neededIngredients = r.ingredients;
    if (neededIngredients.length === 0) return { ...r, matchScore: 0 };
    let matchedCount = 0;
    for (const ing of neededIngredients) {
      if (userIngredients.has(ing)) matchedCount++;
    }
    const coverage = matchedCount / neededIngredients.length;
    return { ...r, matchScore: Math.round(coverage * 100) };
  });

  const result = scored
    .filter(r => r.matchScore >= 60)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  res.json(result);
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

  const allRecipes = getAllRecipes();
  const inRange = allRecipes.filter(r => r.calories >= minCalories && r.calories <= maxCalories);
  const selected = selectedRecipes.length > 0
    ? inRange.filter(r => selectedRecipes.includes(r.id))
    : [];
  const pool = selected.length >= 7 ? selected : (inRange.length >= 7 ? inRange : allRecipes);

  const plan: Array<{ day: string; dayIndex: number; meals: Array<{ meal: string; recipe: Recipe }> }> = [];

  for (let d = 0; d < 7; d++) {
    const dayCuisines = new Set<string>();
    const dayMeals: Array<{ meal: string; recipe: Recipe }> = [];
    let dayCalories = 0;
    const targetPerMeal = (minCalories + maxCalories) / 2;

    for (let m = 0; m < 3; m++) {
      const remainingMeals = 2 - m;
      const remainingCalorieBudget = (targetPerMeal * 3) - dayCalories - (remainingMeals * minCalories);
      const upperBound = Math.min(maxCalories, remainingMeals === 0 ? maxCalories : Math.max(minCalories, remainingCalorieBudget / (remainingMeals || 1) + 200));

      let candidates = shuffle(pool.filter(r => {
        if (r.calories < minCalories || r.calories > upperBound) return false;
        if (dayCuisines.has(r.cuisine)) return false;
        const projectedTotal = dayCalories + r.calories + remainingMeals * minCalories;
        if (projectedTotal > targetPerMeal * 3 + 300) return false;
        return true;
      }));

      let chosen = candidates[0];
      if (!chosen) {
        candidates = shuffle(pool.filter(r => {
          if (r.calories < minCalories || r.calories > maxCalories) return false;
          if (dayCuisines.has(r.cuisine)) return false;
          return true;
        }));
        chosen = candidates[0];
      }
      if (!chosen) {
        const fallback = shuffle(pool.filter(r => r.calories >= minCalories && r.calories <= maxCalories));
        chosen = fallback[0];
      }
      if (!chosen) {
        chosen = shuffle(pool)[0];
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

  const otherMeals = day.meals.filter((_, i) => i !== mealIndex);
  const usedCuisines = new Set(otherMeals.map(m => m.recipe.cuisine));
  const currentId = day.meals[mealIndex]?.recipe.id;
  const otherCalories = otherMeals.reduce((s, m) => s + m.recipe.calories, 0);
  const dayTarget = (minCalories + maxCalories) / 2 * 3;
  const idealCalories = dayTarget - otherCalories;

  const allRecipes = getAllRecipes();

  let candidates = allRecipes.filter(r =>
    r.calories >= minCalories &&
    r.calories <= maxCalories &&
    r.id !== currentId &&
    !usedCuisines.has(r.cuisine)
  );

  if (candidates.length === 0) {
    candidates = allRecipes.filter(r =>
      r.calories >= minCalories &&
      r.calories <= maxCalories &&
      r.id !== currentId
    );
  }

  if (candidates.length === 0) {
    candidates = allRecipes.filter(r => r.id !== currentId);
  }

  const sorted = candidates.sort((a, b) => Math.abs(a.calories - idealCalories) - Math.abs(b.calories - idealCalories));
  const topN = sorted.slice(0, Math.max(3, Math.floor(sorted.length * 0.3)));
  const chosen = shuffle(topN)[0] || shuffle(candidates)[0];

  res.json({ recipe: chosen });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
