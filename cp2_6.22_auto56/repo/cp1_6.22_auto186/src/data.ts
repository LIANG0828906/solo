import type { FoodItem } from './types';

const today = new Date();

function daysAgo(days: number): string {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export const initialFoods: FoodItem[] = [
  {
    id: '1',
    name: '西红柿',
    quantity: 500,
    unit: '克',
    category: 'vegetable',
    purchaseDate: daysAgo(3),
    shelfLifeDays: 7,
  },
  {
    id: '2',
    name: '黄瓜',
    quantity: 2,
    unit: '根',
    category: 'vegetable',
    purchaseDate: daysAgo(5),
    shelfLifeDays: 5,
  },
  {
    id: '3',
    name: '猪肉',
    quantity: 300,
    unit: '克',
    category: 'meat',
    purchaseDate: daysAgo(1),
    shelfLifeDays: 3,
  },
  {
    id: '4',
    name: '生抽',
    quantity: 500,
    unit: '毫升',
    category: 'seasoning',
    purchaseDate: daysAgo(30),
    shelfLifeDays: 180,
  },
  {
    id: '5',
    name: '土豆',
    quantity: 1,
    unit: '公斤',
    category: 'vegetable',
    purchaseDate: daysAgo(7),
    shelfLifeDays: 14,
  },
  {
    id: '6',
    name: '鸡胸肉',
    quantity: 400,
    unit: '克',
    category: 'meat',
    purchaseDate: daysAgo(2),
    shelfLifeDays: 4,
  },
  {
    id: '7',
    name: '盐',
    quantity: 400,
    unit: '克',
    category: 'seasoning',
    purchaseDate: daysAgo(60),
    shelfLifeDays: 365,
  },
  {
    id: '8',
    name: '菠菜',
    quantity: 300,
    unit: '克',
    category: 'vegetable',
    purchaseDate: daysAgo(4),
    shelfLifeDays: 3,
  },
  {
    id: '9',
    name: '牛肉',
    quantity: 500,
    unit: '克',
    category: 'meat',
    purchaseDate: daysAgo(0),
    shelfLifeDays: 5,
  },
  {
    id: '10',
    name: '醋',
    quantity: 250,
    unit: '毫升',
    category: 'seasoning',
    purchaseDate: daysAgo(45),
    shelfLifeDays: 180,
  },
];
