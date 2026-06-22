import { v4 as uuidv4 } from 'uuid';

export type Unit = 'g' | 'ml' | 'piece';

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  expirationDate: string;
  createdAt: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: Unit;
}

export interface RecipeStep {
  step: number;
  description: string;
  duration: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  cookTime: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
}

export interface CookingHistory {
  id: string;
  recipeId: string;
  recipeName: string;
  date: string;
  completed: boolean;
}

const now = new Date();

const addDays = (date: Date, days: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const addHours = (date: Date, hours: number): string => {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};

const initialInventory: InventoryItem[] = [
  {
    id: uuidv4(),
    name: '番茄',
    quantity: 500,
    unit: 'g',
    expirationDate: addHours(now, 12),
    createdAt: addDays(now, -3),
  },
  {
    id: uuidv4(),
    name: '鸡蛋',
    quantity: 10,
    unit: 'piece',
    expirationDate: addDays(now, 7),
    createdAt: addDays(now, -2),
  },
  {
    id: uuidv4(),
    name: '猪肉',
    quantity: 300,
    unit: 'g',
    expirationDate: addHours(now, 8),
    createdAt: addDays(now, -1),
  },
  {
    id: uuidv4(),
    name: '土豆',
    quantity: 800,
    unit: 'g',
    expirationDate: addDays(now, 14),
    createdAt: addDays(now, -5),
  },
  {
    id: uuidv4(),
    name: '青菜',
    quantity: 400,
    unit: 'g',
    expirationDate: addHours(now, 20),
    createdAt: addDays(now, -1),
  },
  {
    id: uuidv4(),
    name: '米饭',
    quantity: 2000,
    unit: 'g',
    expirationDate: addDays(now, 30),
    createdAt: addDays(now, -10),
  },
  {
    id: uuidv4(),
    name: '鸡肉',
    quantity: 600,
    unit: 'g',
    expirationDate: addHours(now, 36),
    createdAt: addDays(now, -2),
  },
  {
    id: uuidv4(),
    name: '食用油',
    quantity: 1500,
    unit: 'ml',
    expirationDate: addDays(now, 180),
    createdAt: addDays(now, -30),
  },
  {
    id: uuidv4(),
    name: '酱油',
    quantity: 500,
    unit: 'ml',
    expirationDate: addDays(now, 90),
    createdAt: addDays(now, -20),
  },
  {
    id: uuidv4(),
    name: '盐',
    quantity: 300,
    unit: 'g',
    expirationDate: addDays(now, 365),
    createdAt: addDays(now, -60),
  },
];

const initialRecipes: Recipe[] = [
  {
    id: uuidv4(),
    name: '番茄炒蛋',
    description: '经典家常菜，酸甜可口，简单易做',
    cookTime: 15,
    ingredients: [
      { name: '番茄', quantity: 300, unit: 'g' },
      { name: '鸡蛋', quantity: 3, unit: 'piece' },
      { name: '食用油', quantity: 20, unit: 'ml' },
      { name: '盐', quantity: 3, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '番茄切块，鸡蛋打散', duration: 3 },
      { step: 2, description: '热油炒鸡蛋至凝固盛出', duration: 3 },
      { step: 3, description: '炒番茄出汁，加入鸡蛋', duration: 5 },
      { step: 4, description: '加盐调味翻炒均匀', duration: 2 },
      { step: 5, description: '出锅装盘', duration: 2 },
    ],
  },
  {
    id: uuidv4(),
    name: '红烧肉',
    description: '肥而不腻，入口即化的经典硬菜',
    cookTime: 60,
    ingredients: [
      { name: '猪肉', quantity: 500, unit: 'g' },
      { name: '酱油', quantity: 30, unit: 'ml' },
      { name: '食用油', quantity: 15, unit: 'ml' },
    ],
    steps: [
      { step: 1, description: '猪肉切块焯水', duration: 10 },
      { step: 2, description: '炒糖色至琥珀色', duration: 5 },
      { step: 3, description: '下肉块翻炒上色', duration: 10 },
      { step: 4, description: '加酱油和水炖煮', duration: 30 },
      { step: 5, description: '大火收汁出锅', duration: 5 },
    ],
  },
  {
    id: uuidv4(),
    name: '清炒时蔬',
    description: '清爽健康，保留蔬菜原味',
    cookTime: 10,
    ingredients: [
      { name: '青菜', quantity: 400, unit: 'g' },
      { name: '食用油', quantity: 15, unit: 'ml' },
      { name: '盐', quantity: 2, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '青菜洗净沥干', duration: 3 },
      { step: 2, description: '热油下青菜快炒', duration: 4 },
      { step: 3, description: '加盐调味出锅', duration: 3 },
    ],
  },
  {
    id: uuidv4(),
    name: '酸辣土豆丝',
    description: '酸辣爽脆，下饭神器',
    cookTime: 20,
    ingredients: [
      { name: '土豆', quantity: 400, unit: 'g' },
      { name: '食用油', quantity: 20, unit: 'ml' },
      { name: '酱油', quantity: 10, unit: 'ml' },
      { name: '盐', quantity: 2, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '土豆切丝泡水去淀粉', duration: 5 },
      { step: 2, description: '热油爆香调料', duration: 3 },
      { step: 3, description: '下土豆丝快炒', duration: 8 },
      { step: 4, description: '加酱油和盐调味', duration: 4 },
    ],
  },
  {
    id: uuidv4(),
    name: '蛋炒饭',
    description: '粒粒分明，香气四溢的快手炒饭',
    cookTime: 12,
    ingredients: [
      { name: '米饭', quantity: 300, unit: 'g' },
      { name: '鸡蛋', quantity: 2, unit: 'piece' },
      { name: '食用油', quantity: 20, unit: 'ml' },
      { name: '盐', quantity: 2, unit: 'g' },
      { name: '酱油', quantity: 5, unit: 'ml' },
    ],
    steps: [
      { step: 1, description: '鸡蛋打散', duration: 2 },
      { step: 2, description: '热油炒蛋盛出', duration: 3 },
      { step: 3, description: '炒米饭至颗粒分明', duration: 4 },
      { step: 4, description: '加入鸡蛋和调味料', duration: 3 },
    ],
  },
  {
    id: uuidv4(),
    name: '清炖鸡汤',
    description: '滋补养生，汤色清亮',
    cookTime: 90,
    ingredients: [
      { name: '鸡肉', quantity: 500, unit: 'g' },
      { name: '盐', quantity: 5, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '鸡肉切块焯水去腥', duration: 10 },
      { step: 2, description: '加水大火烧开', duration: 15 },
      { step: 3, description: '小火慢炖', duration: 60 },
      { step: 4, description: '加盐调味出锅', duration: 5 },
    ],
  },
  {
    id: uuidv4(),
    name: '土豆烧肉',
    description: '土豆软糯，肉香浓郁',
    cookTime: 50,
    ingredients: [
      { name: '猪肉', quantity: 300, unit: 'g' },
      { name: '土豆', quantity: 400, unit: 'g' },
      { name: '酱油', quantity: 20, unit: 'ml' },
      { name: '食用油', quantity: 15, unit: 'ml' },
      { name: '盐', quantity: 2, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '猪肉切块焯水', duration: 10 },
      { step: 2, description: '土豆切块', duration: 3 },
      { step: 3, description: '炒肉上色加酱油', duration: 7 },
      { step: 4, description: '加水和土豆炖煮', duration: 25 },
      { step: 5, description: '大火收汁调味', duration: 5 },
    ],
  },
];

const initialHistory: CookingHistory[] = [
  {
    id: uuidv4(),
    recipeId: initialRecipes[0].id,
    recipeName: initialRecipes[0].name,
    date: addDays(now, -1),
    completed: true,
  },
  {
    id: uuidv4(),
    recipeId: initialRecipes[4].id,
    recipeName: initialRecipes[4].name,
    date: addDays(now, -2),
    completed: true,
  },
  {
    id: uuidv4(),
    recipeId: initialRecipes[2].id,
    recipeName: initialRecipes[2].name,
    date: addDays(now, -3),
    completed: true,
  },
  {
    id: uuidv4(),
    recipeId: initialRecipes[1].id,
    recipeName: initialRecipes[1].name,
    date: addDays(now, -5),
    completed: true,
  },
  {
    id: uuidv4(),
    recipeId: initialRecipes[3].id,
    recipeName: initialRecipes[3].name,
    date: addDays(now, -6),
    completed: false,
  },
];

interface DataStore {
  inventory: InventoryItem[];
  recipes: Recipe[];
  history: CookingHistory[];
}

const store: DataStore = {
  inventory: [...initialInventory],
  recipes: [...initialRecipes],
  history: [...initialHistory],
};

export default store;
