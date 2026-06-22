import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { calculateRanking, RankResult } from './utils/rankCalculator';

export type Priority = 'high' | 'medium' | 'low';

export interface Wish {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  priority: Priority;
  createdAt: string;
  isOwn: boolean;
  favorites: number;
  comments: number;
  progress: number;
  order: number;
}

interface WishState {
  wishes: Wish[];
  favoriteIds: string[];
  ranking: RankResult[];
  lastRankingUpdate: number;
  
  addWish: (wish: Omit<Wish, 'id' | 'createdAt' | 'isOwn' | 'favorites' | 'comments' | 'progress' | 'order'>) => void;
  deleteWish: (id: string) => void;
  updateWish: (id: string, updates: Partial<Wish>) => void;
  reorderWishes: (startIndex: number, endIndex: number) => void;
  
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  
  updateRanking: () => void;
  getMyWishes: () => Wish[];
  getCommunityWishes: () => Wish[];
}

const addDays = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const seedWishes = (): Wish[] => [
  {
    id: uuidv4(),
    title: '学习React高级技巧',
    description: '深入理解React Hooks原理，掌握性能优化技巧，完成3个实战项目。',
    targetDate: addDays(30),
    priority: 'high',
    createdAt: new Date().toISOString(),
    isOwn: true,
    favorites: 24,
    comments: 8,
    progress: 65,
    order: 0
  },
  {
    id: uuidv4(),
    title: '读完5本技术书籍',
    description: '包括《代码整洁之道》、《设计模式》等经典书籍，每本写读书笔记。',
    targetDate: addDays(60),
    priority: 'medium',
    createdAt: new Date().toISOString(),
    isOwn: true,
    favorites: 15,
    comments: 5,
    progress: 40,
    order: 1
  },
  {
    id: uuidv4(),
    title: '每周健身3次',
    description: '保持身体健康，增肌减脂，体脂率降到15%以下。',
    targetDate: addDays(90),
    priority: 'low',
    createdAt: new Date().toISOString(),
    isOwn: true,
    favorites: 18,
    comments: 12,
    progress: 30,
    order: 2
  },
  {
    id: uuidv4(),
    title: '独立开发一个小程序',
    description: '使用Taro框架开发一款实用的工具类小程序，上线并获取1000用户。',
    targetDate: addDays(45),
    priority: 'high',
    createdAt: new Date().toISOString(),
    isOwn: false,
    favorites: 56,
    comments: 23,
    progress: 50,
    order: 0
  },
  {
    id: uuidv4(),
    title: '学会弹吉他',
    description: '掌握基础和弦，能够弹奏5首完整的流行歌曲。',
    targetDate: addDays(120),
    priority: 'medium',
    createdAt: new Date().toISOString(),
    isOwn: false,
    favorites: 42,
    comments: 15,
    progress: 20,
    order: 1
  },
  {
    id: uuidv4(),
    title: '环球旅行计划',
    description: '攒够旅行基金，规划10个国家的旅行路线，开启环球之旅。',
    targetDate: addDays(365),
    priority: 'low',
    createdAt: new Date().toISOString(),
    isOwn: false,
    favorites: 89,
    comments: 34,
    progress: 15,
    order: 2
  },
  {
    id: uuidv4(),
    title: '考取PMP证书',
    description: '系统学习项目管理知识，通过PMP认证考试。',
    targetDate: addDays(75),
    priority: 'high',
    createdAt: new Date().toISOString(),
    isOwn: false,
    favorites: 33,
    comments: 11,
    progress: 55,
    order: 3
  },
  {
    id: uuidv4(),
    title: '学习UI设计',
    description: '掌握Figma工具，学习设计理论，能独立完成App界面设计。',
    targetDate: addDays(50),
    priority: 'medium',
    createdAt: new Date().toISOString(),
    isOwn: false,
    favorites: 27,
    comments: 9,
    progress: 45,
    order: 4
  }
];

export const useWishStore = create<WishState>()(
  persist(
    (set, get) => ({
      wishes: seedWishes(),
      favoriteIds: [],
      ranking: [],
      lastRankingUpdate: 0,

      addWish: (wishData) => {
        const newWish: Wish = {
          ...wishData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          isOwn: true,
          favorites: 0,
          comments: 0,
          progress: 0,
          order: get().getMyWishes().length
        };
        set((state) => ({
          wishes: [...state.wishes, newWish]
        }));
      },

      deleteWish: (id) => {
        set((state) => ({
          wishes: state.wishes.filter((w) => w.id !== id),
          favoriteIds: state.favoriteIds.filter((fid) => fid !== id)
        }));
      },

      updateWish: (id, updates) => {
        set((state) => ({
          wishes: state.wishes.map((w) =>
            w.id === id ? { ...w, ...updates } : w
          )
        }));
      },

      reorderWishes: (startIndex, endIndex) => {
        set((state) => {
          const myWishes = [...state.getMyWishes()].sort((a, b) => a.order - b.order);
          const [removed] = myWishes.splice(startIndex, 1);
          myWishes.splice(endIndex, 0, removed);
          
          const updatedMyWishes = myWishes.map((w, idx) => ({ ...w, order: idx }));
          const myWishIds = new Set(updatedMyWishes.map((w) => w.id));
          
          const otherWishes = state.wishes.filter((w) => !myWishIds.has(w.id));
          
          return {
            wishes: [...otherWishes, ...updatedMyWishes]
          };
        });
      },

      toggleFavorite: (id) => {
        const isFav = get().isFavorite(id);
        set((state) => ({
          favoriteIds: isFav
            ? state.favoriteIds.filter((fid) => fid !== id)
            : [...state.favoriteIds, id],
          wishes: state.wishes.map((w) =>
            w.id === id
              ? { ...w, favorites: w.favorites + (isFav ? -1 : 1) }
              : w
          )
        }));
      },

      isFavorite: (id) => {
        return get().favoriteIds.includes(id);
      },

      updateRanking: () => {
        const rankItems = get().wishes.map((w) => ({
          id: w.id,
          favorites: w.favorites,
          comments: w.comments
        }));
        const ranking = calculateRanking(rankItems, 20);
        set({
          ranking,
          lastRankingUpdate: Date.now()
        });
      },

      getMyWishes: () => {
        return get().wishes
          .filter((w) => w.isOwn)
          .sort((a, b) => a.order - b.order);
      },

      getCommunityWishes: () => {
        return get().wishes.filter((w) => !w.isOwn);
      }
    }),
    {
      name: 'wishwall-storage'
    }
  )
);
