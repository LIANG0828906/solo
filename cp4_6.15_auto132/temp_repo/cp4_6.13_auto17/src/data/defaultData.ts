import type { Ingredient, Recipe } from '../types';

const today = new Date();
const addDays = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const defaultIngredients: Omit<Ingredient, 'id'>[] = [
  {
    name: '鸡蛋',
    category: '蛋类',
    quantity: 10,
    unit: '个',
    expiryDate: addDays(14),
    storageLocation: '冷藏',
  },
  {
    name: '牛奶',
    category: '乳制品',
    quantity: 1000,
    unit: '毫升',
    expiryDate: addDays(7),
    storageLocation: '冷藏',
  },
  {
    name: '番茄',
    category: '蔬菜',
    quantity: 500,
    unit: '克',
    expiryDate: addDays(5),
    storageLocation: '冷藏',
  },
  {
    name: '土豆',
    category: '蔬菜',
    quantity: 800,
    unit: '克',
    expiryDate: addDays(20),
    storageLocation: '常温',
  },
  {
    name: '洋葱',
    category: '蔬菜',
    quantity: 300,
    unit: '克',
    expiryDate: addDays(15),
    storageLocation: '常温',
  },
];

export const defaultRecipes: Omit<Recipe, 'id'>[] = [
  {
    name: '番茄炒蛋',
    ingredients: [
      { name: '番茄', quantity: 200, unit: '克' },
      { name: '鸡蛋', quantity: 2, unit: '个' },
    ],
    cookTime: 15,
    difficulty: '简单',
    steps: [
      '番茄洗净切块，鸡蛋打散加少许盐',
      '热锅倒油，倒入蛋液炒至凝固盛出',
      '锅中再加少许油，放入番茄翻炒出汁',
      '加入炒好的鸡蛋，加盐调味，翻炒均匀出锅',
    ],
  },
  {
    name: '土豆烧牛肉',
    ingredients: [
      { name: '土豆', quantity: 300, unit: '克' },
      { name: '牛肉', quantity: 200, unit: '克' },
      { name: '洋葱', quantity: 100, unit: '克' },
    ],
    cookTime: 60,
    difficulty: '中等',
    steps: [
      '牛肉切块焯水，土豆去皮切块，洋葱切片',
      '热锅倒油，爆香洋葱，加入牛肉翻炒上色',
      '加生抽、老抽、料酒、冰糖调味，加水没过牛肉',
      '大火烧开后转小火炖40分钟',
      '加入土豆继续炖20分钟至软烂，大火收汁',
    ],
  },
  {
    name: '洋葱炒鸡蛋',
    ingredients: [
      { name: '洋葱', quantity: 150, unit: '克' },
      { name: '鸡蛋', quantity: 3, unit: '个' },
    ],
    cookTime: 12,
    difficulty: '简单',
    steps: [
      '洋葱切丝，鸡蛋打散加少许盐',
      '热锅倒油，倒入蛋液炒至凝固盛出',
      '锅中加油，放入洋葱丝炒至变软',
      '加入炒好的鸡蛋，加盐调味翻炒均匀',
    ],
  },
  {
    name: '牛奶土豆泥',
    ingredients: [
      { name: '土豆', quantity: 250, unit: '克' },
      { name: '牛奶', quantity: 100, unit: '毫升' },
    ],
    cookTime: 25,
    difficulty: '简单',
    steps: [
      '土豆去皮切小块，上锅蒸熟约15分钟',
      '取出土豆压成泥',
      '加入牛奶、少许盐和黄油搅拌均匀',
      '可根据口味加入黑胡椒调味',
    ],
  },
  {
    name: '番茄土豆汤',
    ingredients: [
      { name: '番茄', quantity: 150, unit: '克' },
      { name: '土豆', quantity: 200, unit: '克' },
      { name: '洋葱', quantity: 50, unit: '克' },
    ],
    cookTime: 35,
    difficulty: '简单',
    steps: [
      '番茄去皮切块，土豆切丁，洋葱切末',
      '锅中倒油，爆香洋葱末',
      '加入番茄炒出汤汁',
      '加入土豆丁和适量清水，大火烧开转小火煮20分钟',
      '加盐调味，可撒少许葱花',
    ],
  },
];
