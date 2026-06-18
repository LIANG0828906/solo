import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Recipe, Comment, UserProfile, Ingredient } from '../models/recipeTypes';

const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const initialRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    title: '番茄炒蛋',
    coverImage: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    description: '经典家常菜，酸甜可口，简单易做',
    ingredients: [
      { name: '番茄', quantity: '2个' },
      { name: '鸡蛋', quantity: '3个' },
      { name: '葱花', quantity: '适量' },
      { name: '盐', quantity: '少许' },
      { name: '白糖', quantity: '1勺' },
    ],
    steps: [
      { order: 1, content: '番茄切块，鸡蛋打散备用' },
      { order: 2, content: '热锅冷油，倒入蛋液炒至凝固盛出' },
      { order: 3, content: '锅中加油，放入番茄翻炒出汁' },
      { order: 4, content: '加入盐和白糖调味' },
      { order: 5, content: '倒入炒好的鸡蛋，翻炒均匀，撒上葱花出锅' },
    ],
    cookTime: 15,
    category: '家常菜',
    authorId: 'user-1',
    authorName: '美食家小王',
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'recipe-2',
    title: '红烧肉',
    coverImage: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
    description: '肥而不腻，入口即化的经典红烧肉',
    ingredients: [
      { name: '五花肉', quantity: '500g' },
      { name: '冰糖', quantity: '30g' },
      { name: '生抽', quantity: '2勺' },
      { name: '老抽', quantity: '1勺' },
      { name: '料酒', quantity: '2勺' },
      { name: '八角', quantity: '2个' },
      { name: '桂皮', quantity: '1小块' },
      { name: '姜', quantity: '3片' },
    ],
    steps: [
      { order: 1, content: '五花肉切块，冷水下锅焯水去血沫' },
      { order: 2, content: '锅中放少许油，加入冰糖小火炒出糖色' },
      { order: 3, content: '放入五花肉翻炒上色' },
      { order: 4, content: '加入生抽、老抽、料酒调味' },
      { order: 5, content: '加入八角、桂皮、姜片和适量开水，小火炖40分钟' },
      { order: 6, content: '大火收汁，出锅装盘' },
    ],
    cookTime: 60,
    category: '家常菜',
    authorId: 'user-1',
    authorName: '美食家小王',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'recipe-3',
    title: '日式咖喱饭',
    coverImage: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
    description: '浓郁醇厚的日式咖喱，搭配白米饭绝配',
    ingredients: [
      { name: '咖喱块', quantity: '1盒' },
      { name: '土豆', quantity: '2个' },
      { name: '胡萝卜', quantity: '1根' },
      { name: '洋葱', quantity: '半个' },
      { name: '鸡肉', quantity: '300g' },
      { name: '米饭', quantity: '2碗' },
    ],
    steps: [
      { order: 1, content: '土豆、胡萝卜切块，洋葱切丝，鸡肉切丁' },
      { order: 2, content: '锅中加油，放入洋葱炒香' },
      { order: 3, content: '加入鸡肉翻炒至变色' },
      { order: 4, content: '加入土豆和胡萝卜翻炒' },
      { order: 5, content: '加入适量水，小火煮20分钟' },
      { order: 6, content: '关火，加入咖喱块搅拌融化，再小火煮5分钟' },
      { order: 7, content: '盛出淋在米饭上即可' },
    ],
    cookTime: 40,
    category: '午餐',
    authorId: 'user-2',
    authorName: '料理达人小李',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 7,
  },
  {
    id: 'recipe-4',
    title: '法式吐司',
    coverImage: 'https://images.unsplash.com/photo-1484723091739-30909f22077b?w=800',
    description: '外酥里嫩的法式吐司，配上蜂蜜和水果，完美早餐',
    ingredients: [
      { name: '吐司面包', quantity: '4片' },
      { name: '鸡蛋', quantity: '2个' },
      { name: '牛奶', quantity: '100ml' },
      { name: '黄油', quantity: '20g' },
      { name: '蜂蜜', quantity: '适量' },
      { name: '水果', quantity: '适量' },
    ],
    steps: [
      { order: 1, content: '鸡蛋打散，加入牛奶搅拌均匀' },
      { order: 2, content: '将吐司片浸入蛋液中，两面均匀蘸满' },
      { order: 3, content: '平底锅小火融化黄油' },
      { order: 4, content: '放入吐司煎至两面金黄' },
      { order: 5, content: '装盘后淋上蜂蜜，搭配新鲜水果' },
    ],
    cookTime: 15,
    category: '早餐',
    authorId: 'user-2',
    authorName: '料理达人小李',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'recipe-5',
    title: '提拉米苏',
    coverImage: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800',
    description: '经典意式甜点，浓郁的咖啡与马斯卡彭芝士完美融合',
    ingredients: [
      { name: '马斯卡彭芝士', quantity: '250g' },
      { name: '手指饼干', quantity: '200g' },
      { name: '浓缩咖啡', quantity: '200ml' },
      { name: '蛋黄', quantity: '3个' },
      { name: '细砂糖', quantity: '75g' },
      { name: '可可粉', quantity: '适量' },
    ],
    steps: [
      { order: 1, content: '蛋黄加砂糖打发至颜色变浅' },
      { order: 2, content: '加入马斯卡彭芝士搅拌均匀' },
      { order: 3, content: '手指饼干快速蘸取咖啡液' },
      { order: 4, content: '容器底部铺一层蘸好咖啡的饼干' },
      { order: 5, content: '铺上一层芝士糊，重复叠放' },
      { order: 6, content: '冷藏4小时以上，食用前撒上可可粉' },
    ],
    cookTime: 30,
    category: '甜点',
    authorId: 'user-3',
    authorName: '烘焙爱好者小张',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'recipe-6',
    title: '清蒸鲈鱼',
    coverImage: 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=800',
    description: '鲜嫩滑口的清蒸鲈鱼，保留了鱼的原汁原味',
    ingredients: [
      { name: '鲈鱼', quantity: '1条' },
      { name: '姜丝', quantity: '适量' },
      { name: '葱丝', quantity: '适量' },
      { name: '蒸鱼豉油', quantity: '2勺' },
      { name: '料酒', quantity: '1勺' },
    ],
    steps: [
      { order: 1, content: '鲈鱼洗净，在鱼身两侧划几刀' },
      { order: 2, content: '抹上料酒和少许盐，腌制10分钟' },
      { order: 3, content: '鱼身铺上姜丝，放入蒸锅大火蒸8分钟' },
      { order: 4, content: '取出倒掉蒸出的汤汁，铺上葱丝' },
      { order: 5, content: '淋上蒸鱼豉油，浇上热油即可' },
    ],
    cookTime: 25,
    category: '晚餐',
    authorId: 'user-1',
    authorName: '美食家小王',
    createdAt: Date.now() - 86400000 * 6,
    updatedAt: Date.now() - 86400000 * 6,
  },
];

const initialComments: Comment[] = [
  {
    id: 'comment-1',
    recipeId: 'recipe-1',
    userId: 'user-2',
    userName: '料理达人小李',
    content: '按照这个方法做出来真的很好吃！番茄汁浓郁，鸡蛋嫩滑。',
    rating: 5,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'comment-2',
    recipeId: 'recipe-1',
    userId: 'user-3',
    userName: '烘焙爱好者小张',
    content: '简单好上手，新手也能做出美味！',
    rating: 4,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'comment-3',
    recipeId: 'recipe-2',
    userId: 'user-3',
    userName: '烘焙爱好者小张',
    content: '红烧肉入口即化，太香了！',
    rating: 5,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'comment-4',
    recipeId: 'recipe-5',
    userId: 'user-1',
    userName: '美食家小王',
    content: '甜度刚好，咖啡味很浓郁！',
    rating: 4,
    createdAt: Date.now() - 86400000 * 1,
  },
];

const initialFavorites: string[] = ['recipe-1'];

const initialUser: UserProfile = {
  id: 'user-1',
  name: '美食家小王',
};

export interface SearchFilters {
  keyword: string;
  category: string;
  minCookTime: number | null;
  maxCookTime: number | null;
}

interface RecipeState {
  recipes: Recipe[];
  comments: Comment[];
  favorites: string[];
  currentUser: UserProfile;
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, data: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  toggleFavorite: (recipeId: string) => void;
  addComment: (recipeId: string, comment: Omit<Comment, 'id' | 'recipeId' | 'userId' | 'userName' | 'createdAt'> & { userName?: string }) => void;
  getRecipeAverageRating: (recipeId: string) => number;
  searchRecipes: (keyword: string) => Recipe[];
  searchRecipesWithFilters: (filters: SearchFilters) => Recipe[];
  getAllCategories: () => string[];
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: initialRecipes,
      comments: initialComments,
      favorites: initialFavorites,
      currentUser: initialUser,

      addRecipe: (recipe) => {
        const now = Date.now();
        const newRecipe: Recipe = {
          ...recipe,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set({ recipes: [newRecipe, ...get().recipes] });
      },

      updateRecipe: (id, data) => {
        set({
          recipes: get().recipes.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: Date.now() } : r
          ),
        });
      },

      deleteRecipe: (id) => {
        set({
          recipes: get().recipes.filter((r) => r.id !== id),
          comments: get().comments.filter((c) => c.recipeId !== id),
          favorites: get().favorites.filter((rid) => rid !== id),
        });
      },

      toggleFavorite: (recipeId) => {
        const { favorites } = get();
        if (favorites.includes(recipeId)) {
          set({ favorites: favorites.filter((id) => id !== recipeId) });
        } else {
          set({ favorites: [...favorites, recipeId] });
        }
      },

      addComment: (recipeId, comment) => {
        const { currentUser } = get();
        const newComment: Comment = {
          id: generateId(),
          recipeId,
          userId: currentUser.id,
          userName: comment.userName || currentUser.name,
          content: comment.content,
          rating: comment.rating,
          createdAt: Date.now(),
        };
        set({ comments: [...get().comments, newComment] });
      },

      getRecipeAverageRating: (recipeId) => {
        const recipeComments = get().comments.filter((c) => c.recipeId === recipeId);
        if (recipeComments.length === 0) return 0;
        const total = recipeComments.reduce((sum, c) => sum + c.rating, 0);
        return total / recipeComments.length;
      },

      searchRecipes: (keyword) => {
        if (!keyword.trim()) return get().recipes;
        const kw = keyword.toLowerCase();
        return get().recipes.filter((r) => {
          if (r.title.toLowerCase().includes(kw)) return true;
          if (r.ingredients.some((i: Ingredient) => i.name.toLowerCase().includes(kw))) return true;
          return false;
        });
      },

      searchRecipesWithFilters: (filters: SearchFilters) => {
        const { recipes } = get();
        return recipes.filter((r) => {
          if (filters.keyword.trim()) {
            const kw = filters.keyword.toLowerCase();
            const matchesKeyword =
              r.title.toLowerCase().includes(kw) ||
              r.ingredients.some((i: Ingredient) => i.name.toLowerCase().includes(kw));
            if (!matchesKeyword) return false;
          }
          if (filters.category && r.category !== filters.category) {
            return false;
          }
          if (filters.minCookTime !== null && r.cookTime < filters.minCookTime) {
            return false;
          }
          if (filters.maxCookTime !== null && r.cookTime > filters.maxCookTime) {
            return false;
          }
          return true;
        });
      },

      getAllCategories: () => {
        const categories = new Set(get().recipes.map((r) => r.category));
        return Array.from(categories).sort();
      },
    }),
    {
      name: 'recipe-app-data',
    }
  )
);
