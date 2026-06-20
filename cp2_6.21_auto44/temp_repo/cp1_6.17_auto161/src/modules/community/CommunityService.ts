import { BrewingRecord } from '../brewing/BrewingService';

export interface CommunityFilters {
  search: string;
  origin: string;
  roastLevel: string;
  flavors: string[];
}

export interface CommunityQueryResult {
  records: BrewingRecord[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const DEFAULT_FILTERS: CommunityFilters = {
  search: '',
  origin: '',
  roastLevel: '',
  flavors: [],
};

export const buildQueryParams = (
  filters: CommunityFilters,
  page: number,
  limit: number = 20
): string => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.origin) params.set('origin', filters.origin);
  if (filters.roastLevel) params.set('roastLevel', filters.roastLevel);
  if (filters.flavors.length > 0) params.set('flavor', filters.flavors.join(','));
  return params.toString();
};

export const FLAVOR_OPTIONS = [
  { key: '酸度', label: '偏酸' },
  { key: '甜度', label: '甜感' },
  { key: '苦度', label: '偏苦' },
  { key: '醇厚度', label: '醇厚' },
  { key: '干净度', label: '干净' },
  { key: '余韵', label: '余韵' },
];

export const ORIGIN_OPTIONS = [
  '全部产地',
  '埃塞俄比亚', '哥伦比亚', '巴西', '肯尼亚', '危地马拉',
  '哥斯达黎加', '巴拿马', '印尼', '卢旺达', '中国云南'
];

export const ROAST_OPTIONS = [
  { key: '', label: '全部' },
  { key: '浅', label: '浅烘焙' },
  { key: '中', label: '中烘焙' },
  { key: '深', label: '深烘焙' },
];
