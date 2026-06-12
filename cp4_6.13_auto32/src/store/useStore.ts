import { create } from 'zustand';
import { Feed, Article, ReadingProgress, MobileView } from '../types';
import { parseRssFeed } from '../parser/rssParser';
import {
  getFeeds,
  addFeed as saveFeedToDB,
  deleteFeed as deleteFeedFromDB,
  getArticles,
  updateArticle,
  updateArticles,
  updateFeed as updateFeedInDB,
  saveReadingProgress as saveProgressToDB,
  getAllReadingProgress
} from '../services/storageService';

interface StoreState {
  feeds: Feed[];
  articles: Article[];
  selectedFeedId: string | null;
  selectedArticleId: string | null;
  isDarkMode: boolean;
  mobileView: MobileView;
  readingProgress: Map<string, ReadingProgress>;
  selectedFeedIds: Set<string>;
  showAboutModal: boolean;
  errorMessage: string | null;
  isLoading: boolean;
  
  initialize: () => Promise<void>;
  addFeed: (url: string) => Promise<void>;
  deleteFeed: (feedId: string) => Promise<void>;
  selectFeed: (feedId: string | null) => void;
  selectArticle: (articleId: string | null) => void;
  toggleArticleRead: (articleId: string) => Promise<void>;
  markFeedAsRead: (feedId: string) => Promise<void>;
  toggleFavorite: (articleId: string) => Promise<void>;
  toggleDarkMode: () => void;
  setMobileView: (view: MobileView) => void;
  saveReadingProgress: (articleId: string, percentage: number, scrollTop: number) => void;
  getReadingProgress: (articleId: string) => ReadingProgress | undefined;
  toggleFeedSelection: (feedId: string) => void;
  clearFeedSelection: () => void;
  markSelectedAsRead: () => Promise<void>;
  deleteSelectedFeeds: () => Promise<void>;
  setShowAboutModal: (show: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  getNextUnreadArticle: () => Article | null;
  getPrevReadArticle: () => Article | null;
  getCurrentArticleIndex: () => number;
  getFeedArticles: (feedId: string) => Article[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export const useStore = create<StoreState>((set, get) => ({
  feeds: [],
  articles: [],
  selectedFeedId: null,
  selectedArticleId: null,
  isDarkMode: false,
  mobileView: 'feeds',
  readingProgress: new Map(),
  selectedFeedIds: new Set(),
  showAboutModal: false,
  errorMessage: null,
  isLoading: false,

  initialize: async () => {
    try {
      const [feeds, articles, progressList] = await Promise.all([
        getFeeds(),
        getArticles(),
        getAllReadingProgress()
      ]);
      
      const progressMap = new Map<string, ReadingProgress>();
      progressList.forEach(p => progressMap.set(p.articleId, p));
      
      set({ feeds, articles, readingProgress: progressMap });
    } catch (error) {
      console.error('Initialize error:', error);
      set({ errorMessage: '加载数据失败' });
    }
  },

  addFeed: async (url: string) => {
    set({ isLoading: true, errorMessage: null });
    
    try {
      const existingFeeds = get().feeds;
      if (existingFeeds.some(f => f.url === url)) {
        throw new Error('该RSS源已存在');
      }
      
      const parsed = await parseRssFeed(url);
      
      const feedId = generateId();
      const now = new Date().toISOString();
      
      const newFeed: Feed = {
        id: feedId,
        url,
        title: parsed.title,
        lastUpdated: now,
        unreadCount: parsed.articles.length
      };
      
      const newArticles: Article[] = parsed.articles.map(article => ({
        ...article,
        id: generateId(),
        feedId,
        isRead: false,
        isFavorite: false
      }));
      
      await saveFeedToDB(newFeed, newArticles);
      
      set(state => ({
        feeds: [...state.feeds, newFeed],
        articles: [...state.articles, ...newArticles],
        isLoading: false
      }));
    } catch (error) {
      set({ 
        errorMessage: error instanceof Error ? error.message : '订阅失败',
        isLoading: false 
      });
      throw error;
    }
  },

  deleteFeed: async (feedId: string) => {
    try {
      await deleteFeedFromDB(feedId);
      
      set(state => ({
        feeds: state.feeds.filter(f => f.id !== feedId),
        articles: state.articles.filter(a => a.feedId !== feedId),
        selectedFeedId: state.selectedFeedId === feedId ? null : state.selectedFeedId,
        selectedArticleId: state.articles.find(a => a.feedId === feedId)?.id === state.selectedArticleId 
          ? null : state.selectedArticleId
      }));
    } catch (error) {
      console.error('Delete feed error:', error);
      set({ errorMessage: '删除失败' });
    }
  },

  selectFeed: (feedId: string | null) => {
    set({ selectedFeedId: feedId, selectedArticleId: null });
  },

  selectArticle: (articleId: string | null) => {
    set({ selectedArticleId: articleId });
  },

  toggleArticleRead: async (articleId: string) => {
    const article = get().articles.find(a => a.id === articleId);
    if (!article) return;
    
    const newIsRead = !article.isRead;
    
    const updatedArticle = { ...article, isRead: newIsRead };
    await updateArticle(updatedArticle);
    
    set(state => {
      const articles = state.articles.map(a => 
        a.id === articleId ? updatedArticle : a
      );
      
      const feeds = state.feeds.map(f => {
        if (f.id === article.feedId) {
          const unreadCount = articles.filter(a => a.feedId === f.id && !a.isRead).length;
          return { ...f, unreadCount };
        }
        return f;
      });
      
      return { articles, feeds };
    });
  },

  markFeedAsRead: async (feedId: string) => {
    const feedArticles = get().articles.filter(a => a.feedId === feedId && !a.isRead);
    if (feedArticles.length === 0) return;
    
    const updatedArticles = feedArticles.map(a => ({ ...a, isRead: true }));
    await updateArticles(updatedArticles);
    
    set(state => {
      const articles = state.articles.map(a => 
        a.feedId === feedId ? { ...a, isRead: true } : a
      );
      
      const feeds = state.feeds.map(f => 
        f.id === feedId ? { ...f, unreadCount: 0 } : f
      );
      
      return { articles, feeds };
    });
  },

  toggleFavorite: async (articleId: string) => {
    const article = get().articles.find(a => a.id === articleId);
    if (!article) return;
    
    const updatedArticle = { ...article, isFavorite: !article.isFavorite };
    await updateArticle(updatedArticle);
    
    set(state => ({
      articles: state.articles.map(a => 
        a.id === articleId ? updatedArticle : a
      )
    }));
  },

  toggleDarkMode: () => {
    set(state => ({ isDarkMode: !state.isDarkMode }));
  },

  setMobileView: (view: MobileView) => {
    set({ mobileView: view });
  },

  saveReadingProgress: (articleId: string, percentage: number, scrollTop: number) => {
    const progress: ReadingProgress = {
      articleId,
      percentage,
      scrollTop,
      lastReadAt: new Date().toISOString()
    };
    
    set(state => {
      const newMap = new Map(state.readingProgress);
      newMap.set(articleId, progress);
      return { readingProgress: newMap };
    });
    
    saveProgressToDB(progress).catch(e => console.error('Save progress error:', e));
  },

  getReadingProgress: (articleId: string) => {
    return get().readingProgress.get(articleId);
  },

  toggleFeedSelection: (feedId: string) => {
    set(state => {
      const newSet = new Set(state.selectedFeedIds);
      if (newSet.has(feedId)) {
        newSet.delete(feedId);
      } else {
        newSet.add(feedId);
      }
      return { selectedFeedIds: newSet };
    });
  },

  clearFeedSelection: () => {
    set({ selectedFeedIds: new Set() });
  },

  markSelectedAsRead: async () => {
    const { selectedFeedIds, articles } = get();
    const feedIds = Array.from(selectedFeedIds);
    
    const articlesToUpdate = articles.filter(a => 
      feedIds.includes(a.feedId) && !a.isRead
    );
    
    if (articlesToUpdate.length === 0) return;
    
    const updatedArticles = articlesToUpdate.map(a => ({ ...a, isRead: true }));
    await updateArticles(updatedArticles);
    
    set(state => {
      const newArticles = state.articles.map(a => 
        feedIds.includes(a.feedId) ? { ...a, isRead: true } : a
      );
      
      const newFeeds = state.feeds.map(f => 
        feedIds.includes(f.id) ? { ...f, unreadCount: 0 } : f
      );
      
      return { 
        articles: newArticles, 
        feeds: newFeeds,
        selectedFeedIds: new Set()
      };
    });
  },

  deleteSelectedFeeds: async () => {
    const { selectedFeedIds } = get();
    const feedIds = Array.from(selectedFeedIds);
    
    for (const feedId of feedIds) {
      await deleteFeedFromDB(feedId);
    }
    
    set(state => ({
      feeds: state.feeds.filter(f => !feedIds.includes(f.id)),
      articles: state.articles.filter(a => !feedIds.includes(a.feedId)),
      selectedFeedIds: new Set(),
      selectedFeedId: feedIds.includes(state.selectedFeedId || '') ? null : state.selectedFeedId,
      selectedArticleId: state.articles.find(a => feedIds.includes(a.feedId))?.id === state.selectedArticleId
        ? null : state.selectedArticleId
    }));
  },

  setShowAboutModal: (show: boolean) => {
    set({ showAboutModal: show });
  },

  setErrorMessage: (message: string | null) => {
    set({ errorMessage: message });
  },

  getNextUnreadArticle: () => {
    const { selectedFeedId, articles, selectedArticleId } = get();
    if (!selectedFeedId) return null;
    
    const feedArticles = get().getFeedArticles(selectedFeedId);
    const currentIndex = feedArticles.findIndex(a => a.id === selectedArticleId);
    const startIndex = currentIndex >= 0 ? currentIndex + 1 : 0;
    
    for (let i = startIndex; i < feedArticles.length; i++) {
      if (!feedArticles[i].isRead) return feedArticles[i];
    }
    
    for (let i = 0; i < startIndex; i++) {
      if (!feedArticles[i].isRead) return feedArticles[i];
    }
    
    return null;
  },

  getPrevReadArticle: () => {
    const { selectedFeedId, articles, selectedArticleId } = get();
    if (!selectedFeedId) return null;
    
    const feedArticles = get().getFeedArticles(selectedFeedId);
    const currentIndex = feedArticles.findIndex(a => a.id === selectedArticleId);
    const startIndex = currentIndex >= 0 ? currentIndex - 1 : feedArticles.length - 1;
    
    for (let i = startIndex; i >= 0; i--) {
      if (feedArticles[i].isRead) return feedArticles[i];
    }
    
    for (let i = feedArticles.length - 1; i > startIndex; i--) {
      if (feedArticles[i].isRead) return feedArticles[i];
    }
    
    return null;
  },

  getCurrentArticleIndex: () => {
    const { selectedFeedId, selectedArticleId, articles } = get();
    if (!selectedFeedId || !selectedArticleId) return -1;
    
    const feedArticles = get().getFeedArticles(selectedFeedId);
    return feedArticles.findIndex(a => a.id === selectedArticleId);
  },

  getFeedArticles: (feedId: string) => {
    return get().articles
      .filter(a => a.feedId === feedId)
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  }
}));
