import type { Ingredient } from '@/types';

export const presetIngredients: Ingredient[] = [
  { id: 'egg', name: '鸡蛋', icon: '🥚' },
  { id: 'milk', name: '牛奶', icon: '🥛' },
  { id: 'flour', name: '面粉', icon: '🌾' },
  { id: 'tomato', name: '番茄', icon: '🍅' },
  { id: 'onion', name: '洋葱', icon: '🧅' },
  { id: 'carrot', name: '胡萝卜', icon: '🥕' },
  { id: 'potato', name: '土豆', icon: '🥔' },
  { id: 'chicken', name: '鸡肉', icon: '🍗' },
  { id: 'beef', name: '牛肉', icon: '🥩' },
  { id: 'pork', name: '猪肉', icon: '🥓' },
  { id: 'fish', name: '鱼', icon: '🐟' },
  { id: 'shrimp', name: '虾', icon: '🦐' },
  { id: 'rice', name: '大米', icon: '🍚' },
  { id: 'noodle', name: '面条', icon: '🍜' },
  { id: 'garlic', name: '大蒜', icon: '🧄' },
  { id: 'ginger', name: '生姜', icon: '🫚' },
  { id: 'cucumber', name: '黄瓜', icon: '🥒' },
  { id: 'cabbage', name: '白菜', icon: '🥬' },
  { id: 'mushroom', name: '蘑菇', icon: '🍄' },
  { id: 'peanut', name: '花生', icon: '🥜' },
];

export const allergenOptions = [
  { id: 'peanut', name: '花生', icon: '🥜' },
  { id: 'seafood', name: '海鲜', icon: '🦞' },
  { id: 'dairy', name: '乳制品', icon: '🧀' },
];

export const dietTypeOptions = [
  { id: 'unlimited', name: '无限制' },
  { id: 'vegetarian', name: '素食' },
  { id: 'lowCalorie', name: '低卡' },
  { id: 'highProtein', name: '高蛋白' },
];
