import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Theme, Work, Review, WeeklyReport, WorkWithScore } from './types';

const USER_ID_KEY = 'critique-circle-user-id';
const DB_THEMES_KEY = 'cc-themes';
const DB_WORKS_KEY = 'cc-works';
const DB_REVIEWS_KEY = 'cc-reviews';

function getCurrentUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = uuidv4();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

interface AppState {
  themes: Theme[];
  works: Work[];
  reviews: Review[];
  currentUserId: string;
  initialized: boolean;

  initStore: () => Promise<void>;
  addTheme: (title: string, description: string, startDate: string, endDate: string) => void;
  submitWork: (themeId: string, title: string, content: string) => void;
  addReview: (workId: string, rating: number, comment: string) => void;
  calculateWeeklyWinner: (themeId: string) => WeeklyReport | null;
  getWorksWithScores: (themeId: string) => WorkWithScore[];
  closeExpiredThemes: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  themes: [],
  works: [],
  reviews: [],
  currentUserId: getCurrentUserId(),
  initialized: false,

  initStore: async () => {
    const [rawThemes, rawWorks, rawReviews] = await Promise.all([
      idbGet(DB_THEMES_KEY),
      idbGet(DB_WORKS_KEY),
      idbGet(DB_REVIEWS_KEY),
    ]);
    set({
      themes: (rawThemes as Theme[] | undefined) || [],
      works: (rawWorks as Work[] | undefined) || [],
      reviews: (rawReviews as Review[] | undefined) || [],
      initialized: true,
    });
    get().closeExpiredThemes();
  },

  addTheme: (title, description, startDate, endDate) => {
    const newTheme: Theme = {
      id: uuidv4(),
      title,
      description,
      startDate,
      endDate,
      status: 'open',
    };
    const themes = [newTheme, ...get().themes];
    set({ themes });
    idbSet(DB_THEMES_KEY, themes);
  },

  submitWork: (themeId, title, content) => {
    const { works, currentUserId } = get();
    const themeWorks = works.filter(w => w.themeId === themeId);
    const newWork: Work = {
      id: uuidv4(),
      themeId,
      title,
      content,
      authorId: currentUserId,
      anonymousIndex: themeWorks.length + 1,
      createdAt: new Date().toISOString(),
    };
    const updatedWorks = [...works, newWork];
    set({ works: updatedWorks });
    idbSet(DB_WORKS_KEY, updatedWorks);
  },

  addReview: (workId, rating, comment) => {
    const { reviews, currentUserId } = get();
    const newReview: Review = {
      id: uuidv4(),
      workId,
      reviewerId: currentUserId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [...reviews, newReview];
    set({ reviews: updatedReviews });
    idbSet(DB_REVIEWS_KEY, updatedReviews);
  },

  calculateWeeklyWinner: (themeId) => {
    const { works, reviews } = get();
    const themeWorks = works.filter(w => w.themeId === themeId);

    if (themeWorks.length === 0) return null;

    const worksWithScores: WorkWithScore[] = themeWorks.map(work => {
      const workReviews = reviews.filter(r => r.workId === work.id);
      const avgScore = workReviews.length > 0
        ? workReviews.reduce((sum, r) => sum + r.rating, 0) / workReviews.length
        : 0;
      return { ...work, avgScore: Math.round(avgScore * 100) / 100, reviewCount: workReviews.length };
    });

    worksWithScores.sort((a, b) => b.avgScore - a.avgScore || b.reviewCount - a.reviewCount);
    const winner = worksWithScores[0];

    const themeReviews = reviews.filter(r =>
      themeWorks.some(w => w.id === r.workId)
    );
    const uniqueAuthors = new Set(themeWorks.map(w => w.authorId)).size;

    return {
      themeId,
      winnerWorkId: winner.id,
      winnerAvgScore: winner.avgScore,
      totalWorks: themeWorks.length,
      totalReviews: themeReviews.length,
      uniqueAuthors,
    };
  },

  getWorksWithScores: (themeId) => {
    const { works, reviews } = get();
    const themeWorks = works.filter(w => w.themeId === themeId);

    return themeWorks.map(work => {
      const workReviews = reviews.filter(r => r.workId === work.id);
      const avgScore = workReviews.length > 0
        ? workReviews.reduce((sum, r) => sum + r.rating, 0) / workReviews.length
        : 0;
      return { ...work, avgScore: Math.round(avgScore * 100) / 100, reviewCount: workReviews.length };
    }).sort((a, b) => b.avgScore - a.avgScore || b.reviewCount - a.reviewCount);
  },

  closeExpiredThemes: () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const nowStr = now.toISOString().slice(0, 10);
    const themes = get().themes.map(theme => {
      if (theme.status === 'open' && theme.endDate < nowStr) {
        return { ...theme, status: 'closed' as const };
      }
      return theme;
    });
    set({ themes });
    idbSet(DB_THEMES_KEY, themes);
  },
}));
