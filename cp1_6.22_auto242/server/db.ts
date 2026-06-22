import { v4 as uuidv4 } from 'uuid';
import type { Ingredient, Recipe, TestingRecord, RecipeVersion } from '../src/types';

let ingredients: Ingredient[] = [
  {
    id: uuidv4(),
    name: '玫瑰精油',
    brand: 'Firmenich',
    type: '天然精油',
    family: '花香',
    stock: 25,
    unit: 'ml',
    cost: 1280,
    supplier: '芬美意中国',
  },
  {
    id: uuidv4(),
    name: '檀香',
    brand: 'Givaudan',
    type: '合成香料',
    family: '木质',
    stock: 100,
    unit: 'ml',
    cost: 450,
    supplier: '奇华顿',
  },
  {
    id: uuidv4(),
    name: '香草',
    brand: 'Symrise',
    type: '天然提取物',
    family: '东方',
    stock: 8,
    unit: 'ml',
    cost: 320,
    supplier: '德之馨',
  },
  {
    id: uuidv4(),
    name: '麝香',
    brand: 'IFF',
    type: '合成香料',
    family: '麝香',
    stock: 0,
    unit: 'ml',
    cost: 560,
    supplier: '国际香料',
  },
  {
    id: uuidv4(),
    name: '佛手柑',
    brand: 'Robertet',
    type: '天然精油',
    family: '柑橘',
    stock: 150,
    unit: 'ml',
    cost: 180,
    supplier: 'Robertet',
  },
  {
    id: uuidv4(),
    name: '广藿香',
    brand: 'Firmenich',
    type: '天然精油',
    family: '木质',
    stock: 45,
    unit: 'ml',
    cost: 220,
    supplier: '芬美意中国',
  },
  {
    id: uuidv4(),
    name: '薰衣草',
    brand: 'Symrise',
    type: '天然精油',
    family: '草本',
    stock: 80,
    unit: 'ml',
    cost: 150,
    supplier: '德之馨',
  },
  {
    id: uuidv4(),
    name: '茉莉',
    brand: 'Givaudan',
    type: '天然精油',
    family: '花香',
    stock: 15,
    unit: 'ml',
    cost: 980,
    supplier: '奇华顿',
  },
  {
    id: uuidv4(),
    name: '肉桂',
    brand: 'IFF',
    type: '天然精油',
    family: '辛香',
    stock: 60,
    unit: 'ml',
    cost: 280,
    supplier: '国际香料',
  },
  {
    id: uuidv4(),
    name: '柠檬',
    brand: 'Robertet',
    type: '天然精油',
    family: '柑橘',
    stock: 200,
    unit: 'ml',
    cost: 95,
    supplier: 'Robertet',
  },
  {
    id: uuidv4(),
    name: '雪松',
    brand: 'Firmenich',
    type: '天然精油',
    family: '木质',
    stock: 120,
    unit: 'ml',
    cost: 160,
    supplier: '芬美意中国',
  },
  {
    id: uuidv4(),
    name: '白麝香',
    brand: 'Givaudan',
    type: '合成香料',
    family: '麝香',
    stock: 5,
    unit: 'ml',
    cost: 720,
    supplier: '奇华顿',
  },
  {
    id: uuidv4(),
    name: '依兰',
    brand: 'Symrise',
    type: '天然精油',
    family: '花香',
    stock: 35,
    unit: 'ml',
    cost: 340,
    supplier: '德之馨',
  },
  {
    id: uuidv4(),
    name: '薄荷',
    brand: 'IFF',
    type: '天然精油',
    family: '草本',
    stock: 90,
    unit: 'ml',
    cost: 120,
    supplier: '国际香料',
  },
  {
    id: uuidv4(),
    name: '琥珀',
    brand: 'Firmenich',
    type: '合成香料',
    family: '东方',
    stock: 50,
    unit: 'ml',
    cost: 380,
    supplier: '芬美意中国',
  },
];

let recipes: Recipe[] = [];
let testings: TestingRecord[] = [];

const initialRecipeId1 = uuidv4();
const initialRecipeId2 = uuidv4();

const version1: RecipeVersion = {
  id: uuidv4(),
  timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  note: '初始版本',
  ingredients: [
    { ingredientId: ingredients[0].id, percentage: 15 },
    { ingredientId: ingredients[1].id, percentage: 20 },
    { ingredientId: ingredients[4].id, percentage: 25 },
    { ingredientId: ingredients[6].id, percentage: 20 },
    { ingredientId: ingredients[3].id, percentage: 20 },
  ],
};

const version2: RecipeVersion = {
  id: uuidv4(),
  timestamp: new Date(Date.now() - 86400000).toISOString(),
  note: '增加玫瑰比例',
  ingredients: [
    { ingredientId: ingredients[0].id, percentage: 25 },
    { ingredientId: ingredients[1].id, percentage: 15 },
    { ingredientId: ingredients[4].id, percentage: 20 },
    { ingredientId: ingredients[6].id, percentage: 20 },
    { ingredientId: ingredients[3].id, percentage: 20 },
  ],
};

recipes = [
  {
    id: initialRecipeId1,
    name: '晨露玫瑰',
    targetNote: '花香',
    description: '清新优雅的玫瑰花香调，适合日常使用',
    ingredients: [
      { ingredientId: ingredients[0].id, percentage: 25 },
      { ingredientId: ingredients[1].id, percentage: 15 },
      { ingredientId: ingredients[4].id, percentage: 20 },
      { ingredientId: ingredients[6].id, percentage: 20 },
      { ingredientId: ingredients[3].id, percentage: 20 },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    versions: [version1, version2],
  },
  {
    id: initialRecipeId2,
    name: '东方迷梦',
    targetNote: '东方',
    description: '温暖神秘的东方调，香草与琥珀的完美融合',
    ingredients: [
      { ingredientId: ingredients[2].id, percentage: 30 },
      { ingredientId: ingredients[14].id, percentage: 25 },
      { ingredientId: ingredients[1].id, percentage: 20 },
      { ingredientId: ingredients[5].id, percentage: 15 },
      { ingredientId: ingredients[11].id, percentage: 10 },
    ],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    versions: [
      {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 86400000 * 10).toISOString(),
        note: '初始配方',
        ingredients: [
          { ingredientId: ingredients[2].id, percentage: 25 },
          { ingredientId: ingredients[14].id, percentage: 30 },
          { ingredientId: ingredients[1].id, percentage: 25 },
          { ingredientId: ingredients[5].id, percentage: 20 },
        ],
      },
      {
        id: uuidv4(),
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        note: '添加白麝香',
        ingredients: [
          { ingredientId: ingredients[2].id, percentage: 30 },
          { ingredientId: ingredients[14].id, percentage: 25 },
          { ingredientId: ingredients[1].id, percentage: 20 },
          { ingredientId: ingredients[5].id, percentage: 15 },
          { ingredientId: ingredients[11].id, percentage: 10 },
        ],
      },
    ],
  },
];

testings = [
  {
    id: uuidv4(),
    recipeId: initialRecipeId1,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    duration: '30分钟',
    rating: 4,
    longevity: '6-8小时',
    evolution: '前调佛手柑清新明亮，中调玫瑰花香逐渐绽放，后调檀香与麝香温和收尾。整体平衡性良好，但玫瑰的层次感可以再丰富一些。',
  },
  {
    id: uuidv4(),
    recipeId: initialRecipeId2,
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    duration: '1小时',
    rating: 5,
    longevity: '10小时以上',
    evolution: '开篇是温暖的香草甜味，随后琥珀的温润感慢慢浮现，广藿香的泥土气息在中后调逐渐展现。非常有深度的东方调，留香持久。',
  },
];

export const db = {
  getIngredients: (): Ingredient[] => [...ingredients],
  
  getIngredientById: (id: string): Ingredient | undefined => 
    ingredients.find(i => i.id === id),
  
  addIngredient: (data: Omit<Ingredient, 'id'>): Ingredient => {
    const newIngredient = { ...data, id: uuidv4() };
    ingredients.push(newIngredient);
    return newIngredient;
  },
  
  updateIngredient: (id: string, data: Partial<Ingredient>): Ingredient | undefined => {
    const index = ingredients.findIndex(i => i.id === id);
    if (index === -1) return undefined;
    ingredients[index] = { ...ingredients[index], ...data };
    return ingredients[index];
  },
  
  deleteIngredient: (id: string): boolean => {
    const index = ingredients.findIndex(i => i.id === id);
    if (index === -1) return false;
    ingredients.splice(index, 1);
    return true;
  },
  
  getRecipes: (): Recipe[] => [...recipes],
  
  getRecipeById: (id: string): Recipe | undefined => 
    recipes.find(r => r.id === id),
  
  addRecipe: (data: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'versions'>): Recipe => {
    const now = new Date().toISOString();
    const newRecipe: Recipe = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      versions: [{
        id: uuidv4(),
        timestamp: now,
        note: '初始版本',
        ingredients: [...data.ingredients],
      }],
    };
    recipes.push(newRecipe);
    return newRecipe;
  },
  
  updateRecipe: (id: string, data: Partial<Recipe>, versionNote?: string): Recipe | undefined => {
    const index = recipes.findIndex(r => r.id === id);
    if (index === -1) return undefined;
    
    const now = new Date().toISOString();
    const newVersion: RecipeVersion = {
      id: uuidv4(),
      timestamp: now,
      note: versionNote || '更新配方',
      ingredients: data.ingredients ? [...data.ingredients] : [...recipes[index].ingredients],
    };
    
    recipes[index] = {
      ...recipes[index],
      ...data,
      updatedAt: now,
      versions: [...recipes[index].versions, newVersion],
    };
    return recipes[index];
  },
  
  getRecipeVersions: (recipeId: string): RecipeVersion[] | undefined => {
    const recipe = recipes.find(r => r.id === recipeId);
    return recipe ? [...recipe.versions] : undefined;
  },
  
  rollbackRecipe: (recipeId: string, versionId: string): Recipe | undefined => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return undefined;
    
    const version = recipe.versions.find(v => v.id === versionId);
    if (!version) return undefined;
    
    const index = recipes.findIndex(r => r.id === recipeId);
    const now = new Date().toISOString();
    
    recipes[index] = {
      ...recipes[index],
      ingredients: [...version.ingredients],
      updatedAt: now,
      versions: [
        ...recipes[index].versions,
        {
          id: uuidv4(),
          timestamp: now,
          note: `回滚至版本: ${version.note}`,
          ingredients: [...version.ingredients],
        },
      ],
    };
    
    return recipes[index];
  },
  
  getTestings: (): TestingRecord[] => [...testings],
  
  getTestingsByRecipeId: (recipeId: string): TestingRecord[] =>
    testings.filter(t => t.recipeId === recipeId),
  
  addTesting: (data: Omit<TestingRecord, 'id'>): TestingRecord => {
    const newTesting = { ...data, id: uuidv4() };
    testings.push(newTesting);
    return newTesting;
  },
};
