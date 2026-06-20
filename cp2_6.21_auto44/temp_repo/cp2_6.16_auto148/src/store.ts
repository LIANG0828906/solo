import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import type { Exhibition, Work, Review, Favorite, DailyStat, ToastMessage } from '@/types';

interface AppState {
  exhibitions: Exhibition[];
  works: Work[];
  reviews: Review[];
  favorites: Favorite[];
  dailyStats: DailyStat[];
  toasts: ToastMessage[];
  currentRole: 'curator' | 'artist' | 'viewer';
  initialized: boolean;

  loadFromDB: () => Promise<void>;
  addExhibition: (data: Omit<Exhibition, 'id' | 'createdAt' | 'visitCount'>) => void;
  addWork: (data: Omit<Work, 'id' | 'createdAt' | 'status'>) => void;
  approveWork: (workId: string) => void;
  rejectWork: (workId: string, reason: string) => void;
  toggleFavorite: (workId: string) => void;
  addReview: (data: Omit<Review, 'id' | 'createdAt'>) => void;
  incrementVisit: (exhibitionId: string) => void;
  setRole: (role: 'curator' | 'artist' | 'viewer') => void;
  showToast: (text: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  getWorksByExhibition: (exhibitionId: string) => Work[];
  getApprovedWorksByExhibition: (exhibitionId: string) => Work[];
  getPendingWorksByExhibition: (exhibitionId: string) => Work[];
  getReviewsByWork: (workId: string) => Review[];
  isFavorite: (workId: string) => boolean;
  getFavoriteCount: (workId: string) => number;
  getDailyStatsByExhibition: (exhibitionId: string) => DailyStat[];
  getExhibitionStats: (exhibitionId: string) => { totalVisits: number; totalFavorites: number };
}

const persist = async (key: string, data: unknown) => {
  await set(key, data);
};

export const useStore = create<AppState>((set, get) => ({
  exhibitions: [],
  works: [],
  reviews: [],
  favorites: [],
  dailyStats: [],
  toasts: [],
  currentRole: 'viewer',
  initialized: false,

  loadFromDB: async () => {
    try {
      const [exhibitions, works, reviews, favorites, dailyStats] = await Promise.all([
        get<Exhibition[]>('exhibitions'),
        get<Work[]>('works'),
        get<Review[]>('reviews'),
        get<Favorite[]>('favorites'),
        get<DailyStat[]>('dailyStats'),
      ]);
      set({
        exhibitions: exhibitions || [],
        works: works || [],
        reviews: reviews || [],
        favorites: favorites || [],
        dailyStats: dailyStats || [],
        initialized: true,
      });
    } catch {
      set({ initialized: true });
    }
  },

  addExhibition: (data) => {
    const exhibition: Exhibition = {
      ...data,
      id: uuidv4(),
      visitCount: 0,
      createdAt: Date.now(),
    };
    const exhibitions = [...get().exhibitions, exhibition];
    set({ exhibitions });
    persist('exhibitions', exhibitions);
    get().showToast('展览创建成功！', 'success');
  },

  addWork: (data) => {
    const work: Work = {
      ...data,
      id: uuidv4(),
      status: 'pending',
      createdAt: Date.now(),
    };
    const works = [...get().works, work];
    set({ works });
    persist('works', works);
    get().showToast('作品提交成功，等待审核', 'success');
  },

  approveWork: (workId) => {
    const works = get().works.map((w) =>
      w.id === workId ? { ...w, status: 'approved' as const, rejectReason: undefined } : w
    );
    set({ works });
    persist('works', works);
    get().showToast('作品已通过审核', 'success');
  },

  rejectWork: (workId, reason) => {
    const works = get().works.map((w) =>
      w.id === workId ? { ...w, status: 'rejected' as const, rejectReason: reason } : w
    );
    set({ works });
    persist('works', works);
    get().showToast('作品已退回', 'info');
  },

  toggleFavorite: (workId) => {
    const { favorites } = get();
    const existing = favorites.find((f) => f.workId === workId);
    let newFavorites: Favorite[];
    if (existing) {
      newFavorites = favorites.filter((f) => f.workId !== workId);
    } else {
      newFavorites = [...favorites, { id: uuidv4(), workId, createdAt: Date.now() }];
      const work = get().works.find((w) => w.id === workId);
      if (work) {
        const today = new Date().toISOString().split('T')[0];
        const stats = get().dailyStats;
        const existingStat = stats.find(
          (s) => s.exhibitionId === work.exhibitionId && s.date === today
        );
        let newStats: DailyStat[];
        if (existingStat) {
          newStats = stats.map((s) =>
            s.id === existingStat.id ? { ...s, favoriteCount: s.favoriteCount + 1 } : s
          );
        } else {
          newStats = [
            ...stats,
            {
              id: uuidv4(),
              exhibitionId: work.exhibitionId,
              date: today,
              favoriteCount: 1,
              commentCount: 0,
            },
          ];
        }
        set({ dailyStats: newStats });
        persist('dailyStats', newStats);
      }
    }
    set({ favorites: newFavorites });
    persist('favorites', newFavorites);
  },

  addReview: (data) => {
    const review: Review = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    const reviews = [...get().reviews, review];
    set({ reviews });
    persist('reviews', reviews);

    const work = get().works.find((w) => w.id === data.workId);
    if (work) {
      const today = new Date().toISOString().split('T')[0];
      const stats = get().dailyStats;
      const existingStat = stats.find(
        (s) => s.exhibitionId === work.exhibitionId && s.date === today
      );
      let newStats: DailyStat[];
      if (existingStat) {
        newStats = stats.map((s) =>
          s.id === existingStat.id ? { ...s, commentCount: s.commentCount + 1 } : s
        );
      } else {
        newStats = [
          ...stats,
          {
            id: uuidv4(),
            exhibitionId: work.exhibitionId,
            date: today,
            favoriteCount: 0,
            commentCount: 1,
          },
        ];
      }
      set({ dailyStats: newStats });
      persist('dailyStats', newStats);
    }

    get().showToast('评论发布成功', 'success');
  },

  incrementVisit: (exhibitionId) => {
    const exhibitions = get().exhibitions.map((e) =>
      e.id === exhibitionId ? { ...e, visitCount: e.visitCount + 1 } : e
    );
    set({ exhibitions });
    persist('exhibitions', exhibitions);
  },

  setRole: (role) => {
    set({ currentRole: role });
  },

  showToast: (text, type = 'info') => {
    const id = uuidv4();
    const toast: ToastMessage = { id, text, type };
    set({ toasts: [...get().toasts, toast] });
    setTimeout(() => {
      get().removeToast(id);
    }, 3000);
  },

  removeToast: (id) => {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },

  getWorksByExhibition: (exhibitionId) => {
    return get().works.filter((w) => w.exhibitionId === exhibitionId);
  },

  getApprovedWorksByExhibition: (exhibitionId) => {
    return get().works.filter(
      (w) => w.exhibitionId === exhibitionId && w.status === 'approved'
    );
  },

  getPendingWorksByExhibition: (exhibitionId) => {
    return get().works.filter(
      (w) => w.exhibitionId === exhibitionId && w.status === 'pending'
    );
  },

  getReviewsByWork: (workId) => {
    return get().reviews.filter((r) => r.workId === workId);
  },

  isFavorite: (workId) => {
    return get().favorites.some((f) => f.workId === workId);
  },

  getFavoriteCount: (workId) => {
    return get().favorites.filter((f) => f.workId === workId).length;
  },

  getDailyStatsByExhibition: (exhibitionId) => {
    return get()
      .dailyStats.filter((s) => s.exhibitionId === exhibitionId)
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getExhibitionStats: (exhibitionId) => {
    const exhibition = get().exhibitions.find((e) => e.id === exhibitionId);
    const works = get().works.filter(
      (w) => w.exhibitionId === exhibitionId && w.status === 'approved'
    );
    const workIds = works.map((w) => w.id);
    const totalFavorites = get().favorites.filter((f) => workIds.includes(f.workId)).length;
    return {
      totalVisits: exhibition?.visitCount || 0,
      totalFavorites,
    };
  },
}));
