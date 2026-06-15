import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { io, type Socket } from 'socket.io-client';
import type { Comment } from '@/types';
import { CURRENT_USER } from '../recipes/RecipeStore';

const FAV_KEY = 'family_recipes_favorites';
const COMMENTS_KEY = 'family_recipes_comments';
const SOCKET_URL =
  (import.meta.env.VITE_SOCKET_URL as string) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error'
  | 'degraded-fallback';

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

interface FallbackChannel {
  on: (evt: string, cb: (...args: unknown[]) => void) => void;
  emit: (evt: string, data: unknown) => void;
  disconnect: () => void;
}

const createFallbackChannel = (): FallbackChannel => {
  const CH_NAME = 'family-recipes-comments-fallback';
  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CH_NAME);
  } catch {
    channel = null;
  }

  type Listener = (...args: unknown[]) => void;
  const listeners = new Map<string, Set<Listener>>();

  const storageHandler = (e: StorageEvent) => {
    if (e.key !== COMMENTS_KEY || !e.newValue) return;
    try {
      const next: Comment[] = JSON.parse(e.newValue);
      const prev: Comment[] = e.oldValue ? JSON.parse(e.oldValue) : [];
      const prevIds = new Set(prev.map((c) => c.id));
      const added = next.filter((c) => !prevIds.has(c.id));
      const removedIds = new Set(prev.map((c) => c.id));
      const removed = prev.filter((c) => !next.find((n) => n.id === c.id));
      added.forEach((c) => {
        listeners.get('comment:new')?.forEach((cb) => cb(c));
      });
      removed.forEach((c) => {
        listeners.get('comment:delete')?.forEach((cb) => cb(c.id));
        next.filter((x) => x.parentId === c.id).forEach((x) => {
          if (!removedIds.has(x.id)) {
            listeners.get('comment:delete')?.forEach((cb) => cb(x.id));
          }
        });
      });
    } catch {}
  };
  window.addEventListener('storage', storageHandler);

  if (channel) {
    channel.onmessage = (e) => {
      const { event, data } = e.data || {};
      if (event) listeners.get(event)?.forEach((cb) => cb(data));
    };
  }

  return {
    on(evt, cb) {
      if (!listeners.has(evt)) listeners.set(evt, new Set());
      listeners.get(evt)!.add(cb as Listener);
    },
    emit(evt, data) {
      setTimeout(() => {
        listeners.get(evt)?.forEach((cb) => cb(data));
      }, 150);
      try {
        channel?.postMessage({ event: evt, data, _from: uuidv4() });
      } catch {}
    },
    disconnect() {
      window.removeEventListener('storage', storageHandler);
      channel?.close();
      listeners.clear();
    },
  };
};

const connectRealSocket = (): Promise<Socket> =>
  new Promise((resolve, reject) => {
    console.info(`[PostStore] 尝试连接 Socket.io 服务器: ${SOCKET_URL}`);
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      timeout: 4000,
      autoConnect: true,
    });
    let resolved = false;
    const failTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('连接超时'));
        socket.close();
      }
    }, 5000);

    socket.once('connect', () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(failTimer);
      console.info(`[PostStore] Socket.io 连接成功，id=${socket.id}`);
      resolve(socket);
    });
    socket.once('connect_error', (err) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(failTimer);
      socket.close();
      reject(err);
    });
  });

interface PostStoreState {
  favorites: Set<string>;
  comments: Comment[];
  socket: Socket | FallbackChannel | null;
  connectionStatus: ConnectionStatus;
  connectionError: string | null;
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
  connectionStatus: 'disconnected',
  connectionError: null,

  init: () => {
    const favs = loadFavorites();
    const cmts = loadComments();
    set({
      favorites: favs,
      comments: cmts,
      connectionStatus: 'connecting',
      connectionError: null,
    });

    const attachListeners = (
      s: Socket | FallbackChannel,
    ) => {
      s.on('comment:new', (data) => {
        const c = data as Comment;
        set((state) => {
          if (state.comments.some((x) => x.id === c.id)) return state;
          const updated = [...state.comments, c];
          saveComments(updated);
          return { comments: updated };
        });
      });

      s.on('comment:delete', (data) => {
        const id = data as string;
        set((state) => {
          const updated = state.comments.filter(
            (c) => c.id !== id && c.parentId !== id,
          );
          saveComments(updated);
          return { comments: updated };
        });
      });
    };

    connectRealSocket()
      .then((socket) => {
        attachListeners(socket);
        socket.on('disconnect', () => {
          set({ connectionStatus: 'disconnected' });
        });
        socket.on('connect', () => {
          set({ connectionStatus: 'connected', connectionError: null });
        });
        socket.on('connect_error', (err) => {
          set({ connectionStatus: 'error', connectionError: err.message });
        });
        set({ socket, connectionStatus: 'connected', connectionError: null });
      })
      .catch((err) => {
        console.warn(
          `[PostStore] Socket.io 连接失败（${err.message}），降级为 BroadcastChannel + localStorage 模式`,
        );
        const fallback = createFallbackChannel();
        attachListeners(fallback);
        set({
          socket: fallback,
          connectionStatus: 'degraded-fallback',
          connectionError: `服务器不可达：${err.message}。当前使用同设备多标签页同步模式。`,
        });
      });
  },

  disconnect: () => {
    const s = get().socket;
    if (!s) return;
    if ('close' in s && typeof s.close === 'function') {
      (s as Socket).close();
    } else {
      s.disconnect();
    }
    set({ socket: null, connectionStatus: 'disconnected' });
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
    const s = get().socket;
    try {
      if (s && 'emitWithAck' in s && typeof (s as Socket).emitWithAck === 'function') {
        await (s as Socket).emitWithAck('comment:new', c).catch(() => s.emit('comment:new', c));
      } else {
        s?.emit('comment:new', c);
      }
    } catch {
      s?.emit('comment:new', c);
    }
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

export { SOCKET_URL };
