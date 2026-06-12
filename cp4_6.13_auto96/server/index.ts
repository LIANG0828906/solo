import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbDir = path.resolve(process.cwd(), 'server', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'food.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS foods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    purchaseDate TEXT NOT NULL,
    expiryDate TEXT NOT NULL,
    notes TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    goalType TEXT NOT NULL DEFAULT 'balanced',
    dailyCalories INTEGER NOT NULL DEFAULT 2500,
    proteinRatio INTEGER NOT NULL DEFAULT 20,
    fatRatio INTEGER NOT NULL DEFAULT 30,
    carbRatio INTEGER NOT NULL DEFAULT 50
  );

  INSERT OR IGNORE INTO user_settings (id, goalType, dailyCalories, proteinRatio, fatRatio, carbRatio)
  VALUES (1, 'balanced', 2500, 20, 30, 50);
`);

interface Food {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  purchaseDate: string;
  expiryDate: string;
  notes: string;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  cookTime: number;
  ingredients: { name: string; amount: number; unit: string; inStock: boolean }[];
  steps: string[];
  calories: number;
  protein: number;
  fat: number;
  carb: number;
}

interface UserSettings {
  goalType: 'muscle' | 'fatLoss' | 'balanced';
  dailyCalories: number;
  proteinRatio: number;
  fatRatio: number;
  carbRatio: number;
}

const recipePool: Omit<Meal, 'ingredients'>[] & { baseIngredients: { name: string; amount: number; unit: string }[] }[] = [
  {
    id: 'r1',
    name: '鸡胸肉蔬菜沙拉',
    time: 'breakfast',
    cookTime: 15,
    baseIngredients: [
      { name: '鸡胸肉', amount: 150, unit: 'g' },
      { name: '生菜', amount: 100, unit: 'g' },
      { name: '番茄', amount: 1, unit: '个' },
      { name: '橄榄油', amount: 10, unit: 'ml' },
    ],
    steps: ['鸡胸肉切片腌制10分钟', '平底锅煎至两面金黄', '蔬菜洗净切好', '混合所有食材，淋上橄榄油和调味汁'],
    calories: 350,
    protein: 35,
    fat: 12,
    carb: 15,
  },
  {
    id: 'r2',
    name: '燕麦牛奶粥',
    time: 'breakfast',
    cookTime: 10,
    baseIngredients: [
      { name: '燕麦', amount: 50, unit: 'g' },
      { name: '牛奶', amount: 200, unit: 'ml' },
      { name: '鸡蛋', amount: 1, unit: '个' },
    ],
    steps: ['燕麦用温水泡5分钟', '加入牛奶小火加热', '煮至浓稠状', '搭配水煮蛋食用'],
    calories: 320,
    protein: 18,
    fat: 10,
    carb: 40,
  },
  {
    id: 'r3',
    name: '全麦三明治',
    time: 'breakfast',
    cookTime: 8,
    baseIngredients: [
      { name: '全麦面包', amount: 2, unit: '片' },
      { name: '鸡蛋', amount: 1, unit: '个' },
      { name: '生菜', amount: 50, unit: 'g' },
      { name: '番茄', amount: 0.5, unit: '个' },
    ],
    steps: ['面包片烤至微焦', '煎一个鸡蛋', '依次叠加生菜、番茄、鸡蛋', '盖上另一片面包即可'],
    calories: 300,
    protein: 15,
    fat: 8,
    carb: 38,
  },
  {
    id: 'r4',
    name: '番茄牛腩面',
    time: 'lunch',
    cookTime: 45,
    baseIngredients: [
      { name: '牛腩', amount: 200, unit: 'g' },
      { name: '番茄', amount: 2, unit: '个' },
      { name: '面条', amount: 150, unit: 'g' },
      { name: '洋葱', amount: 50, unit: 'g' },
    ],
    steps: ['牛腩切块焯水', '番茄和洋葱切丁炒香', '加入牛腩炖煮30分钟', '另起锅煮面，浇上番茄牛腩汁'],
    calories: 650,
    protein: 40,
    fat: 20,
    carb: 70,
  },
  {
    id: 'r5',
    name: '藜麦鸡胸饭',
    time: 'lunch',
    cookTime: 30,
    baseIngredients: [
      { name: '藜麦', amount: 100, unit: 'g' },
      { name: '鸡胸肉', amount: 180, unit: 'g' },
      { name: '西兰花', amount: 150, unit: 'g' },
      { name: '胡萝卜', amount: 50, unit: 'g' },
    ],
    steps: ['藜麦洗净煮15分钟', '鸡胸肉切块煎熟', '西兰花和胡萝卜焯水', '所有食材混合，淋上低脂酱汁'],
    calories: 580,
    protein: 45,
    fat: 12,
    carb: 65,
  },
  {
    id: 'r6',
    name: '三文鱼糙米饭',
    time: 'lunch',
    cookTime: 25,
    baseIngredients: [
      { name: '三文鱼', amount: 150, unit: 'g' },
      { name: '糙米', amount: 100, unit: 'g' },
      { name: '芦笋', amount: 100, unit: 'g' },
    ],
    steps: ['糙米提前浸泡后煮熟', '三文鱼两面煎熟', '芦笋焯水', '摆盘淋上柠檬汁'],
    calories: 600,
    protein: 38,
    fat: 22,
    carb: 55,
  },
  {
    id: 'r7',
    name: '清蒸鱼配时蔬',
    time: 'dinner',
    cookTime: 20,
    baseIngredients: [
      { name: '鲈鱼', amount: 250, unit: 'g' },
      { name: '青菜', amount: 200, unit: 'g' },
      { name: '生姜', amount: 10, unit: 'g' },
    ],
    steps: ['鱼处理干净，铺上姜丝', '大火蒸8分钟', '青菜焯水摆盘', '淋上蒸鱼豉油和热油'],
    calories: 380,
    protein: 40,
    fat: 12,
    carb: 10,
  },
  {
    id: 'r8',
    name: '虾仁时蔬炒',
    time: 'dinner',
    cookTime: 15,
    baseIngredients: [
      { name: '虾仁', amount: 150, unit: 'g' },
      { name: '西兰花', amount: 150, unit: 'g' },
      { name: '木耳', amount: 30, unit: 'g' },
      { name: '大蒜', amount: 5, unit: 'g' },
    ],
    steps: ['虾仁去虾线腌制', '西兰花和木耳焯水', '热锅下蒜爆香', '加入所有食材快速翻炒'],
    calories: 320,
    protein: 30,
    fat: 10,
    carb: 18,
  },
  {
    id: 'r9',
    name: '牛肉蔬菜汤',
    time: 'dinner',
    cookTime: 40,
    baseIngredients: [
      { name: '牛肉', amount: 150, unit: 'g' },
      { name: '土豆', amount: 1, unit: '个' },
      { name: '胡萝卜', amount: 1, unit: '根' },
      { name: '洋葱', amount: 50, unit: 'g' },
    ],
    steps: ['牛肉切块焯水', '所有蔬菜切块', '食材全部放入锅中', '小火炖煮30分钟，加盐调味'],
    calories: 400,
    protein: 28,
    fat: 15,
    carb: 35,
  },
];

app.get('/api/foods', (req, res) => {
  try {
    const foods = db.prepare('SELECT * FROM foods ORDER BY expiryDate ASC').all() as Food[];
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: '获取食材列表失败' });
  }
});

app.post('/api/foods', (req, res) => {
  try {
    const { id, name, quantity, unit, purchaseDate, expiryDate, notes } = req.body as Food;
    const stmt = db.prepare(
      'INSERT INTO foods (id, name, quantity, unit, purchaseDate, expiryDate, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, name, quantity, unit, purchaseDate, expiryDate, notes || '');
    res.json({ id, name, quantity, unit, purchaseDate, expiryDate, notes });
  } catch (err) {
    res.status(500).json({ error: '添加食材失败' });
  }
});

app.put('/api/foods/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, quantity, unit, purchaseDate, expiryDate, notes } = req.body as Partial<Food>;
    const stmt = db.prepare(
      'UPDATE foods SET name = ?, quantity = ?, unit = ?, purchaseDate = ?, expiryDate = ?, notes = ? WHERE id = ?'
    );
    stmt.run(name!, quantity!, unit!, purchaseDate!, expiryDate!, notes || '', id);
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新食材失败' });
  }
});

app.delete('/api/foods/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM foods WHERE id = ?').run(id);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: '删除食材失败' });
  }
});

app.post('/api/foods/batch-delete', (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM foods WHERE id IN (${placeholders})`).run(...ids);
    res.json({ message: '批量删除成功' });
  } catch (err) {
    res.status(500).json({ error: '批量删除失败' });
  }
});

app.post('/api/foods/batch-expire', (req, res) => {
  try {
    const { ids } = req.body as { ids: string[] };
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const expiredDate = yesterday.toISOString().split('T')[0];
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`UPDATE foods SET expiryDate = ? WHERE id IN (${placeholders})`).run(expiredDate, ...ids);
    res.json({ message: '批量设置过期成功' });
  } catch (err) {
    res.status(500).json({ error: '批量设置过期失败' });
  }
});

app.get('/api/foods/expiring-soon', (req, res) => {
  try {
    const today = new Date();
    const in7Days = new Date();
    in7Days.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split('T')[0];
    const in7DaysStr = in7Days.toISOString().split('T')[0];
    const foods = db.prepare(
      'SELECT * FROM foods WHERE expiryDate <= ? AND expiryDate >= ? ORDER BY expiryDate ASC'
    ).all(in7DaysStr, todayStr) as Food[];
    res.json(foods);
  } catch (err) {
    res.status(500).json({ error: '获取即将过期食材失败' });
  }
});

app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM user_settings WHERE id = 1').get() as UserSettings;
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: '获取设置失败' });
  }
});

app.put('/api/settings', (req, res) => {
  try {
    const { goalType, dailyCalories, proteinRatio, fatRatio, carbRatio } = req.body as UserSettings;
    const stmt = db.prepare(
      'UPDATE user_settings SET goalType = ?, dailyCalories = ?, proteinRatio = ?, fatRatio = ?, carbRatio = ? WHERE id = 1'
    );
    stmt.run(goalType, dailyCalories, proteinRatio, fatRatio, carbRatio);
    res.json({ message: '设置更新成功' });
  } catch (err) {
    res.status(500).json({ error: '更新设置失败' });
  }
});

app.get('/api/meal-plan', (req, res) => {
  try {
    const goal = (req.query.goal as string) || 'balanced';
    const foods = db.prepare('SELECT * FROM foods').all() as Food[];
    const foodNames = foods.map((f) => f.name.toLowerCase());

    const matchIngredients = (baseIngredients: { name: string; amount: number; unit: string }[]) => {
      return baseIngredients.map((ing) => {
        const inStock = foodNames.some((n) => n.includes(ing.name.toLowerCase()) || ing.name.toLowerCase().includes(n));
        return { ...ing, inStock };
      });
    };

    const breakfasts = recipePool
      .filter((r) => r.time === 'breakfast')
      .map((r) => ({ ...r, ingredients: matchIngredients(r.baseIngredients) }))
      .sort((a, b) => {
        const aStock = a.ingredients.filter((i) => i.inStock).length;
        const bStock = b.ingredients.filter((i) => i.inStock).length;
        return bStock - aStock;
      })
      .slice(0, 2);

    const lunches = recipePool
      .filter((r) => r.time === 'lunch')
      .map((r) => ({ ...r, ingredients: matchIngredients(r.baseIngredients) }))
      .sort((a, b) => {
        const aStock = a.ingredients.filter((i) => i.inStock).length;
        const bStock = b.ingredients.filter((i) => i.inStock).length;
        return bStock - aStock;
      })
      .slice(0, 2);

    const dinners = recipePool
      .filter((r) => r.time === 'dinner')
      .map((r) => ({ ...r, ingredients: matchIngredients(r.baseIngredients) }))
      .sort((a, b) => {
        const aStock = a.ingredients.filter((i) => i.inStock).length;
        const bStock = b.ingredients.filter((i) => i.inStock).length;
        return bStock - aStock;
      })
      .slice(0, 2);

    res.json({
      breakfast: breakfasts,
      lunch: lunches,
      dinner: dinners,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '生成食谱推荐失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
