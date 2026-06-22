import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbFile = path.join(dbDir, 'db.json');

export interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  healthGoal: 'lose_fat' | 'build_muscle' | 'maintain' | '';
  allergies: string[];
  calorieLimit: number;
  favorites: string[];
  createdAt: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  name: string;
  category: string;
  cookTime: number;
  ingredients: Ingredient[];
  steps: string[];
  image: string;
  tags: string[];
  likes: string[];
  createdAt: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface MealEntry {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack1' | 'snack2';
  recipeId: string;
  recipeName: string;
  recipeImage: string;
  calories: number;
}

export interface DayPlan {
  date: string;
  meals: MealEntry[];
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;
  days: DayPlan[];
}

export interface DatabaseSchema {
  users: User[];
  recipes: Recipe[];
  comments: Comment[];
  mealPlans: MealPlan[];
}

const defaultData: DatabaseSchema = {
  users: [],
  recipes: [],
  comments: [],
  mealPlans: [],
};

const adapter = new JSONFile<DatabaseSchema>(dbFile);
export const db = new Low(adapter, defaultData);

export async function initDB() {
  await db.read();
  if (db.data.recipes.length === 0) {
    seedData();
    await db.write();
  }
}

function seedData() {
  const demoUser: User = {
    id: 'demo-user-1',
    username: '美食家小王',
    password: '123456',
    avatar: '',
    healthGoal: 'maintain',
    allergies: ['花生'],
    calorieLimit: 2000,
    favorites: [],
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(demoUser);

  const demoRecipes: Recipe[] = [
    {
      id: 'recipe-1',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '番茄炒蛋',
      category: '午餐',
      cookTime: 15,
      ingredients: [
        { name: '番茄', amount: '2个', calories: 40, protein: 2, carbs: 8, fat: 0.5 },
        { name: '鸡蛋', amount: '3个', calories: 210, protein: 18, carbs: 2, fat: 15 },
        { name: '葱花', amount: '适量', calories: 5, protein: 0.3, carbs: 1, fat: 0.1 },
        { name: '食用油', amount: '2勺', calories: 180, protein: 0, carbs: 0, fat: 20 },
      ],
      steps: [
        '番茄洗净切块，鸡蛋打散加少许盐搅匀。',
        '热锅放油，倒入蛋液炒至凝固盛出。',
        '锅中再放少许油，放入番茄翻炒出汁。',
        '加入炒好的鸡蛋，加盐和糖调味，翻炒均匀。',
        '撒上葱花即可出锅。',
      ],
      image: '',
      tags: ['低脂', '高蛋白'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'recipe-2',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '清炒时蔬',
      category: '晚餐',
      cookTime: 10,
      ingredients: [
        { name: '西兰花', amount: '1颗', calories: 50, protein: 4, carbs: 10, fat: 0.5 },
        { name: '胡萝卜', amount: '1根', calories: 25, protein: 0.5, carbs: 6, fat: 0.2 },
        { name: '蒜末', amount: '3瓣', calories: 10, protein: 0.3, carbs: 2, fat: 0 },
        { name: '橄榄油', amount: '1勺', calories: 120, protein: 0, carbs: 0, fat: 14 },
      ],
      steps: [
        '西兰花切小朵，胡萝卜切片，分别焯水备用。',
        '热锅放橄榄油，爆香蒜末。',
        '先放胡萝卜翻炒1分钟。',
        '加入西兰花，加盐和少许生抽调味。',
        '快速翻炒均匀即可出锅。',
      ],
      image: '',
      tags: ['低脂', '素食', '低碳水'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'recipe-3',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '燕麦牛奶粥',
      category: '早餐',
      cookTime: 8,
      ingredients: [
        { name: '燕麦片', amount: '50g', calories: 190, protein: 7, carbs: 32, fat: 3 },
        { name: '牛奶', amount: '200ml', calories: 120, protein: 6, carbs: 10, fat: 5 },
        { name: '蜂蜜', amount: '1勺', calories: 60, protein: 0, carbs: 16, fat: 0 },
        { name: '蓝莓', amount: '30g', calories: 15, protein: 0.3, carbs: 4, fat: 0.1 },
      ],
      steps: [
        '燕麦片放入碗中，加入牛奶。',
        '微波炉加热2分钟，或者小火煮5分钟。',
        '取出后淋上蜂蜜，撒上蓝莓。',
        '搅拌均匀即可享用。',
      ],
      image: '',
      tags: ['高蛋白', '素食'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'recipe-4',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '香煎鸡胸肉',
      category: '晚餐',
      cookTime: 20,
      ingredients: [
        { name: '鸡胸肉', amount: '200g', calories: 240, protein: 48, carbs: 0, fat: 4 },
        { name: '黑胡椒', amount: '适量', calories: 5, protein: 0.2, carbs: 1, fat: 0.2 },
        { name: '生抽', amount: '1勺', calories: 10, protein: 1, carbs: 2, fat: 0 },
        { name: '橄榄油', amount: '1勺', calories: 120, protein: 0, carbs: 0, fat: 14 },
        { name: '柠檬', amount: '半个', calories: 10, protein: 0.3, carbs: 3, fat: 0.1 },
      ],
      steps: [
        '鸡胸肉用刀背拍松，加入生抽、黑胡椒腌制15分钟。',
        '平底锅烧热，倒入橄榄油。',
        '放入鸡胸肉，中火煎至两面金黄，每面约4-5分钟。',
        '挤上柠檬汁，静置2分钟后切片。',
        '搭配蔬菜即可享用。',
      ],
      image: '',
      tags: ['高蛋白', '低脂', '低碳水'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'recipe-5',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '水果沙拉',
      category: '加餐',
      cookTime: 5,
      ingredients: [
        { name: '苹果', amount: '1个', calories: 80, protein: 0.3, carbs: 22, fat: 0.2 },
        { name: '香蕉', amount: '1根', calories: 100, protein: 1.3, carbs: 27, fat: 0.4 },
        { name: '草莓', amount: '5颗', calories: 20, protein: 0.5, carbs: 5, fat: 0.2 },
        { name: '酸奶', amount: '100g', calories: 70, protein: 4, carbs: 8, fat: 1.5 },
        { name: '坚果', amount: '15g', calories: 90, protein: 3, carbs: 3, fat: 8 },
      ],
      steps: [
        '苹果、香蕉切块，草莓对半切。',
        '所有水果放入碗中。',
        '淋上酸奶，撒上碎坚果。',
        '轻轻拌匀即可食用。',
      ],
      image: '',
      tags: ['素食', '低脂'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      id: 'recipe-6',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '红烧肉',
      category: '午餐',
      cookTime: 90,
      ingredients: [
        { name: '五花肉', amount: '500g', calories: 1800, protein: 40, carbs: 0, fat: 180 },
        { name: '冰糖', amount: '30g', calories: 120, protein: 0, carbs: 30, fat: 0 },
        { name: '生抽', amount: '2勺', calories: 20, protein: 2, carbs: 4, fat: 0 },
        { name: '老抽', amount: '1勺', calories: 15, protein: 1, carbs: 3, fat: 0 },
        { name: '八角', amount: '2颗', calories: 5, protein: 0.2, carbs: 1, fat: 0.2 },
        { name: '姜片', amount: '5片', calories: 5, protein: 0.1, carbs: 1, fat: 0 },
      ],
      steps: [
        '五花肉切块，冷水下锅焯水，撇去浮沫捞出。',
        '锅中放少许油，加入冰糖小火炒出糖色。',
        '放入五花肉翻炒均匀上色。',
        '加入生抽、老抽、八角、姜片，倒入热水没过肉。',
        '大火烧开后转小火炖60分钟。',
        '开大火收汁，汤汁浓稠即可出锅。',
      ],
      image: '',
      tags: ['高蛋白'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    },
    {
      id: 'recipe-7',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '蒜蓉西兰花',
      category: '晚餐',
      cookTime: 8,
      ingredients: [
        { name: '西兰花', amount: '300g', calories: 90, protein: 7, carbs: 18, fat: 0.9 },
        { name: '大蒜', amount: '5瓣', calories: 20, protein: 1, carbs: 4, fat: 0.1 },
        { name: '蚝油', amount: '1勺', calories: 15, protein: 0.5, carbs: 3, fat: 0.2 },
        { name: '食用油', amount: '1勺', calories: 90, protein: 0, carbs: 0, fat: 10 },
      ],
      steps: [
        '西兰花切小朵，洗净沥干水分。',
        '大蒜切末备用。',
        '水烧开加少许盐和油，西兰花焯水1分钟捞出。',
        '热锅放油，爆香一半蒜末。',
        '放入西兰花快速翻炒。',
        '加蚝油和剩余蒜末，翻炒均匀出锅。',
      ],
      image: '',
      tags: ['低脂', '素食', '低碳水'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: 'recipe-8',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '蛋炒饭',
      category: '午餐',
      cookTime: 12,
      ingredients: [
        { name: '米饭', amount: '200g', calories: 260, protein: 5, carbs: 56, fat: 0.5 },
        { name: '鸡蛋', amount: '2个', calories: 140, protein: 12, carbs: 2, fat: 10 },
        { name: '胡萝卜', amount: '50g', calories: 20, protein: 0.5, carbs: 5, fat: 0.2 },
        { name: '青豆', amount: '30g', calories: 25, protein: 2, carbs: 5, fat: 0.2 },
        { name: '葱花', amount: '适量', calories: 5, protein: 0.2, carbs: 1, fat: 0 },
        { name: '食用油', amount: '2勺', calories: 180, protein: 0, carbs: 0, fat: 20 },
      ],
      steps: [
        '鸡蛋打散，米饭打散备用。',
        '胡萝卜切丁，青豆洗净。',
        '热锅放油，倒入蛋液炒散盛出。',
        '锅中再放油，放入胡萝卜丁和青豆翻炒。',
        '加入米饭大火翻炒均匀。',
        '加入炒好的鸡蛋，加盐调味。',
        '撒上葱花翻炒几下出锅。',
      ],
      image: '',
      tags: ['高蛋白'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    },
    {
      id: 'recipe-9',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '牛奶燕麦煎饼',
      category: '早餐',
      cookTime: 15,
      ingredients: [
        { name: '燕麦片', amount: '80g', calories: 300, protein: 11, carbs: 52, fat: 5 },
        { name: '牛奶', amount: '150ml', calories: 90, protein: 5, carbs: 8, fat: 4 },
        { name: '鸡蛋', amount: '1个', calories: 70, protein: 6, carbs: 1, fat: 5 },
        { name: '香蕉', amount: '1根', calories: 100, protein: 1.3, carbs: 27, fat: 0.4 },
        { name: '蜂蜜', amount: '1勺', calories: 60, protein: 0, carbs: 16, fat: 0 },
      ],
      steps: [
        '燕麦片用料理机打成粉。',
        '香蕉压成泥，加入鸡蛋、牛奶搅拌均匀。',
        '加入燕麦粉，搅拌成浓稠的面糊。',
        '平底锅小火加热，舀一勺面糊摊成圆饼。',
        '两面各煎2-3分钟至金黄。',
        '淋上蜂蜜即可食用。',
      ],
      image: '',
      tags: ['高蛋白', '素食'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
    },
    {
      id: 'recipe-10',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '酸辣土豆丝',
      category: '午餐',
      cookTime: 12,
      ingredients: [
        { name: '土豆', amount: '2个', calories: 200, protein: 5, carbs: 46, fat: 0.4 },
        { name: '干辣椒', amount: '5个', calories: 10, protein: 0.5, carbs: 2, fat: 0.3 },
        { name: '醋', amount: '2勺', calories: 5, protein: 0, carbs: 1, fat: 0 },
        { name: '食用油', amount: '1.5勺', calories: 135, protein: 0, carbs: 0, fat: 15 },
        { name: '葱花', amount: '适量', calories: 5, protein: 0.2, carbs: 1, fat: 0 },
      ],
      steps: [
        '土豆去皮切丝，用清水浸泡去除淀粉。',
        '干辣椒切段，葱花备用。',
        '锅烧热放油，爆香干辣椒。',
        '捞出土豆丝沥干水分，下锅大火快炒。',
        '加入醋、盐调味，翻炒均匀。',
        '撒上葱花出锅。',
      ],
      image: '',
      tags: ['素食', '低脂'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: 'recipe-11',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '蒸蛋羹',
      category: '早餐',
      cookTime: 12,
      ingredients: [
        { name: '鸡蛋', amount: '2个', calories: 140, protein: 12, carbs: 2, fat: 10 },
        { name: '温水', amount: '200ml', calories: 0, protein: 0, carbs: 0, fat: 0 },
        { name: '生抽', amount: '1勺', calories: 10, protein: 1, carbs: 2, fat: 0 },
        { name: '香油', amount: '几滴', calories: 10, protein: 0, carbs: 0, fat: 1 },
        { name: '葱花', amount: '适量', calories: 5, protein: 0.2, carbs: 1, fat: 0 },
      ],
      steps: [
        '鸡蛋打入碗中，加少许盐打散。',
        '加入温水搅拌均匀，温水和蛋液比例约1.5:1。',
        '蛋液过筛，撇去浮沫。',
        '盖上保鲜膜，水开后上锅蒸10分钟。',
        '取出淋上生抽、香油，撒上葱花即可。',
      ],
      image: '',
      tags: ['高蛋白', '低脂'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 11).toISOString(),
    },
    {
      id: 'recipe-12',
      authorId: 'demo-user-1',
      authorName: '美食家小王',
      authorAvatar: '',
      name: '坚果能量棒',
      category: '加餐',
      cookTime: 25,
      ingredients: [
        { name: '燕麦片', amount: '100g', calories: 380, protein: 14, carbs: 65, fat: 6 },
        { name: '杏仁', amount: '50g', calories: 290, protein: 10, carbs: 10, fat: 26 },
        { name: '蜂蜜', amount: '50g', calories: 160, protein: 0.5, carbs: 42, fat: 0 },
        { name: '花生酱', amount: '30g', calories: 180, protein: 8, carbs: 6, fat: 15 },
        { name: '葡萄干', amount: '30g', calories: 90, protein: 1, carbs: 22, fat: 0.2 },
      ],
      steps: [
        '杏仁切碎，和燕麦片、葡萄干混合。',
        '蜂蜜和花生酱混合，小火加热至顺滑。',
        '将液体倒入干性材料中，快速搅拌均匀。',
        '倒入铺油纸的模具中，压紧压实。',
        '冷藏2小时后取出切条即可。',
      ],
      image: '',
      tags: ['高蛋白', '素食'],
      likes: [],
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
    },
  ];

  db.data.recipes.push(...demoRecipes);

  db.data.recipes[0].likes = ['user-temp-1', 'user-temp-2', 'user-temp-3'];
  db.data.recipes[1].likes = ['user-temp-1', 'user-temp-4'];
  db.data.recipes[2].likes = ['user-temp-2', 'user-temp-3', 'user-temp-5', 'user-temp-6'];
  db.data.recipes[5].likes = ['user-temp-1', 'user-temp-2', 'user-temp-3', 'user-temp-4', 'user-temp-5'];
  db.data.recipes[3].likes = ['user-temp-4', 'user-temp-5', 'user-temp-6', 'user-temp-7'];

  const demoComments: Comment[] = [
    {
      id: 'comment-1',
      recipeId: 'recipe-1',
      userId: 'demo-user-1',
      username: '美食爱好者',
      userAvatar: '',
      content: '简单又好吃！家里人都喜欢 👍😋',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'comment-2',
      recipeId: 'recipe-1',
      userId: 'demo-user-1',
      username: '厨房小白',
      userAvatar: '',
      content: '第一次做就成功了，感谢分享！❤️',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'comment-3',
      recipeId: 'recipe-5',
      userId: 'demo-user-1',
      username: '健身达人',
      userAvatar: '',
      content: '减脂期的好选择，搭配酸奶很美味 🥗',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ];
  db.data.comments.push(...demoComments);
}

export async function getAllUsers(): Promise<User[]> {
  await db.read();
  return db.data.users;
}

export async function findUserById(id: string): Promise<User | undefined> {
  await db.read();
  return db.data.users.find(u => u.id === id);
}

export async function findUserByUsername(username: string): Promise<User | undefined> {
  await db.read();
  return db.data.users.find(u => u.username === username);
}

export async function createUser(user: User): Promise<void> {
  await db.read();
  db.data.users.push(user);
  await db.write();
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
  await db.read();
  const idx = db.data.users.findIndex(u => u.id === id);
  if (idx === -1) return undefined;
  db.data.users[idx] = { ...db.data.users[idx], ...updates };
  await db.write();
  return db.data.users[idx];
}

export async function getRecipes(
  tab: 'latest' | 'popular',
  page: number,
  limit: number
): Promise<{ recipes: Recipe[]; total: number }> {
  await db.read();
  let list = [...db.data.recipes];
  if (tab === 'latest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    list.sort((a, b) => b.likes.length - a.likes.length);
  }
  const total = list.length;
  const start = (page - 1) * limit;
  const recipes = list.slice(start, start + limit);
  return { recipes, total };
}

export async function findRecipeById(id: string): Promise<Recipe | undefined> {
  await db.read();
  return db.data.recipes.find(r => r.id === id);
}

export async function createRecipe(recipe: Recipe): Promise<void> {
  await db.read();
  db.data.recipes.push(recipe);
  await db.write();
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<Recipe | undefined> {
  await db.read();
  const idx = db.data.recipes.findIndex(r => r.id === id);
  if (idx === -1) return undefined;
  db.data.recipes[idx] = { ...db.data.recipes[idx], ...updates };
  await db.write();
  return db.data.recipes[idx];
}

export async function getCommentsByRecipe(recipeId: string): Promise<Comment[]> {
  await db.read();
  return db.data.comments
    .filter(c => c.recipeId === recipeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function createComment(comment: Comment): Promise<void> {
  await db.read();
  db.data.comments.push(comment);
  await db.write();
}

export async function findMealPlanByUser(userId: string): Promise<MealPlan | undefined> {
  await db.read();
  return db.data.mealPlans.find(p => p.userId === userId);
}

export async function createMealPlan(plan: MealPlan): Promise<void> {
  await db.read();
  db.data.mealPlans.push(plan);
  await db.write();
}

export async function updateMealPlan(id: string, updates: Partial<MealPlan>): Promise<MealPlan | undefined> {
  await db.read();
  const idx = db.data.mealPlans.findIndex(p => p.id === id);
  if (idx === -1) return undefined;
  db.data.mealPlans[idx] = { ...db.data.mealPlans[idx], ...updates };
  await db.write();
  return db.data.mealPlans[idx];
}
