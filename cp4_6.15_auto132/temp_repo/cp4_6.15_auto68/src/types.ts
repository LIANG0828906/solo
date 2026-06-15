export type Platform = 'weibo' | 'zhihu' | 'bilibili';

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'failed';

export interface Content {
  id: string;
  title: string;
  body: string;
  images: string[];
  platforms: Platform[];
  scheduleTime: string;
  status: ContentStatus;
  errorMsg?: string;
  likes?: number;
  reposts?: number;
  comments?: number;
  publishedAt?: string;
}

export interface DayStats {
  date: string;
  postCount: number;
  engagement: number;
}

export interface PlatformCharLimit {
  platform: Platform;
  name: string;
  limit: number;
  color: string;
  bgColor: string;
}

export const PLATFORM_CONFIG: Record<Platform, PlatformCharLimit> = {
  weibo: {
    platform: 'weibo',
    name: '微博',
    limit: 140,
    color: '#E6162D',
    bgColor: 'rgba(230, 22, 45, 0.15)',
  },
  zhihu: {
    platform: 'zhihu',
    name: '知乎',
    limit: Infinity,
    color: '#0084FF',
    bgColor: 'rgba(0, 132, 255, 0.15)',
  },
  bilibili: {
    platform: 'bilibili',
    name: 'B站',
    limit: 2000,
    color: '#FB7299',
    bgColor: 'rgba(251, 114, 153, 0.15)',
  },
};

export type ViewMode = 'month' | 'week' | 'list';

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}
