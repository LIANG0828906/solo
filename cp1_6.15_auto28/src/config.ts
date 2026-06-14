import { DishConfig, Ingredient, LevelConfig } from './types';

export const COLORS = {
  background: 0x2a1810,
  panel: 0x2a1810,
  panelLight: 0x4a2a1a,
  accent: 0xff6b35,
  accentLight: 0xffa500,
  warning: 0xffcc00,
  danger: 0xff3333,
  success: 0x44cc44,
  text: 0xffffff,
  textDark: 0xcccccc,
  orderPending: 0xffffff,
  orderActive: 0xffcc00,
  orderFailed: 0xff3333,
};

export const INGREDIENTS: Ingredient[] = [
  { id: 'chicken', name: '鸡肉', color: 0xffe4b5, icon: '🍗' },
  { id: 'beef', name: '牛肉', color: 0x8b4513, icon: '🥩' },
  { id: 'tomato', name: '番茄', color: 0xff4444, icon: '🍅' },
  { id: 'egg', name: '鸡蛋', color: 0xfffacd, icon: '🥚' },
  { id: 'rice', name: '米饭', color: 0xffffff, icon: '🍚' },
  { id: 'pepper', name: '辣椒', color: 0xff2222, icon: '🌶️' },
  { id: 'onion', name: '洋葱', color: 0xffffee, icon: '🧅' },
  { id: 'carrot', name: '胡萝卜', color: 0xffa500, icon: '🥕' },
  { id: 'potato', name: '土豆', color: 0xc4a35a, icon: '🥔' },
  { id: 'fish', name: '鱼', color: 0x87ceeb, icon: '🐟' },
  { id: 'shrimp', name: '虾', color: 0xffa07a, icon: '🦐' },
  { id: 'tofu', name: '豆腐', color: 0xfffff0, icon: '🧈' },
];

export const DISHES: DishConfig[] = [
  {
    id: 'gongbao_chicken',
    name: '宫保鸡丁',
    color: 0xff6347,
    ingredients: [
      INGREDIENTS.find(i => i.id === 'chicken')!,
      INGREDIENTS.find(i => i.id === 'pepper')!,
      INGREDIENTS.find(i => i.id === 'onion')!,
    ],
    steps: [
      { type: 'prep', name: '配菜', duration: 3000, perfectWindow: 800 },
      { type: 'cook', name: '烹炒', duration: 4000, perfectWindow: 1000 },
      { type: 'plate', name: '装盘', duration: 2000, perfectWindow: 600 },
    ],
    baseScore: 100,
  },
  {
    id: 'tomato_egg',
    name: '番茄炒蛋',
    color: 0xff6347,
    ingredients: [
      INGREDIENTS.find(i => i.id === 'tomato')!,
      INGREDIENTS.find(i => i.id === 'egg')!,
    ],
    steps: [
      { type: 'prep', name: '配菜', duration: 2500, perfectWindow: 700 },
      { type: 'cook', name: '烹炒', duration: 3000, perfectWindow: 800 },
      { type: 'plate', name: '装盘', duration: 1500, perfectWindow: 500 },
    ],
    baseScore: 60,
  },
  {
    id: 'beef_stirfry',
    name: '牛肉小炒',
    color: 0x8b4513,
    ingredients: [
      INGREDIENTS.find(i => i.id === 'beef')!,
      INGREDIENTS.find(i => i.id === 'pepper')!,
      INGREDIENTS.find(i => i.id === 'onion')!,
    ],
    steps: [
      { type: 'prep', name: '配菜', duration: 3500, perfectWindow: 900 },
      { type: 'cook', name: '烹炒', duration: 4500, perfectWindow: 1100 },
      { type: 'plate', name: '装盘', duration: 2000, perfectWindow: 600 },
    ],
    baseScore: 120,
  },
  {
    id: 'fried_rice',
    name: '蛋炒饭',
    color: 0xffd700,
    ingredients: [
      INGREDIENTS.find(i => i.id === 'rice')!,
      INGREDIENTS.find(i => i.id === 'egg')!,
      INGREDIENTS.find(i => i.id === 'carrot')!,
    ],
    steps: [
      { type: 'prep', name: '配菜', duration: 2000, perfectWindow: 600 },
      { type: 'cook', name: '烹炒', duration: 3500, perfectWindow: 900 },
      { type: 'plate', name: '装盘', duration: 1500, perfectWindow: 500 },
    ],
    baseScore: 70,
  },
  {
    id: 'fish_tofu',
    name: '鱼香豆腐',
    color: 0xdda0dd,
    ingredients: [
      INGREDIENTS.find(i => i.id === 'tofu')!,
      INGREDIENTS.find(i => i.id === 'fish')!,
      INGREDIENTS.find(i => i.id === 'pepper')!,
    ],
    steps: [
      { type: 'prep', name: '配菜', duration: 3000, perfectWindow: 800 },
      { type: 'cook', name: '烹炒', duration: 4000, perfectWindow: 1000 },
      { type: 'plate', name: '装盘', duration: 2000, perfectWindow: 600 },
    ],
    baseScore: 90,
  },
  {
    id: 'shrimp_fried',
    name: '清炒虾仁',
    color: 0xffa07a,
    ingredients: [
      INGREDIENTS.find(i => i.id === 'shrimp')!,
      INGREDIENTS.find(i => i.id === 'onion')!,
    ],
    steps: [
      { type: 'prep', name: '配菜', duration: 2500, perfectWindow: 700 },
      { type: 'cook', name: '烹炒', duration: 3000, perfectWindow: 800 },
      { type: 'plate', name: '装盘', duration: 1800, perfectWindow: 550 },
    ],
    baseScore: 110,
  },
];

export const LEVELS: LevelConfig[] = [
  { level: 1, name: '新手入门', orderInterval: 12000, maxOrders: 3, timeMultiplier: 1.3, dishCount: [1, 1], stepsMultiplier: 1.0 },
  { level: 2, name: '初出茅庐', orderInterval: 10000, maxOrders: 4, timeMultiplier: 1.1, dishCount: [1, 2], stepsMultiplier: 1.0 },
  { level: 3, name: '小试牛刀', orderInterval: 8500, maxOrders: 5, timeMultiplier: 1.0, dishCount: [2, 2], stepsMultiplier: 1.0 },
  { level: 4, name: '渐入佳境', orderInterval: 7000, maxOrders: 5, timeMultiplier: 0.9, dishCount: [2, 3], stepsMultiplier: 1.1 },
  { level: 5, name: '炉火纯青', orderInterval: 6000, maxOrders: 6, timeMultiplier: 0.8, dishCount: [2, 3], stepsMultiplier: 1.2 },
  { level: 6, name: '厨神降临', orderInterval: 5000, maxOrders: 7, timeMultiplier: 0.7, dishCount: [3, 3], stepsMultiplier: 1.3 },
];

export const GAME_CONFIG = {
  initialSatisfaction: 80,
  satisfactionDecayPerSecond: 2,
  satisfactionOnCorrect: 8,
  satisfactionOnPerfect: 15,
  satisfactionOnWrong: -20,
  satisfactionOnTimeout: -25,
  satisfactionMin: 0,
  satisfactionMax: 100,
  gameOverSatisfaction: 0,
  scorePerPerfect: 1.5,
  scorePerGood: 1.0,
  scorePerOk: 0.5,
  comboBonus: 0.1,
  maxComboBonus: 2.0,
};
