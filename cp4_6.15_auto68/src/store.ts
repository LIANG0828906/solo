import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { addDays, startOfWeek, format, addWeeks } from 'date-fns';
import { Content, ViewMode, Platform } from './types';

interface StoreState {
  contents: Content[];
  selectedDate: string;
  viewMode: ViewMode;
  currentMonth: Date;
  
  addContent: (content: Omit<Content, 'id' | 'status'>) => void;
  updateContent: (id: string, updates: Partial<Content>) => void;
  deleteContent: (id: string) => void;
  rescheduleContent: (id: string, newScheduleTime: string) => void;
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setCurrentMonth: (date: Date) => void;
  retryPublish: (id: string) => void;
  publishContent: (id: string) => void;
  getContentsByDate: (dateStr: string) => Content[];
  getPlatformStats: () => { platform: Platform; count: number }[];
  getWeeklyStats: () => { date: string; postCount: number; engagement: number }[];
  getYesterdayPostCount: () => number;
  getWeeklyEngagement: () => number;
}

const generateMockData = (): Content[] => {
  const today = new Date();
  const contents: Content[] = [];
  
  const mockData = [
    { title: 'React 18新特性详解', body: '今天来聊聊React 18的并发特性... #React #前端开发', platforms: ['zhihu', 'bilibili'] as Platform[], daysOffset: -6, status: 'published' as const, likes: 234, reposts: 45, comments: 23 },
    { title: '每日前端技巧', body: '分享一个CSS小技巧：使用clamp()实现响应式字体大小 #CSS #前端', platforms: ['weibo'] as Platform[], daysOffset: -5, status: 'published' as const, likes: 89, reposts: 12, comments: 8 },
    { title: 'TypeScript高级类型', body: '深入理解TypeScript的条件类型和映射类型 #TypeScript', platforms: ['zhihu'] as Platform[], daysOffset: -4, status: 'published' as const, likes: 156, reposts: 28, comments: 15 },
    { title: '周末项目分享', body: '用周末时间做了一个小工具，代码已开源到GitHub #开源 #JavaScript', platforms: ['weibo', 'bilibili'] as Platform[], daysOffset: -3, status: 'published' as const, likes: 312, reposts: 67, comments: 42 },
    { title: 'Vite配置最佳实践', body: '分享几个Vite配置的优化技巧，让你的项目飞起来 #Vite #前端工程化', platforms: ['zhihu', 'weibo'] as Platform[], daysOffset: -2, status: 'published' as const, likes: 178, reposts: 34, comments: 19 },
    { title: '昨日技术资讯', body: '【技术资讯】1. Chrome 120发布 2. Node.js 21升级 3. 新框架Bun发布 #技术资讯', platforms: ['weibo'] as Platform[], daysOffset: -1, status: 'published' as const, likes: 67, reposts: 15, comments: 5 },
    { title: '本周学习计划', body: '本周学习目标：1. 深入Rust 2. 复习算法 3. 读两本技术书 #学习打卡', platforms: ['weibo', 'zhihu'] as Platform[], daysOffset: 0, status: 'scheduled' as const },
    { title: 'CSS Grid布局实战', body: '手把手教你用CSS Grid实现复杂布局，附完整代码示例 #CSS #布局', platforms: ['bilibili', 'zhihu'] as Platform[], daysOffset: 1, status: 'scheduled' as const },
    { title: '每日算法题', body: 'LeetCode每日一题：两数之和，三种解法分析 #算法 #LeetCode', platforms: ['weibo'] as Platform[], daysOffset: 1, status: 'scheduled' as const },
    { title: 'Rust入门指南', body: 'Rust语言入门系列第一篇：为什么选择Rust？ #Rust #编程语言', platforms: ['zhihu', 'bilibili'] as Platform[], daysOffset: 2, status: 'draft' as const },
    { title: '发布失败测试', body: '这是一条发布失败的测试内容 #测试', platforms: ['weibo'] as Platform[], daysOffset: -1, status: 'failed' as const, errorMsg: 'Access Token已过期，请重新授权' },
    { title: '产品思考：极简主义', body: '最近在思考产品设计中的极简主义... #产品设计 #思考', platforms: ['zhihu'] as Platform[], daysOffset: 3, status: 'scheduled' as const },
  ];
  
  mockData.forEach((item, index) => {
    const date = addDays(today, item.daysOffset);
    const hours = 9 + (index % 6);
    date.setHours(hours, 30, 0, 0);
    
    contents.push({
      id: uuidv4(),
      title: item.title,
      body: item.body,
      images: [],
      platforms: item.platforms,
      scheduleTime: date.toISOString(),
      status: item.status,
      errorMsg: item.errorMsg,
      likes: item.likes,
      reposts: item.reposts,
      comments: item.comments,
      publishedAt: item.status === 'published' ? date.toISOString() : undefined,
    });
  });
  
  return contents;
};

export const useContentStore = create<StoreState>((set, get) => ({
  contents: generateMockData(),
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  viewMode: 'month',
  currentMonth: new Date(),

  addContent: (content) =>
    set((state) => ({
      contents: [
        ...state.contents,
        {
          ...content,
          id: uuidv4(),
          status: content.scheduleTime ? 'scheduled' : 'draft',
        },
      ],
    })),

  updateContent: (id, updates) =>
    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  deleteContent: (id) =>
    set((state) => ({
      contents: state.contents.filter((c) => c.id !== id),
    })),

  rescheduleContent: (id, newScheduleTime) =>
    set((state) => ({
      contents: state.contents.map((c) =>
        c.id === id ? { ...c, scheduleTime: newScheduleTime, status: 'scheduled' } : c
      ),
    })),

  setSelectedDate: (date) => set({ selectedDate: date }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentMonth: (date) => set({ currentMonth: date }),

  retryPublish: (id) => {
    const { updateContent } = get();
    updateContent(id, { status: 'scheduled', errorMsg: undefined });
    
    setTimeout(() => {
      const success = Math.random() > 0.3;
      if (success) {
        updateContent(id, { 
          status: 'published', 
          publishedAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 100) + 10,
          reposts: Math.floor(Math.random() * 30) + 5,
          comments: Math.floor(Math.random() * 20) + 2,
        });
      } else {
        updateContent(id, { 
          status: 'failed', 
          errorMsg: '网络连接超时，请稍后重试' 
        });
      }
    }, 2000);
  },

  publishContent: (id) => {
    const { updateContent } = get();
    setTimeout(() => {
      const success = Math.random() > 0.1;
      if (success) {
        updateContent(id, { 
          status: 'published', 
          publishedAt: new Date().toISOString(),
          likes: Math.floor(Math.random() * 50) + 5,
          reposts: Math.floor(Math.random() * 15) + 2,
          comments: Math.floor(Math.random() * 10) + 1,
        });
      } else {
        updateContent(id, { 
          status: 'failed', 
          errorMsg: '平台API调用失败，请检查授权' 
        });
      }
    }, 1500);
  },

  getContentsByDate: (dateStr) => {
    const { contents } = get();
    return contents.filter((c) => {
      const contentDate = format(new Date(c.scheduleTime), 'yyyy-MM-dd');
      return contentDate === dateStr;
    });
  },

  getPlatformStats: () => {
    const { contents } = get();
    const stats: Record<string, number> = { weibo: 0, zhihu: 0, bilibili: 0 };
    contents.forEach((c) => {
      if (c.status === 'published') {
        c.platforms.forEach((p) => {
          stats[p] = (stats[p] || 0) + 1;
        });
      }
    });
    return Object.entries(stats).map(([platform, count]) => ({
      platform: platform as Platform,
      count,
    }));
  },

  getWeeklyStats: () => {
    const { contents } = get();
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const stats = [];
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayContents = contents.filter((c) => {
        const contentDate = format(new Date(c.scheduleTime), 'yyyy-MM-dd');
        return contentDate === dateStr;
      });
      
      const postCount = dayContents.filter((c) => c.status === 'published').length;
      const engagement = dayContents.reduce((sum, c) => {
        if (c.status === 'published') {
          return sum + (c.likes || 0) + (c.reposts || 0) + (c.comments || 0);
        }
        return sum;
      }, 0);
      
      stats.push({
        date: format(date, 'MM/dd'),
        postCount,
        engagement,
      });
    }
    
    return stats;
  },

  getYesterdayPostCount: () => {
    const { contents } = get();
    const yesterday = addDays(new Date(), -1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
    return contents.filter((c) => {
      const contentDate = format(new Date(c.scheduleTime), 'yyyy-MM-dd');
      return contentDate === yesterdayStr && c.status === 'published';
    }).length;
  },

  getWeeklyEngagement: () => {
    const { contents } = get();
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    
    return contents.reduce((sum, c) => {
      if (c.status === 'published') {
        const publishDate = new Date(c.scheduleTime);
        if (publishDate >= weekStart && publishDate <= weekEnd) {
          return sum + (c.likes || 0) + (c.reposts || 0) + (c.comments || 0);
        }
      }
      return sum;
    }, 0);
  },
}));
