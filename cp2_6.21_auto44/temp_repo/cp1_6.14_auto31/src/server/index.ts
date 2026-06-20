import express, { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDB,
  findUserByUsername,
  createUser,
  findUserById,
  updateUser,
  getRecipes,
  findRecipeById,
  createRecipe,
  updateRecipe,
  getCommentsByRecipe,
  createComment,
  findMealPlanByUser,
  createMealPlan,
  updateMealPlan,
  User,
  Recipe,
  Comment,
  MealPlan,
  DayPlan,
  MealEntry,
} from './dataStore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));

app.use(session({
  secret: 'family-recipe-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
}));

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

const nutritionCache = new Map<string, { calories: number; protein: number; carbs: number; fat: number }>();
let recipeCache: Recipe[] = [];
let recipeCacheTime = 0;
const CACHE_TTL = 60 * 1000;

function getRecipeNutrition(recipe: Recipe) {
  const key = recipe.id;
  if (nutritionCache.has(key)) {
    return nutritionCache.get(key)!;
  }
  const nutrition = recipe.ingredients.reduce(
    (acc, ing) => ({
      calories: acc.calories + (ing.calories || 0),
      protein: acc.protein + (ing.protein || 0),
      carbs: acc.carbs + (ing.carbs || 0),
      fat: acc.fat + (ing.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
  nutritionCache.set(key, nutrition);
  return nutrition;
}

async function getAllRecipesCached(): Promise<Recipe[]> {
  const now = Date.now();
  if (recipeCache.length > 0 && now - recipeCacheTime < CACHE_TTL) {
    return recipeCache;
  }
  const { recipes } = await getRecipes('latest', 1, 1000);
  recipeCache = recipes;
  recipeCacheTime = now;
  return recipes;
}

function invalidateRecipeCache() {
  recipeCache = [];
  recipeCacheTime = 0;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ message: '请先登录' });
    return;
  }
  next();
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username?.trim() || !password?.trim()) {
      res.status(400).json({ message: '用户名和密码不能为空' });
      return;
    }
    const existing = await findUserByUsername(username);
    if (existing) {
      res.status(400).json({ message: '用户名已存在' });
      return;
    }
    const user: User = {
      id: uuidv4(),
      username: username.trim(),
      password: password.trim(),
      avatar: '',
      healthGoal: '',
      allergies: [],
      calorieLimit: 2000,
      favorites: [],
      createdAt: new Date().toISOString(),
    };
    await createUser(user);
    req.session.userId = user.id;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await findUserByUsername(username);
    if (!user || user.password !== password) {
      res.status(401).json({ message: '用户名或密码错误' });
      return;
    }
    req.session.userId = user.id;
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.status(500).json({ message: '退出失败' });
      return;
    }
    res.json({ success: true });
  });
});

app.get('/api/auth/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      res.status(401).json({ message: '未登录' });
      return;
    }
    const user = await findUserById(req.session.userId);
    if (!user) {
      res.status(401).json({ message: '用户不存在' });
      return;
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.put('/api/user/profile', requireAuth, async (req, res) => {
  try {
    const { healthGoal, allergies, calorieLimit } = req.body;
    const user = await updateUser(req.session.userId!, {
      healthGoal,
      allergies: Array.isArray(allergies) ? allergies : [],
      calorieLimit: Number(calorieLimit) || 2000,
    });
    if (!user) {
      res.status(404).json({ message: '用户不存在' });
      return;
    }
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.get('/api/recipes', async (req, res) => {
  try {
    const tab = (req.query.tab as 'latest' | 'popular') || 'latest';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const result = await getRecipes(tab, page, limit);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await findRecipeById(req.params.id);
    if (!recipe) {
      res.status(404).json({ message: '菜谱不存在' });
      return;
    }
    res.json({ recipe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.post('/api/recipes', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const user = await findUserById(req.session.userId!);
    if (!user) {
      res.status(401).json({ message: '用户不存在' });
      return;
    }

    let imagePath = '';
    if (req.file) {
      const filename = `${uuidv4()}.jpg`;
      const filepath = path.join(uploadDir, filename);
      await sharp(req.file.buffer)
        .resize(800, 800, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(filepath);
      imagePath = `/uploads/${filename}`;
    }

    const ingredients = JSON.parse(req.body.ingredients || '[]');
    const steps = JSON.parse(req.body.steps || '[]');
    const tags = JSON.parse(req.body.tags || '[]');

    const recipe: Recipe = {
      id: uuidv4(),
      authorId: user.id,
      authorName: user.username,
      authorAvatar: user.avatar,
      name: req.body.name,
      category: req.body.category || '其他',
      cookTime: Number(req.body.cookTime) || 30,
      ingredients,
      steps,
      image: imagePath,
      tags,
      likes: [],
      createdAt: new Date().toISOString(),
    };

    await createRecipe(recipe);
    invalidateRecipeCache();
    nutritionCache.delete(recipe.id);

    res.json({ recipe });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.post('/api/recipes/:id/like', requireAuth, async (req, res) => {
  try {
    const recipe = await findRecipeById(req.params.id);
    if (!recipe) {
      res.status(404).json({ message: '菜谱不存在' });
      return;
    }
    const userId = req.session.userId!;
    const liked = recipe.likes.includes(userId);
    const newLikes = liked
      ? recipe.likes.filter(id => id !== userId)
      : [...recipe.likes, userId];
    await updateRecipe(recipe.id, { likes: newLikes });
    invalidateRecipeCache();
    res.json({ liked: !liked });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.get('/api/recipes/:id/comments', async (req, res) => {
  try {
    const comments = await getCommentsByRecipe(req.params.id);
    res.json({ comments });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.post('/api/recipes/:id/comments', requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId!);
    const recipe = await findRecipeById(req.params.id);
    if (!recipe) {
      res.status(404).json({ message: '菜谱不存在' });
      return;
    }
    if (!user) {
      res.status(401).json({ message: '用户不存在' });
      return;
    }
    const content = req.body.content?.trim();
    if (!content || content.length > 500) {
      res.status(400).json({ message: '评论内容无效' });
      return;
    }
    const comment: Comment = {
      id: uuidv4(),
      recipeId: recipe.id,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      content,
      createdAt: new Date().toISOString(),
    };
    await createComment(comment);
    res.json({ comment });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.get('/api/plan', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const plan = await findMealPlanByUser(userId);
    res.json({ plan: plan || null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.post('/api/plan/generate', requireAuth, async (req, res) => {
  try {
    const startTime = Date.now();
    const userId = req.session.userId!;
    const user = await findUserById(userId);
    if (!user) {
      res.status(401).json({ message: '用户不存在' });
      return;
    }

    const allRecipes = await getAllRecipesCached();
    const ingredientMap = new Map<string, Recipe[]>();
    for (const r of allRecipes) {
      for (const ing of r.ingredients) {
        const key = ing.name.toLowerCase();
        if (!ingredientMap.has(key)) ingredientMap.set(key, []);
        ingredientMap.get(key)!.push(r);
      }
    }

    const calorieLimit = user.calorieLimit || 2000;
    const dailyTargets = {
      breakfast: Math.round(calorieLimit * 0.25),
      lunch: Math.round(calorieLimit * 0.35),
      dinner: Math.round(calorieLimit * 0.3),
      snack1: Math.round(calorieLimit * 0.05),
      snack2: Math.round(calorieLimit * 0.05),
    };

    const allergiesLower = user.allergies.map(a => a.toLowerCase());

    function isSafe(recipe: Recipe): boolean {
      return !recipe.ingredients.some(ing =>
        allergiesLower.some(allergy => ing.name.toLowerCase().includes(allergy))
      );
    }

    function pickRecipe(category: string, targetCal: number, usedIds: Set<string>): Recipe | null {
      const candidates = allRecipes.filter(r => {
        if (usedIds.has(r.id)) return false;
        if (!isSafe(r)) return false;
        if (category === '加餐') {
          return r.category === '加餐' || r.tags.includes('低脂');
        }
        return r.category === category;
      });
      if (candidates.length === 0) {
        const fallback = allRecipes.filter(r => !usedIds.has(r.id) && isSafe(r));
        if (fallback.length === 0) return null;
        return fallback[Math.floor(Math.random() * fallback.length)];
      }
      candidates.sort((a, b) => {
        const nutA = getRecipeNutrition(a);
        const nutB = getRecipeNutrition(b);
        return Math.abs(nutA.calories - targetCal) - Math.abs(nutB.calories - targetCal);
      });
      const top = candidates.slice(0, Math.min(5, candidates.length));
      return top[Math.floor(Math.random() * top.length)];
    }

    function getWeekStart(): string {
      const now = new Date();
      const day = now.getDay() || 7;
      const diff = now.getDate() - day + 1;
      const monday = new Date(now);
      monday.setDate(diff);
      monday.setHours(0, 0, 0, 0);
      return monday.toISOString().split('T')[0];
    }

    const weekStart = getWeekStart();
    const days: DayPlan[] = [];
    const mealTypes: Array<{ type: MealEntry['type']; category: string }> = [
      { type: 'breakfast', category: '早餐' },
      { type: 'lunch', category: '午餐' },
      { type: 'dinner', category: '晚餐' },
      { type: 'snack1', category: '加餐' },
      { type: 'snack2', category: '加餐' },
    ];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const meals: MealEntry[] = [];
      const usedIds = new Set<string>();

      for (const { type, category } of mealTypes) {
        const recipe = pickRecipe(category, dailyTargets[type], usedIds);
        if (recipe) {
          const nut = getRecipeNutrition(recipe);
          meals.push({
            type,
            recipeId: recipe.id,
            recipeName: recipe.name,
            recipeImage: recipe.image,
            calories: nut.calories,
          });
          usedIds.add(recipe.id);
        }
      }

      days.push({ date: dateStr, meals });
    }

    const existing = await findMealPlanByUser(userId);
    let plan: MealPlan;
    if (existing) {
      plan = (await updateMealPlan(existing.id, { weekStart, days }))!;
    } else {
      plan = {
        id: uuidv4(),
        userId,
        weekStart,
        days,
      };
      await createMealPlan(plan);
    }

    const elapsed = Date.now() - startTime;
    console.log(`膳食计划生成耗时: ${elapsed}ms`);

    res.json({ plan });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.put('/api/plan/swap', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId!;
    const { fromDate, fromType, toDate, toType } = req.body;

    const plan = await findMealPlanByUser(userId);
    if (!plan) {
      res.status(404).json({ message: '膳食计划不存在' });
      return;
    }

    const fromDay = plan.days.find(d => d.date === fromDate);
    const toDay = plan.days.find(d => d.date === toDate);
    if (!fromDay || !toDay) {
      res.status(400).json({ message: '日期无效' });
      return;
    }

    const fromMeals = fromDay.meals.filter(m => m.type === fromType);
    const toMeals = toDay.meals.filter(m => m.type === toType);

    if (fromMeals.length === 0 && toMeals.length === 0) {
      res.json({ plan });
      return;
    }

    const fromDayOther = fromDay.meals.filter(m => m.type !== fromType);
    const toDayOther = toDay.meals.filter(m => m.type !== toType);

    const movedFromMeals = fromMeals.map(m => ({ ...m, type: toType as MealEntry['type'] }));
    const movedToMeals = toMeals.map(m => ({ ...m, type: fromType as MealEntry['type'] }));

    fromDay.meals = [...fromDayOther, ...movedToMeals];
    toDay.meals = [...toDayOther, ...movedFromMeals];

    const updated = await updateMealPlan(plan.id, { days: plan.days });
    res.json({ plan: updated });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: '服务器错误' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
});
