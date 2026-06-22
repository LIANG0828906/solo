export type PlatformType = 'blog' | 'newsletter' | 'social';

export type PostStatus = 'draft' | 'published';

export interface Post {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: PostStatus;
  lastModified: string;
  platforms: PlatformType[];
}

export interface AdaptedContent {
  platform: PlatformType;
  title: string;
  content: string;
  formattedContent: string;
}

export interface AnalyticsDataPoint {
  hour: string;
  reads: number;
  likes: number;
  comments: number;
}

export interface PlatformAnalytics {
  platform: PlatformType;
  totalReads: number;
  totalLikes: number;
  totalComments: number;
  hourlyData: AnalyticsDataPoint[];
}

export const PLATFORM_COLORS: Record<PlatformType, string> = {
  blog: '#3B82F6',
  newsletter: '#8B5CF6',
  social: '#EC4899',
};

export const PLATFORM_NAMES: Record<PlatformType, string> = {
  blog: '博客',
  newsletter: 'Newsletter',
  social: '社交媒体',
};
