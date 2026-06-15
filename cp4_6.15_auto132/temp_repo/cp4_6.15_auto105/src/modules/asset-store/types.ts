export interface Asset {
  id: string;
  name: string;
  modelUrl: string;
  thumbnail: string;
  format: 'gltf' | 'glb' | 'obj';
  faceCount: number;
  size: string;
  fileSize: number;
  tags: string[];
  createdAt: Date;
  rating: number;
  description?: string;
}

export type MaterialMode = 'standard' | 'wireframe' | 'transparent';

export type SortOption = 'newest' | 'oldest' | 'name' | 'rating';

export interface FilterOptions {
  search: string;
  tags: string[];
  styles: string[];
  timeRange: TimeRange | null;
  sortBy: SortOption;
}

export type TimeRange = 'day' | 'week' | 'month' | 'year' | 'all';

export interface SearchResult {
  assets: Asset[];
  total: number;
  hasMore: boolean;
}

export const TAG_STYLES = [
  '科幻',
  '写实',
  '卡通',
  '低多边形',
  '像素风',
  '蒸汽朋克',
  '赛博朋克',
  '奇幻',
  '现代',
  '古风',
] as const;

export const TAG_USES = [
  '游戏',
  '动画',
  '建筑',
  '产品',
  '角色',
  '道具',
  '场景',
  '交通工具',
  '植物',
  '动物',
] as const;

export type TagStyle = typeof TAG_STYLES[number];
export type TagUse = typeof TAG_USES[number];
