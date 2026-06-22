// ============================================================
// Zustand 全局状态管理
// 状态流动方向：API 层获取数据 -> Store 更新状态 -> 组件订阅状态渲染
// 调用关系：被各业务组件调用，同时调用 API 层方法获取数据
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Cloth, Outfit, User } from '@/types';

/**
 * 公开用户类型（不含密码）
 */
type PublicUser = Omit<User, 'password'>;

/**
 * Store 状态接口
 */
interface AppState {
  // 用户相关状态
  user: PublicUser | null;
  token: string | null;

  // 衣物相关状态
  clothes: Cloth[];

  // 搭配相关状态
  outfits: Outfit[];

  // 用户相关 actions
  setUser: (user: PublicUser | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;

  // 衣物相关 actions
  setClothes: (clothes: Cloth[]) => void;
  addCloth: (cloth: Cloth) => void;
  updateCloth: (id: string, data: Partial<Cloth>) => void;
  removeCloth: (id: string) => void;

  // 搭配相关 actions
  setOutfits: (outfits: Outfit[]) => void;
  addOutfit: (outfit: Outfit) => void;
  removeOutfit: (id: string) => void;
}

/**
 * 应用全局 Store
 * 使用 persist 中间件将 token 和 user 持久化到 localStorage
 * 状态流动：组件 dispatch action -> store 更新状态 -> 组件重新渲染
 */
export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // 初始状态
      user: null,
      token: null,
      clothes: [],
      outfits: [],

      // 用户相关 actions
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      logout: () => set({ user: null, token: null, clothes: [], outfits: [] }),

      // 衣物相关 actions
      setClothes: (clothes) => set({ clothes }),
      addCloth: (cloth) =>
        set((state) => ({
          clothes: [...state.clothes, cloth],
        })),
      updateCloth: (id, data) =>
        set((state) => ({
          clothes: state.clothes.map((c) =>
            c.id === id ? { ...c, ...data } : c
          ),
        })),
      removeCloth: (id) =>
        set((state) => ({
          clothes: state.clothes.filter((c) => c.id !== id),
        })),

      // 搭配相关 actions
      setOutfits: (outfits) => set({ outfits }),
      addOutfit: (outfit) =>
        set((state) => ({
          outfits: [...state.outfits, outfit],
        })),
      removeOutfit: (id) =>
        set((state) => ({
          outfits: state.outfits.filter((o) => o.id !== id),
        })),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
