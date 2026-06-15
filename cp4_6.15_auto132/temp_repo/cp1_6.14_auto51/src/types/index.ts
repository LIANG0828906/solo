export type Platform = 'weibo' | 'wechat' | 'douyin' | 'bilibili';

export type PostStatus = 'draft' | 'queued' | 'published';

export interface User {
  id: string;
  username: string;
  avatar: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  summary: string;
  platform: Platform;
  scheduledAt: string;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EngagementData {
  platform: Platform;
  likes: number;
  comments: number;
  shares: number;
  avgEngagementRate: number;
}

export interface DailyTrend {
  date: string;
  likes: number;
  comments: number;
  shares: number;
}

export interface DashboardStats {
  weeklyPosts: number;
  totalEngagement: number;
  pendingDrafts: number;
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  weibo: '#E6162D',
  wechat: '#07C160',
  douyin: '#00A8E8',
  bilibili: '#FB7299',
};

export const PLATFORM_NAMES: Record<Platform, string> = {
  weibo: '微博',
  wechat: '微信公众号',
  douyin: '抖音',
  bilibili: 'B站',
};
