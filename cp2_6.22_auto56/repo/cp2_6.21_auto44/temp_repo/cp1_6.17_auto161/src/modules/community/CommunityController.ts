import {
  CommunityFilters,
  CommunityQueryResult,
  DEFAULT_FILTERS,
  buildQueryParams,
} from './CommunityService';
import { BrewingRecord } from '../brewing/BrewingService';

const API_BASE = '/api';

export const fetchCommunityCards = async (
  filters: CommunityFilters = DEFAULT_FILTERS,
  page: number = 1,
  limit: number = 20
): Promise<CommunityQueryResult> => {
  const queryStr = buildQueryParams(filters, page, limit);
  const res = await fetch(`${API_BASE}/community?${queryStr}`);
  if (!res.ok) throw new Error('获取社区卡片失败');
  return res.json();
};

export const fetchUserRecords = async (
  userId: string = 'user1',
  page: number = 1,
  limit: number = 50
): Promise<CommunityQueryResult> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  params.set('userId', userId);
  const res = await fetch(`${API_BASE}/records?${params.toString()}`);
  if (!res.ok) throw new Error('获取记录失败');
  return res.json();
};

export const filterCardsBySearch = (
  cards: BrewingRecord[],
  search: string
): BrewingRecord[] => {
  if (!search.trim()) return cards;
  const searchStr = search.toLowerCase();
  return cards.filter(card =>
    card.beanName.toLowerCase().includes(searchStr) ||
    card.origin.toLowerCase().includes(searchStr)
  );
};
