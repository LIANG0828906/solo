import { create } from 'zustand';
import { formatISO } from 'date-fns';
import * as db from '../utils/db';
import { md5 } from '../utils/hash';
import { generateGradientFromHash } from '../utils/colorGenerator';
import { recipeManager } from '../module1/recipeManager';
import { socialFeed } from '../module2/socialFeed';
import { commentSystem } from '../module2/commentSystem';
import type {
  User,
  Recipe,
  Activity,
  RecipeCreateData,
  RecipeUpdateData,
  Comment,
} from '../types';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  message: string;
  type: ToastType;
}

interface UiControllerState {
  currentUser: User | null;
  recipes: Recipe[];
  loading: boolean;
  searchKeyword: string;
  toast: Toast | null;
  activities: Activity[];
  userRecipes: Recipe[];
  userFavorites: Recipe[];

  initUser: () => Promise<void>;
  setCurrentUser: (user: User) => void;
  setSearchKeyword: (keyword: string) => void;
  loadRecipes: () => Promise<void>;
  loadActivities: () => Promise<void>;
  searchRecipes: (keyword: string) => Promise<void>;
  createRecipe: (data: RecipeCreateData) => Promise<Recipe>;
  updateRecipe: (id: string, data: RecipeUpdateData) => Promise<Recipe>;
  deleteRecipe: (id: string) => Promise<void>;
  toggleFavorite: (recipeId: string) => Promise<boolean>;
  rateRecipe: (recipeId: string, rating: number) => Promise<void>;
  addComment: (recipeId: string, content: string) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<boolean>;
  loadUserProfile: (userId: string) => Promise<void>;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

const DEFAULT_USER_ID = 'default-user';

function getCurrentTimestamp(): string {
  return formatISO(new Date());
}

export const useUiController = create<UiControllerState>((set, get) => ({
  currentUser: null,
  recipes: [],
  loading: false,
  searchKeyword: '',
  toast: null,
  activities: [],
  userRecipes: [],
  userFavorites: [],

  initUser: async () => {
    try {
      set({ loading: true });
      let user = await db.get<User>('users', DEFAULT_USER_ID);

      if (!user) {
        const hash = md5(DEFAULT_USER_ID);
        const gradient = generateGradientFromHash(hash);
        user = {
          id: DEFAULT_USER_ID,
          nickname: '美食家',
          avatar: '',
          avatarColor: gradient.start,
          createdAt: getCurrentTimestamp(),
        };
        await db.add('users', user);
      }

      set({ currentUser: user });
    } catch (error) {
      console.error('Failed to init user:', error);
      get().showToast('初始化用户失败', 'error');
    } finally {
      set({ loading: false });
    }
  },

  setCurrentUser: (user: User) => {
    set({ currentUser: user });
  },

  setSearchKeyword: (keyword: string) => {
    set({ searchKeyword: keyword });
  },

  loadRecipes: async () => {
    try {
      set({ loading: true });
      const recipes = await recipeManager.getAllRecipes();
      set({ recipes });
    } catch (error) {
      console.error('Failed to load recipes:', error);
      get().showToast('加载食谱失败', 'error');
    } finally {
      set({ loading: false });
    }
  },

  loadActivities: async () => {
    try {
      set({ loading: true });
      const activities = await socialFeed.getActivities();
      set({ activities });
    } catch (error) {
      console.error('Failed to load activities:', error);
      get().showToast('加载动态失败', 'error');
    } finally {
      set({ loading: false });
    }
  },

  searchRecipes: async (keyword: string) => {
    try {
      set({ loading: true, searchKeyword: keyword });
      const recipes = await recipeManager.searchRecipes(keyword);
      set({ recipes });
    } catch (error) {
      console.error('Failed to search recipes:', error);
      get().showToast('搜索食谱失败', 'error');
    } finally {
      set({ loading: false });
    }
  },

  createRecipe: async (data: RecipeCreateData) => {
    try {
      set({ loading: true });
      const recipe = await recipeManager.createRecipe(data);

      const { currentUser } = get();
      if (currentUser) {
        await socialFeed.addActivity('create', currentUser.id, currentUser.nickname, recipe.id, recipe.title);
      }

      await get().loadRecipes();
      get().showToast('食谱创建成功', 'success');
      return recipe;
    } catch (error) {
      console.error('Failed to create recipe:', error);
      get().showToast('创建食谱失败', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateRecipe: async (id: string, data: RecipeUpdateData) => {
    try {
      set({ loading: true });
      const recipe = await recipeManager.updateRecipe(id, data);
      await get().loadRecipes();
      get().showToast('食谱更新成功', 'success');
      return recipe;
    } catch (error) {
      console.error('Failed to update recipe:', error);
      get().showToast('更新食谱失败', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteRecipe: async (id: string) => {
    try {
      set({ loading: true });
      await recipeManager.deleteRecipe(id);
      await get().loadRecipes();
      get().showToast('食谱删除成功', 'success');
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      get().showToast('删除食谱失败', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  toggleFavorite: async (recipeId: string) => {
    try {
      set({ loading: true });
      const { currentUser } = get();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const recipe = await recipeManager.getRecipe(recipeId);
      if (!recipe) {
        throw new Error('食谱不存在');
      }

      const result = await recipeManager.toggleFavorite(currentUser.id, recipeId);

      if (result.isFavorited) {
        await socialFeed.addActivity('favorite', currentUser.id, currentUser.nickname, recipe.id, recipe.title);
        get().showToast('已收藏', 'success');
      } else {
        get().showToast('已取消收藏', 'info');
      }

      await get().loadUserProfile(currentUser.id);
      return result.isFavorited;
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      get().showToast('操作失败', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  rateRecipe: async (recipeId: string, rating: number) => {
    try {
      set({ loading: true });
      const { currentUser } = get();
      await recipeManager.rateRecipe(recipeId, rating, currentUser?.id);
      await get().loadRecipes();
      get().showToast('评分成功', 'success');
    } catch (error) {
      console.error('Failed to rate recipe:', error);
      get().showToast('评分失败', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  addComment: async (recipeId: string, content: string) => {
    try {
      set({ loading: true });
      const { currentUser, recipes } = get();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const recipe = recipes.find(r => r.id === recipeId);
      if (!recipe) {
        throw new Error('食谱不存在');
      }

      const comment = await commentSystem.addComment(recipeId, currentUser.id, currentUser.nickname, currentUser.avatarColor, content);
      await socialFeed.addActivity('comment', currentUser.id, currentUser.nickname, recipe.id, recipe.title, content);
      get().showToast('评论成功', 'success');
      return comment;
    } catch (error) {
      console.error('Failed to add comment:', error);
      get().showToast('评论失败', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteComment: async (commentId: string) => {
    try {
      set({ loading: true });
      const { currentUser } = get();
      if (!currentUser) {
        throw new Error('用户未登录');
      }

      const result = await commentSystem.deleteComment(commentId, currentUser.id);
      if (result) {
        get().showToast('评论删除成功', 'success');
      }
      return result;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      get().showToast('删除评论失败', 'error');
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadUserProfile: async (userId: string) => {
    try {
      set({ loading: true });
      const [userRecipes, userFavorites] = await Promise.all([
        recipeManager.getRecipesByAuthor(userId),
        recipeManager.getFavoritesByUser(userId),
      ]);
      set({ userRecipes, userFavorites });
    } catch (error) {
      console.error('Failed to load user profile:', error);
      get().showToast('加载用户资料失败', 'error');
    } finally {
      set({ loading: false });
    }
  },

  showToast: (message: string, type: ToastType = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      get().hideToast();
    }, 3000);
  },

  hideToast: () => {
    set({ toast: null });
  },
}));
