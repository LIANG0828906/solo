import { v4 as uuidv4 } from 'uuid';
import { differenceInDays, parseISO } from 'date-fns';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeStep {
  order: number;
  description: string;
  image?: string;
}

export interface Recipe {
  id: string;
  name: string;
  cookTime: number;
  servings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  imageTint: number;
}

const DB_NAME = 'FamilyKitchenDB';
const DB_VERSION = 1;
const INGREDIENTS_STORE = 'ingredients';
const RECIPES_STORE = 'recipes';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(INGREDIENTS_STORE)) {
        const store = db.createObjectStore(INGREDIENTS_STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains(RECIPES_STORE)) {
        const store = db.createObjectStore(RECIPES_STORE, { keyPath: 'id' });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

export async function getAllIngredients(): Promise<Ingredient[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INGREDIENTS_STORE, 'readonly');
    const store = tx.objectStore(INGREDIENTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function addIngredient(ingredient: Omit<Ingredient, 'id'>): Promise<Ingredient> {
  const db = await openDB();
  const newIngredient: Ingredient = { ...ingredient, id: uuidv4() };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INGREDIENTS_STORE, 'readwrite');
    const store = tx.objectStore(INGREDIENTS_STORE);
    const request = store.add(newIngredient);

    request.onsuccess = () => resolve(newIngredient);
    request.onerror = () => reject(request.error);
  });
}

export async function updateIngredient(ingredient: Ingredient): Promise<Ingredient> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INGREDIENTS_STORE, 'readwrite');
    const store = tx.objectStore(INGREDIENTS_STORE);
    const request = store.put(ingredient);

    request.onsuccess = () => resolve(ingredient);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteIngredient(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INGREDIENTS_STORE, 'readwrite');
    const store = tx.objectStore(INGREDIENTS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAllExpiredIngredients(): Promise<void> {
  const all = await getAllIngredients();
  const expired = all.filter((ing) => getFreshnessStatus(ing) === 'expired');
  const db = await openDB();
  const tx = db.transaction(INGREDIENTS_STORE, 'readwrite');
  const store = tx.objectStore(INGREDIENTS_STORE);

  return Promise.all(
    expired.map(
      (ing) =>
        new Promise<void>((resolve, reject) => {
          const req = store.delete(ing.id);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        })
    )
  ).then(() => {});
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RECIPES_STORE, 'readonly');
    const store = tx.objectStore(RECIPES_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function seedRecipesIfEmpty(): Promise<void> {
  const existing = await getAllRecipes();
  if (existing.length > 0) return;

  const db = await openDB();
  const tx = db.transaction(RECIPES_STORE, 'readwrite');
  const store = tx.objectStore(RECIPES_STORE);

  const sampleRecipes: Recipe[] = [
    {
      id: uuidv4(),
      name: '番茄炒蛋',
      cookTime: 12,
      servings: 2,
      imageTint: 0,
      ingredients: [
        { name: '番茄', quantity: 2, unit: '个' },
        { name: '鸡蛋', quantity: 3, unit: '个' },
        { name: '葱', quantity: 1, unit: '根' },
        { name: '盐', quantity: 3, unit: '克' },
        { name: '糖', quantity: 5, unit: '克' },
      ],
      steps: [
        { order: 1, description: '番茄洗净切块，鸡蛋打散加少许盐搅匀。' },
        { order: 2, description: '热锅冷油，倒入蛋液快速翻炒至凝固，盛出备用。' },
        { order: 3, description: '锅中再加少许油，放入番茄翻炒出汁。' },
        { order: 4, description: '加入炒好的鸡蛋，撒盐和糖调味，翻炒均匀，撒葱花出锅。' },
      ],
    },
    {
      id: uuidv4(),
      name: '蒜蓉西兰花',
      cookTime: 15,
      servings: 2,
      imageTint: 1,
      ingredients: [
        { name: '西兰花', quantity: 1, unit: '棵' },
        { name: '大蒜', quantity: 4, unit: '瓣' },
        { name: '盐', quantity: 3, unit: '克' },
        { name: '生抽', quantity: 10, unit: '毫升' },
      ],
      steps: [
        { order: 1, description: '西兰花掰成小朵，用盐水浸泡10分钟后洗净。' },
        { order: 2, description: '大蒜切末备用。' },
        { order: 3, description: '烧开水，加少许盐和油，焯烫西兰花1分钟捞出。' },
        { order: 4, description: '热锅放油，爆香蒜末，倒入西兰花翻炒，加盐和生抽调味即可。' },
      ],
    },
    {
      id: uuidv4(),
      name: '红烧肉',
      cookTime: 60,
      servings: 4,
      imageTint: 2,
      ingredients: [
        { name: '五花肉', quantity: 500, unit: '克' },
        { name: '冰糖', quantity: 30, unit: '克' },
        { name: '生抽', quantity: 30, unit: '毫升' },
        { name: '老抽', quantity: 15, unit: '毫升' },
        { name: '料酒', quantity: 30, unit: '毫升' },
        { name: '生姜', quantity: 3, unit: '片' },
        { name: '八角', quantity: 2, unit: '个' },
      ],
      steps: [
        { order: 1, description: '五花肉切2厘米方块，冷水下锅加料酒焯水，捞出沥干。' },
        { order: 2, description: '锅中放少许油，加入冰糖小火炒出糖色。' },
        { order: 3, description: '放入五花肉翻炒上色，加姜片、八角爆香。' },
        { order: 4, description: '加入生抽、老抽、料酒炒匀，倒入开水没过肉。' },
        { order: 5, description: '大火烧开转小火炖煮45分钟，最后大火收汁即可。' },
      ],
    },
    {
      id: uuidv4(),
      name: '酸辣土豆丝',
      cookTime: 20,
      servings: 2,
      imageTint: 3,
      ingredients: [
        { name: '土豆', quantity: 2, unit: '个' },
        { name: '干辣椒', quantity: 5, unit: '个' },
        { name: '花椒', quantity: 1, unit: '克' },
        { name: '醋', quantity: 20, unit: '毫升' },
        { name: '盐', quantity: 3, unit: '克' },
        { name: '大蒜', quantity: 2, unit: '瓣' },
      ],
      steps: [
        { order: 1, description: '土豆去皮切细丝，泡水去淀粉后沥干。' },
        { order: 2, description: '干辣椒切段，大蒜切丝。' },
        { order: 3, description: '热锅冷油，爆香花椒和干辣椒，捞出花椒。' },
        { order: 4, description: '放入土豆丝大火快炒，加醋、盐翻炒均匀，出锅前撒蒜丝。' },
      ],
    },
    {
      id: uuidv4(),
      name: '凉拌黄瓜',
      cookTime: 10,
      servings: 2,
      imageTint: 4,
      ingredients: [
        { name: '黄瓜', quantity: 2, unit: '根' },
        { name: '大蒜', quantity: 3, unit: '瓣' },
        { name: '生抽', quantity: 15, unit: '毫升' },
        { name: '醋', quantity: 15, unit: '毫升' },
        { name: '香油', quantity: 5, unit: '毫升' },
        { name: '辣椒油', quantity: 10, unit: '毫升' },
      ],
      steps: [
        { order: 1, description: '黄瓜拍碎切段，撒盐腌制10分钟后挤干水分。' },
        { order: 2, description: '大蒜捣成蒜泥。' },
        { order: 3, description: '将蒜泥、生抽、醋、香油、辣椒油调成料汁。' },
        { order: 4, description: '料汁倒入黄瓜中拌匀即可。' },
      ],
    },
    {
      id: uuidv4(),
      name: '青椒炒肉丝',
      cookTime: 25,
      servings: 3,
      imageTint: 5,
      ingredients: [
        { name: '猪肉', quantity: 300, unit: '克' },
        { name: '青椒', quantity: 3, unit: '个' },
        { name: '生抽', quantity: 20, unit: '毫升' },
        { name: '料酒', quantity: 10, unit: '毫升' },
        { name: '淀粉', quantity: 5, unit: '克' },
        { name: '盐', quantity: 2, unit: '克' },
      ],
      steps: [
        { order: 1, description: '猪肉切丝，加生抽、料酒、淀粉抓匀腌制15分钟。' },
        { order: 2, description: '青椒去籽切丝备用。' },
        { order: 3, description: '热锅多放油，倒入肉丝滑炒至变色盛出。' },
        { order: 4, description: '锅中留底油，爆香青椒丝，加盐翻炒。' },
        { order: 5, description: '倒入肉丝一起翻炒均匀，加少许生抽调味出锅。' },
      ],
    },
    {
      id: uuidv4(),
      name: '麻婆豆腐',
      cookTime: 30,
      servings: 3,
      imageTint: 6,
      ingredients: [
        { name: '豆腐', quantity: 1, unit: '盒' },
        { name: '猪肉末', quantity: 150, unit: '克' },
        { name: '郫县豆瓣酱', quantity: 30, unit: '克' },
        { name: '花椒粉', quantity: 2, unit: '克' },
        { name: '生抽', quantity: 15, unit: '毫升' },
        { name: '葱花', quantity: 5, unit: '克' },
        { name: '大蒜', quantity: 3, unit: '瓣' },
      ],
      steps: [
        { order: 1, description: '豆腐切2厘米方块，用盐水焯烫后捞出。' },
        { order: 2, description: '热锅放油，炒香肉末至变色。' },
        { order: 3, description: '加入蒜末和豆瓣酱炒出红油。' },
        { order: 4, description: '加入适量清水烧开，放入豆腐炖煮5分钟。' },
        { order: 5, description: '加生抽调味，勾芡后撒花椒粉和葱花即可。' },
      ],
    },
    {
      id: uuidv4(),
      name: '紫菜蛋花汤',
      cookTime: 10,
      servings: 3,
      imageTint: 7,
      ingredients: [
        { name: '紫菜', quantity: 5, unit: '克' },
        { name: '鸡蛋', quantity: 2, unit: '个' },
        { name: '虾皮', quantity: 10, unit: '克' },
        { name: '盐', quantity: 3, unit: '克' },
        { name: '香油', quantity: 5, unit: '毫升' },
        { name: '葱', quantity: 1, unit: '根' },
      ],
      steps: [
        { order: 1, description: '紫菜撕碎放入汤碗，加虾皮备用。' },
        { order: 2, description: '鸡蛋打散备用。' },
        { order: 3, description: '锅中烧开水，淋入蛋液形成蛋花。' },
        { order: 4, description: '加盐调味，将汤冲入紫菜碗中，滴香油撒葱花即可。' },
      ],
    },
    {
      id: uuidv4(),
      name: '宫保鸡丁',
      cookTime: 35,
      servings: 3,
      imageTint: 8,
      ingredients: [
        { name: '鸡胸肉', quantity: 400, unit: '克' },
        { name: '花生米', quantity: 50, unit: '克' },
        { name: '干辣椒', quantity: 8, unit: '个' },
        { name: '花椒', quantity: 3, unit: '克' },
        { name: '生抽', quantity: 20, unit: '毫升' },
        { name: '醋', quantity: 15, unit: '毫升' },
        { name: '糖', quantity: 20, unit: '克' },
        { name: '淀粉', quantity: 10, unit: '克' },
      ],
      steps: [
        { order: 1, description: '鸡胸肉切丁，加生抽、料酒、淀粉抓匀腌制20分钟。' },
        { order: 2, description: '调碗汁：生抽、醋、糖、淀粉、少许水搅匀。' },
        { order: 3, description: '热锅冷油，炸花生米至金黄捞出。' },
        { order: 4, description: '锅中油爆香花椒和干辣椒，倒入鸡丁滑炒变色。' },
        { order: 5, description: '淋入碗汁快速翻炒，最后撒花生米炒匀出锅。' },
      ],
    },
    {
      id: uuidv4(),
      name: '干煸豆角',
      cookTime: 28,
      servings: 2,
      imageTint: 9,
      ingredients: [
        { name: '四季豆', quantity: 400, unit: '克' },
        { name: '猪肉末', quantity: 100, unit: '克' },
        { name: '蒜', quantity: 4, unit: '瓣' },
        { name: '干辣椒', quantity: 6, unit: '个' },
        { name: '生抽', quantity: 15, unit: '毫升' },
        { name: '盐', quantity: 2, unit: '克' },
      ],
      steps: [
        { order: 1, description: '四季豆摘去两头掰段，洗净沥干水分。' },
        { order: 2, description: '热锅多放油，将四季豆炸至表面微皱捞出沥油。' },
        { order: 3, description: '锅中留底油，炒香肉末至变色。' },
        { order: 4, description: '加入蒜末、干辣椒爆香，倒入四季豆翻炒。' },
        { order: 5, description: '加生抽和盐调味，大火翻炒均匀出锅。' },
      ],
    },
  ];

  await Promise.all(
    sampleRecipes.map(
      (recipe) =>
        new Promise<void>((resolve, reject) => {
          const req = store.add(recipe);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        })
    )
  );
}

export type FreshnessStatus = 'fresh' | 'warning' | 'danger' | 'expired';

export function getFreshnessStatus(ingredient: Ingredient): FreshnessStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let expiry: Date;
  try {
    expiry = parseISO(ingredient.expiryDate);
  } catch {
    return 'fresh';
  }
  expiry.setHours(0, 0, 0, 0);
  const daysLeft = differenceInDays(expiry, today);
  if (daysLeft < 0) return 'expired';
  if (daysLeft <= 3) return 'danger';
  if (daysLeft <= 7) return 'warning';
  return 'fresh';
}

export function getDaysLeft(ingredient: Ingredient): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let expiry: Date;
  try {
    expiry = parseISO(ingredient.expiryDate);
  } catch {
    return 30;
  }
  expiry.setHours(0, 0, 0, 0);
  return differenceInDays(expiry, today);
}

export function getFreshnessPercentage(ingredient: Ingredient): number {
  const daysLeft = getDaysLeft(ingredient);
  if (daysLeft <= 0) return 0;
  if (daysLeft >= 30) return 100;
  return Math.round((daysLeft / 30) * 100);
}

export interface MatchResult {
  recipe: Recipe;
  matchedCount: number;
  totalCount: number;
  matchedNames: string[];
  missingNames: string[];
}

export function calculateMatch(recipe: Recipe, ingredients: Ingredient[]): MatchResult {
  const ingredientNames = ingredients.map((i) => i.name.trim().toLowerCase());
  const matched: string[] = [];
  const missing: string[] = [];

  for (const ri of recipe.ingredients) {
    const name = ri.name.trim().toLowerCase();
    if (ingredientNames.some((n) => n.includes(name) || name.includes(n))) {
      matched.push(ri.name);
    } else {
      missing.push(ri.name);
    }
  }

  return {
    recipe,
    matchedCount: matched.length,
    totalCount: recipe.ingredients.length,
    matchedNames: matched,
    missingNames: missing,
  };
}

export function getTimeTagColor(cookTime: number): string {
  if (cookTime <= 15) return '#22C55E';
  if (cookTime <= 30) return '#F97316';
  return '#EF4444';
}

export function getGradientTint(index: number): string {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    'linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)',
    'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
  ];
  return gradients[index % gradients.length];
}
