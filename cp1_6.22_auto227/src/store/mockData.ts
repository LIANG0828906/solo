import type {
  InventoryItem,
  Recipe,
  CookingHistory,
} from '@/utils/types';

export const mockInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    name: '鸡蛋',
    quantity: 10,
    unit: 'piece',
    expirationDate: '2026-06-25',
    createdAt: '2026-06-20',
  },
  {
    id: 'inv-2',
    name: '番茄',
    quantity: 500,
    unit: 'g',
    expirationDate: '2026-06-24',
    createdAt: '2026-06-20',
  },
  {
    id: 'inv-3',
    name: '米饭',
    quantity: 2000,
    unit: 'g',
    expirationDate: '2026-12-31',
    createdAt: '2026-06-15',
  },
  {
    id: 'inv-4',
    name: '鸡胸肉',
    quantity: 300,
    unit: 'g',
    expirationDate: '2026-06-23',
    createdAt: '2026-06-21',
  },
  {
    id: 'inv-5',
    name: '牛奶',
    quantity: 1000,
    unit: 'ml',
    expirationDate: '2026-06-26',
    createdAt: '2026-06-20',
  },
];

export const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    name: '番茄炒蛋',
    description: '经典家常菜，酸甜可口',
    cookTime: 15,
    ingredients: [
      { name: '番茄', quantity: 300, unit: 'g' },
      { name: '鸡蛋', quantity: 3, unit: 'piece' },
    ],
    steps: [
      { step: 1, description: '番茄切块，鸡蛋打散', duration: 5 },
      { step: 2, description: '热锅下油，炒鸡蛋至定型盛出', duration: 3 },
      { step: 3, description: '炒番茄出汁，加入鸡蛋翻炒均匀', duration: 5 },
      { step: 4, description: '加盐调味，出锅', duration: 2 },
    ],
  },
  {
    id: 'recipe-2',
    name: '香煎鸡胸肉',
    description: '低脂高蛋白的健康选择',
    cookTime: 20,
    ingredients: [
      { name: '鸡胸肉', quantity: 300, unit: 'g' },
      { name: '黑胡椒', quantity: 5, unit: 'g' },
      { name: '盐', quantity: 3, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '鸡胸肉用刀背拍松，两面撒盐和黑胡椒腌制', duration: 10 },
      { step: 2, description: '平底锅加热，放入鸡胸肉煎至两面金黄', duration: 8 },
      { step: 3, description: '静置2分钟后切片装盘', duration: 2 },
    ],
  },
  {
    id: 'recipe-3',
    name: '蛋炒饭',
    description: '简单快手的经典主食',
    cookTime: 10,
    ingredients: [
      { name: '米饭', quantity: 300, unit: 'g' },
      { name: '鸡蛋', quantity: 2, unit: 'piece' },
      { name: '葱花', quantity: 10, unit: 'g' },
    ],
    steps: [
      { step: 1, description: '鸡蛋打散，米饭打散备用', duration: 2 },
      { step: 2, description: '热锅下油，倒入蛋液炒至半凝固', duration: 2 },
      { step: 3, description: '加入米饭大火翻炒均匀', duration: 4 },
      { step: 4, description: '加盐和葱花翻炒出锅', duration: 2 },
    ],
  },
];

export const mockCookingHistory: CookingHistory[] = [
  {
    id: 'history-1',
    recipeId: 'recipe-1',
    recipeName: '番茄炒蛋',
    date: '2026-06-20',
    completed: true,
  },
  {
    id: 'history-2',
    recipeId: 'recipe-3',
    recipeName: '蛋炒饭',
    date: '2026-06-19',
    completed: true,
  },
];
