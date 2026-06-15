import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Comment } from '@/types';
import { CURRENT_USER } from '../recipes/RecipeStore';

const FAV_KEY = 'family_recipes_favorites';
const COMMENTS_KEY = 'family_recipes_comments';

const loadFavorites = (): Set<string> => {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
};
const saveFavorites = (s: Set<string>) => {
  localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(s)));
};

const loadComments = (): Comment[] => {
  try {
    const raw = localStorage.getItem(COMMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const seed: Comment[] = [
    {
      id: 'c-seed-1',
      recipeId: 'seed-tomato-egg',
      userId: 'seed-user-a',
      userName: '吃货小美',
      userAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaomei&backgroundColor=b6e3f4',
      content: '我家每周都做！加一点点番茄酱更浓郁哦~ 🍅',
      parentId: null,
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: 'c-seed-2',
      recipeId: 'seed-tomato-egg',
      userId: 'seed-user-b',
      userName: '厨房小白',
      userAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=xiaobai&backgroundColor=c0aede',
      content: '谢谢分享，第一次做就成功了！超下饭的！',
      parentId: null,
      createdAt: Date.now() - 86400000 * 1,
    },
    {
      id: 'c-seed-3',
      recipeId: 'seed-tomato-egg',
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userAvatar: CURRENT_USER.avatar,
      content: '请问鸡蛋要炒到什么程度最好吃呀？🤔',
      parentId: 'c-seed-1',
      replyToUser: '吃货小美',
      replyToUserId: 'seed-user-a',
      createdAt: Date.now() - 3600000 * 8,
    },
    {
      id: 'c-seed-4',
      recipeId: 'seed-map-tofu',
      userId: 'seed-user-c',
      userName: '川菜爱好者',
      userAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=chuancai&backgroundColor=ffd5dc',
      content: '地道！豆豉也可以加一点，更香 🌶️',
      parentId: null,
      createdAt: Date.now() - 86400000 * 5,
    },
    {
      id: 'c-seed-5',
      recipeId: 'seed-braised-pork',
      userId: 'seed-user-d',
      userName: '肉食动物',
      userAvatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=meatlover&backgroundColor=ffdfbf',
      content: '入口即化！冰糖炒糖色那步一定要小火，否则会苦。',
      parentId: null,
      createdAt: Date.now() - 86400000 * 2,
    },
  ];
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(seed));
  return seed;
};
const saveComments = (list: Comment[]) => {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(list));
};

type SocketLike = {
  on: (evt: string, cb: (...args: unknown[]) => void) => void;
  emit: (evt: string, data: unknown) => void;
  disconnect: () => void;
};

class MockSocketServer {
  private listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  private delayMs = 300;

  connect(): SocketLike {
    const self = this;
    return {
      on(evt, cb) {
        if (!self.listeners.has(evt)) self.listeners.set(evt, new Set());
        self.listeners.get(evt)!.add(cb);
      },
      emit(evt, data) {
        setTimeout(() => {
          self.listeners.get(evt)?.forEach((cb) => cb(data));
        }, self.delayMs);
      },
      disconnect() {
        self.listeners.clear();
      },
    };
  }
}

const mockServer = new MockSocketServer();

interface PostStoreState {
  favorites: Set<string>;
  comments: Comment[];
  socket: SocketLike | null;
  init: () => void;
  disconnect: () => void;
  isFavorite: (recipeId: string) => boolean;
  toggleFavorite: (recipeId: string) => Promise<void>;
  getCommentsByRecipe: (recipeId: string) => Comment[];
  addComment: (data: {
    recipeId: string;
    content: string;
    parentId?: string | null;
    replyToUser?: string;
    replyToUserId?: string;
  }) => Promise<Comment>;
  deleteComment: (id: string) => void;
}

export const usePostStore = create<PostStoreState>((set, get) => ({
  favorites: new Set(),
  comments: [],
  socket: null,

  init: () => {
    const favs = loadFavorites();
    const cmts = loadComments();
    const socket = mockServer.connect();

    socket.on('comment:new', (data) => {
      const c = data as Comment;
      set((s) => {
        if (s.comments.some((x) => x.id === c.id)) return s;
        const updated = [...s.comments, c];
        saveComments(updated);
        return { comments: updated };
      });
    });

    socket.on('comment:delete', (data) => {
      const id = data as string;
      set((s) => {
        const updated = s.comments.filter((c) => c.id !== id && c.parentId !== id);
        saveComments(updated);
        return { comments: updated };
      });
    });

    set({ favorites: favs, comments: cmts, socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
  },

  isFavorite: (id) => get().favorites.has(id),

  toggleFavorite: async (id) => {
    set((s) => {
      const next = new Set(s.favorites);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveFavorites(next);
      return { favorites: next };
    });
  },

  getCommentsByRecipe: (recipeId) =>
    get()
      .comments.filter((c) => c.recipeId === recipeId)
      .sort((a, b) => a.createdAt - b.createdAt),

  addComment: async (data) => {
    const c: Comment = {
      id: uuidv4(),
      recipeId: data.recipeId,
      userId: CURRENT_USER.id,
      userName: CURRENT_USER.name,
      userAvatar: CURRENT_USER.avatar,
      content: data.content,
      parentId: data.parentId ?? null,
      replyToUser: data.replyToUser,
      replyToUserId: data.replyToUserId,
      createdAt: Date.now(),
    };
    set((s) => {
      const updated = [...s.comments, c];
      saveComments(updated);
      return { comments: updated };
    });
    get().socket?.emit('comment:new', c);
    return c;
  },

  deleteComment: (id) => {
    set((s) => {
      const updated = s.comments.filter((c) => c.id !== id && c.parentId !== id);
      saveComments(updated);
      return { comments: updated };
    });
    get().socket?.emit('comment:delete', id);
  },
}));
