import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, PantryItem, RecipeNote, RecipeWithMatch } from '@/types';

const SAMPLE_RECIPES: Recipe[] = [
  {
    id: 'sample-1',
    name: '经典巧克力蛋糕',
    category: '蛋糕',
    photoUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600',
    difficulty: 3,
    estimatedTime: 60,
    ingredients: [
      { name: '面粉', quantity: 200, unit: '克' },
      { name: '可可粉', quantity: 50, unit: '克' },
      { name: '鸡蛋', quantity: 3, unit: '个' },
      { name: '黄油', quantity: 100, unit: '克' },
      { name: '糖', quantity: 150, unit: '克' }
    ],
    steps: [
      '预热烤箱至180°C',
      '混合面粉和可可粉',
      '打发黄油和糖至蓬松',
      '逐个加入鸡蛋',
      '分次加入干粉混合物',
      '倒入模具烘烤40分钟'
    ],
    notes: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-2',
    name: '法式可颂',
    category: '面包',
    photoUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600',
    difficulty: 5,
    estimatedTime: 180,
    ingredients: [
      { name: '面粉', quantity: 300, unit: '克' },
      { name: '黄油', quantity: 200, unit: '克' },
      { name: '牛奶', quantity: 150, unit: '毫升' },
      { name: '酵母', quantity: 5, unit: '克' },
      { name: '盐', quantity: 5, unit: '克' },
      { name: '糖', quantity: 30, unit: '克' }
    ],
    steps: [
      '制作面团并冷藏',
      '裹入黄油进行折叠',
      '反复折叠3次',
      '擀开切割成三角形',
      '卷成可颂形状',
      '发酵后烘烤'
    ],
    notes: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-3',
    name: '香草曲奇',
    category: '饼干',
    photoUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600',
    difficulty: 2,
    estimatedTime: 45,
    ingredients: [
      { name: '面粉', quantity: 250, unit: '克' },
      { name: '黄油', quantity: 150, unit: '克' },
      { name: '糖', quantity: 100, unit: '克' },
      { name: '鸡蛋', quantity: 1, unit: '个' },
      { name: '香草精', quantity: 5, unit: '毫升' }
    ],
    steps: [
      '软化黄油加糖打发',
      '加入鸡蛋和香草精',
      '筛入面粉拌匀',
      '冷藏面团30分钟',
      '挤成花形或切片',
      '180°C烘烤12分钟'
    ],
    notes: [],
    createdAt: new Date().toISOString()
  }
];

const SAMPLE_PANTRY: PantryItem[] = [
  { id: 'pantry-1', name: '面粉', quantity: 500, unit: '克' },
  { id: 'pantry-2', name: '黄油', quantity: 300, unit: '克' },
  { id: 'pantry-3', name: '鸡蛋', quantity: 6, unit: '个' },
  { id: 'pantry-4', name: '糖', quantity: 400, unit: '克' },
  { id: 'pantry-5', name: '牛奶', quantity: 500, unit: '毫升' }
];

interface RecipeState {
  recipes: Recipe[];
  pantry: PantryItem[];
  initialized: boolean;
  init: () => Promise<void>;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'notes'>) => void;
  deleteRecipe: (id: string) => void;
  addPantryItem: (item: Omit<PantryItem, 'id'>) => void;
  updatePantryItem: (id: string, updates: Partial<PantryItem>) => void;
  deletePantryItem: (id: string) => void;
  addNote: (recipeId: string, content: string, rating: number) => void;
  deleteNote: (recipeId: string, noteId: string) => void;
  updateNote: (recipeId: string, noteId: string, updates: Partial<Pick<RecipeNote, 'content' | 'rating'>>) => void;
  getRecipesWithMatch: () => RecipeWithMatch[];
  getRecipeMatch: (recipeId: string) => { percentage: number; canMake: boolean };
  getAverageRating: (recipeId: string) => number;
}

const calculateMatch = (recipe: Recipe, pantry: PantryItem[]): { percentage: number; canMake: boolean } => {
  if (recipe.ingredients.length === 0) return { percentage: 0, canMake: false };
  let matched = 0;
  let canMakeAll = true;
  for (const ri of recipe.ingredients) {
    const pantryItem = pantry.find(p => p.name.toLowerCase() === ri.name.toLowerCase());
    if (pantryItem) {
      matched++;
      if (pantryItem.quantity < ri.quantity) {
        canMakeAll = false;
      }
    } else {
      canMakeAll = false;
    }
  }
  const percentage = Math.round((matched / recipe.ingredients.length) * 100);
  return { percentage, canMake: canMakeAll };
};

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  pantry: [],
  initialized: false,

  init: async () => {
    if (get().initialized) return;
    try {
      let recipes = await idbGet('bakemate_recipes') as Recipe[] | undefined;
      let pantry = await idbGet('bakemate_pantry') as PantryItem[] | undefined;
      if (!recipes || recipes.length === 0) {
        recipes = SAMPLE_RECIPES;
        await idbSet('bakemate_recipes', recipes);
      }
      if (!pantry || pantry.length === 0) {
        pantry = SAMPLE_PANTRY;
        await idbSet('bakemate_pantry', pantry);
      }
      set({ recipes, pantry, initialized: true });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ recipes: SAMPLE_RECIPES, pantry: SAMPLE_PANTRY, initialized: true });
    }
  },

  addRecipe: (recipeData) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: uuidv4(),
      notes: [],
      createdAt: new Date().toISOString()
    };
    set(state => {
      const recipes = [...state.recipes, newRecipe];
      idbSet('bakemate_recipes', recipes).catch(console.error);
      return { recipes };
    });
  },

  deleteRecipe: (id) => {
    set(state => {
      const recipes = state.recipes.filter(r => r.id !== id);
      idbSet('bakemate_recipes', recipes).catch(console.error);
      return { recipes };
    });
  },

  addPantryItem: (item) => {
    set(state => {
      const pantry = [...state.pantry, { ...item, id: uuidv4() }];
      idbSet('bakemate_pantry', pantry).catch(console.error);
      return { pantry };
    });
  },

  updatePantryItem: (id, updates) => {
    set(state => {
      const pantry = state.pantry.map(p => p.id === id ? { ...p, ...updates } : p);
      idbSet('bakemate_pantry', pantry).catch(console.error);
      return { pantry };
    });
  },

  deletePantryItem: (id) => {
    set(state => {
      const pantry = state.pantry.filter(p => p.id !== id);
      idbSet('bakemate_pantry', pantry).catch(console.error);
      return { pantry };
    });
  },

  addNote: (recipeId, content, rating) => {
    set(state => {
      const recipes = state.recipes.map(r => {
        if (r.id !== recipeId) return r;
        const newNote: RecipeNote = {
          id: uuidv4(),
          content,
          rating,
          createdAt: new Date().toISOString()
        };
        return { ...r, notes: [newNote, ...r.notes] };
      });
      idbSet('bakemate_recipes', recipes).catch(console.error);
      return { recipes };
    });
  },

  deleteNote: (recipeId, noteId) => {
    set(state => {
      const recipes = state.recipes.map(r => {
        if (r.id !== recipeId) return r;
        return { ...r, notes: r.notes.filter(n => n.id !== noteId) };
      });
      idbSet('bakemate_recipes', recipes).catch(console.error);
      return { recipes };
    });
  },

  updateNote: (recipeId, noteId, updates) => {
    set(state => {
      const recipes = state.recipes.map(r => {
        if (r.id !== recipeId) return r;
        return {
          ...r,
          notes: r.notes.map(n => n.id === noteId ? { ...n, ...updates } : n)
        };
      });
      idbSet('bakemate_recipes', recipes).catch(console.error);
      return { recipes };
    });
  },

  getRecipesWithMatch: () => {
    const { recipes, pantry } = get();
    return recipes
      .map(r => {
        const { percentage, canMake } = calculateMatch(r, pantry);
        return { ...r, matchPercentage: percentage, canMake };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage);
  },

  getRecipeMatch: (recipeId) => {
    const { recipes, pantry } = get();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return { percentage: 0, canMake: false };
    return calculateMatch(recipe, pantry);
  },

  getAverageRating: (recipeId) => {
    const recipe = get().recipes.find(r => r.id === recipeId);
    if (!recipe || recipe.notes.length === 0) return 0;
    const sum = recipe.notes.reduce((acc, n) => acc + n.rating, 0);
    return Math.round((sum / recipe.notes.length) * 10) / 10;
  }
}));
