export type InspirationStatus = '进行中' | '已实现' | '已归档';

export interface Inspiration {
  id: string;
  title: string;
  content: string;
  tags: string[];
  status: InspirationStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyStats {
  date: string;
  count: number;
}

export interface StatusStats {
  '进行中': number;
  '已实现': number;
  '已归档': number;
}

export interface FilterParams {
  tag: string;
  status: string;
  search: string;
}

export const PRESET_TAGS = ['设计', '技术', '商业', '个人'] as const;
export const PRESET_STATUSES: InspirationStatus[] = ['进行中', '已实现', '已归档'];

export const TAG_COLORS: Record<string, string> = {
  设计: '#F472B6',
  技术: '#60A5FA',
  商业: '#34D399',
  个人: '#FBBF24',
};

export const STATUS_COLORS: Record<InspirationStatus, string> = {
  '进行中': '#10B981',
  '已实现': '#3B82F6',
  '已归档': '#6B7280',
};
