import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, Ingredient, RecipeFilters, TimeFilter } from '@/types';

const DB_NAME = 'FamilyRecipesDB';
const DB_VERSION = 1;
const STORE_RECIPES = 'recipes';
const CURRENT_USER_ID = 'user_local_001';
const CURRENT_USER_NAME = '我';

let dbInstance: IDBDatabase | null = null;
let initPromise: Promise<IDBDatabase> | null = null;

const openDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (initPromise) return initPromise;

  initPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      dbInstance = req.result;
      resolve(dbInstance);
    };
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_RECIPES)) {
        const store = db.createObjectStore(STORE_RECIPES, { keyPath: 'id' });
        store.createIndex('byAuthor', 'authorId', { unique: false });
        store.createIndex('byPublic', 'isPublic', { unique: false });
        store.createIndex('byCookTime', 'cookTime', { unique: false });
      }
    };
  });
  return initPromise;
};

const getAllRecipes = async (): Promise<Recipe[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECIPES, 'readonly');
    const store = tx.objectStore(STORE_RECIPES);
    const req = store.getAll();
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result as Recipe[]);
  });
};

const putRecipe = async (recipe: Recipe): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECIPES, 'readwrite');
    const store = tx.objectStore(STORE_RECIPES);
    const req = store.put(recipe);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
};

const deleteRecipe = async (id: string): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_RECIPES, 'readwrite');
    const store = tx.objectStore(STORE_RECIPES);
    const req = store.delete(id);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve();
  });
};

const SEED_RECIPES: Recipe[] = [
  {
    id: 'seed-tomato-egg',
    title: '番茄炒蛋',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20tomato%20scrambled%20eggs%20dish%20on%20white%20plate%20warm%20lighting%20homestyle%20food%20photography&image_size=square',
    ingredients: [
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '3个' },
      { name: '葱', amount: '适量' },
      { name: '盐', amount: '少许' },
      { name: '糖', amount: '1小勺' },
    ],
    steps: [
      '鸡蛋打散加少许盐，番茄切块备用',
      '热油滑炒鸡蛋至半熟盛出',
      '锅内加油炒番茄出汁，加糖和盐',
      '倒入鸡蛋翻炒均匀，撒葱花出锅',
    ],
    tags: ['家常菜', '快手菜', '下饭菜'],
    cookTime: 15,
    authorId: 'seed-chef-wang',
    authorName: '王妈妈的厨房',
    isPublic: true,
    createdAt: Date.now() - 86400000 * 10,
    favorites: 128,
  },
  {
    id: 'seed-mapo-tofu',
    title: '麻婆豆腐',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sichuan%20mapo%20tofu%20spicy%20red%20chili%20oil%20minced%20pork%20green%20onion%20Chinese%20food&image_size=square',
    ingredients: [
      { name: '嫩豆腐', amount: '1盒' },
      { name: '肉末', amount: '100g' },
      { name: '豆瓣酱', amount: '1勺' },
      { name: '花椒粉', amount: '少许' },
      { name: '葱', amount: '适量' },
      { name: '蒜', amount: '3瓣' },
    ],
    steps: [
      '豆腐切块用盐水浸泡，肉末备好',
      '热油炒香蒜末，下肉末炒散',
      '加豆瓣酱炒出红油',
      '加水烧开放入豆腐，小火煮3分钟',
      '勾芡撒花椒粉和葱花出锅',
    ],
    tags: ['川菜', '下饭菜', '经典'],
    cookTime: 20,
    authorId: 'seed-chef-li',
    authorName: '李师傅',
    isPublic: true,
    createdAt: Date.now() - 86400000 * 7,
    favorites: 256,
  },
  {
    id: 'seed-milk-tea-cake',
    title: '奶茶戚风蛋糕',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fluffy%20milk%20tea%20chiffon%20cake%20light%20brown%20cream%20frosting%20afternoon%20tea%20aesthetic&image_size=square',
    ingredients: [
      { name: '鸡蛋', amount: '4个' },
      { name: '低筋面粉', amount: '80g' },
      { name: '红茶', amount: '2包' },
      { name: '牛奶', amount: '50ml' },
      { name: '糖', amount: '60g' },
      { name: '玉米油', amount: '40ml' },
    ],
    steps: [
      '红茶用牛奶泡出浓茶汁，与玉米油混合',
      '筛入面粉拌匀，加蛋黄搅匀',
      '蛋白分次加糖打至硬性发泡',
      '分三次与蛋黄糊翻拌均匀',
      '倒入模具150度烤50分钟出炉倒扣',
    ],
    tags: ['烘焙', '甜点', '下午茶'],
    cookTime: 70,
    authorId: 'seed-baker-zhang',
    authorName: '烘焙小达人阿张',
    isPublic: true,
    createdAt: Date.now() - 86400000 * 4,
    favorites: 89,
  },
  {
    id: 'seed-onion-beef',
    title: '洋葱炒牛肉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=stir%20fried%20beef%20with%20onion%20oyster%20sauce%20Chinese%20homestyle%20dish%20green%20pepper&image_size=square',
    ingredients: [
      { name: '牛肉', amount: '300g' },
      { name: '洋葱', amount: '1个' },
      { name: '青椒', amount: '1个' },
      { name: '生抽', amount: '2勺' },
      { name: '蚝油', amount: '1勺' },
      { name: '淀粉', amount: '1勺' },
    ],
    steps: [
      '牛肉逆纹切片，用生抽淀粉腌制15分钟',
      '洋葱青椒切滚刀块',
      '热锅冷油滑炒牛肉至变色盛出',
      '原锅炒香洋葱青椒',
      '倒入牛肉加蚝油大火翻炒出锅',
    ],
    tags: ['家常菜', '下饭菜', '快手菜'],
    cookTime: 25,
    authorId: CURRENT_USER_ID,
    authorName: CURRENT_USER_NAME,
    isPublic: false,
    createdAt: Date.now() - 86400000 * 2,
    favorites: 0,
  },
  {
    id: 'seed-congee',
    title: '皮蛋瘦肉粥',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20century%20egg%20pork%20congee%20rice%20porridge%20bowl%20scallion%20breakfast%20warm%20comfort%20food&image_size=square',
    ingredients: [
      { name: '大米', amount: '1杯' },
      { name: '皮蛋', amount: '2个' },
      { name: '瘦肉', amount: '150g' },
      { name: '姜', amount: '3片' },
      { name: '葱', amount: '适量' },
      { name: '盐', amount: '少许' },
    ],
    steps: [
      '大米提前泡30分钟，加水大火煮开转小火',
      '瘦肉切丝用料酒腌制',
      '粥煮至浓稠下肉丝和姜丝',
      '皮蛋切小块放入略煮',
      '加盐调味，撒葱花出锅',
    ],
    tags: ['早餐', '粥品', '养胃'],
    cookTime: 45,
    authorId: 'seed-chef-wang',
    authorName: '王妈妈的厨房',
    isPublic: true,
    createdAt: Date.now() - 86400000 * 1,
    favorites: 312,
  },
  {
    id: 'seed-egg-fried-rice',
    title: '黄金蛋炒饭',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=golden%20egg%20fried%20rice%20Chinese%20wok%20fried%20green%20pea%20carrot%20diced%20corn%20steam%20rising&image_size=square',
    ingredients: [
      { name: '隔夜米饭', amount: '2碗' },
      { name: '鸡蛋', amount: '2个' },
      { name: '葱', amount: '2根' },
      { name: '盐', amount: '少许' },
      { name: '生抽', amount: '半勺' },
    ],
    steps: [
      '鸡蛋打散，米饭提前拨散',
      '蛋液均匀拌入米饭中',
      '热锅下油，倒入米饭中火翻炒',
      '炒至粒粒分明金黄',
      '加生抽盐调味，撒葱花出锅',
    ],
    tags: ['快手菜', '主食', '早餐'],
    cookTime: 10,
    authorId: 'seed-chef-li',
    authorName: '李师傅',
    isPublic: true,
    createdAt: Date.now() - 86400000 * 3,
    favorites: 176,
  },
  {
    id: 'seed-braised-pork',
    title: '红烧肉',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20braised%20pork%20belly%20hong%20shao%20rou%20glossy%20dark%20soy%20sauce%20star%20anise%20ceramic%20pot&image_size=square',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '八角', amount: '2颗' },
      { name: '姜', amount: '5片' },
    ],
    steps: [
      '五花肉切块冷水下锅焯水',
      '冷锅下糖小火炒出糖色',
      '下五花肉翻炒上色',
      '加姜八角生抽老抽和开水没过肉',
      '大火烧开转小火炖45分钟收汁',
    ],
    tags: ['家常菜', '经典', '宴客菜'],
    cookTime: 60,
    authorId: 'seed-chef-wang',
    authorName: '王妈妈的厨房',
    isPublic: true,
    createdAt: Date.now() - 86400000 * 5,
    favorites: 445,
  },
  {
    id: 'seed-pancake',
    title: '葱花鸡蛋饼',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20scallion%20egg%20pancake%20cong%20you%20bing%20golden%20crispy%20layers%20breakfast%20street%20food&image_size=square',
    ingredients: [
      { name: '面粉', amount: '200g' },
      { name: '鸡蛋', amount: '2个' },
      { name: '葱', amount: '3根' },
      { name: '盐', amount: '少许' },
      { name: '温水', amount: '适量' },
    ],
    steps: [
      '面粉加温水和成软面团醒20分钟',
      '葱切碎，鸡蛋打散加葱花盐',
      '面团擀薄刷油撒葱花卷起再擀圆',
      '平底锅煎至两面金黄',
      '淋入蛋液翻面煎熟切块',
    ],
    tags: ['早餐', '快手菜', '主食'],
    cookTime: 20,
    authorId: CURRENT_USER_ID,
    authorName: CURRENT_USER_NAME,
    isPublic: true,
    createdAt: Date.now() - 86400000 * 6,
    favorites: 67,
  },
];

const seedIfEmpty = async () => {
  const all = await getAllRecipes();
  if (all.length === 0) {
    for (const r of SEED_RECIPES) {
      await putRecipe(r);
    }
  }
};

interface RecipeStoreState {
  recipes: Recipe[];
  loading: boolean;
  filters: RecipeFilters;
  init: () => Promise<void>;
  addRecipe: (data: Omit<Recipe, 'id' | 'createdAt' | 'favorites' | 'authorId' | 'authorName'>) => Promise<Recipe>;
  updateRecipe: (id: string, data: Partial<Recipe>) => Promise<void>;
  removeRecipe: (id: string) => Promise<void>;
  togglePublic: (id: string) => Promise<void>;
  incrementFavorites: (id: string) => Promise<void>;
  setFilters: (f: Partial<RecipeFilters>) => void;
  toggleTagFilter: (tag: string) => void;
  setTimeFilter: (t: TimeFilter) => void;
  getFilteredMyRecipes: () => Recipe[];
  getPublicRecipes: () => Recipe[];
  getRecipeById: (id: string) => Recipe | undefined;
  getAllTags: () => string[];
}

const matchTimeFilter = (t: TimeFilter, cookTime: number) => {
  switch (t) {
    case 'quick': return cookTime <= 15;
    case 'medium': return cookTime > 15 && cookTime <= 40;
    case 'slow': return cookTime > 40;
    default: return true;
  }
};

export const useRecipeStore = create<RecipeStoreState>((set, get) => ({
  recipes: [],
  loading: false,
  filters: {
    tags: [],
    timeRange: 'all',
    keyword: '',
  },

  init: async () => {
    set({ loading: true });
    try {
      await openDB();
      await seedIfEmpty();
      const recipes = await getAllRecipes();
      set({ recipes });
    } finally {
      set({ loading: false });
    }
  },

  addRecipe: async (data) => {
    const newRecipe: Recipe = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      favorites: 0,
      authorId: CURRENT_USER_ID,
      authorName: CURRENT_USER_NAME,
    };
    await putRecipe(newRecipe);
    set((s) => ({ recipes: [newRecipe, ...s.recipes] }));
    return newRecipe;
  },

  updateRecipe: async (id, data) => {
    const existing = get().recipes.find((r) => r.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    await putRecipe(updated);
    set((s) => ({
      recipes: s.recipes.map((r) => (r.id === id ? updated : r)),
    }));
  },

  removeRecipe: async (id) => {
    await deleteRecipe(id);
    set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) }));
  },

  togglePublic: async (id) => {
    const r = get().recipes.find((x) => x.id === id);
    if (r) await get().updateRecipe(id, { isPublic: !r.isPublic });
  },

  incrementFavorites: async (id) => {
    const r = get().recipes.find((x) => x.id === id);
    if (r) await get().updateRecipe(id, { favorites: r.favorites + 1 });
  },

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),

  toggleTagFilter: (tag) => set((s) => {
    const has = s.filters.tags.includes(tag);
    return {
      filters: {
        ...s.filters,
        tags: has ? s.filters.tags.filter((t) => t !== tag) : [...s.filters.tags, tag],
      },
    };
  }),

  setTimeFilter: (t) => set((s) => ({ filters: { ...s.filters, timeRange: t } })),

  getFilteredMyRecipes: () => {
    const { recipes, filters } = get();
    return recipes
      .filter((r) => r.authorId === CURRENT_USER_ID)
      .filter((r) => filters.tags.length === 0 || r.tags.some((t) => filters.tags.includes(t)))
      .filter((r) => matchTimeFilter(filters.timeRange, r.cookTime))
      .filter((r) => !filters.keyword || r.title.includes(filters.keyword))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getPublicRecipes: () => {
    return get().recipes
      .filter((r) => r.isPublic)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  getRecipeById: (id) => get().recipes.find((r) => r.id === id),

  getAllTags: () => {
    const set = new Set<string>();
    get().recipes.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  },
}));

export const CURRENT_USER = {
  id: CURRENT_USER_ID,
  name: CURRENT_USER_NAME,
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=family-chef&backgroundColor=ffd5dc,ffdfbf',
};

export type { Ingredient };
