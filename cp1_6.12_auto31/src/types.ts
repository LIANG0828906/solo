export type Category = 'science' | 'culture' | 'politics' | 'sports' | 'nature';

export interface HistoryEvent {
  id: string;
  year: number;
  category: Category;
  title: string;
  description: string;
  colors: string[];
}

export interface YearNode {
  year: number;
  events: HistoryEvent[];
}

export const CATEGORIES: { value: Category; label: string; color: string }[] = [
  { value: 'science', label: '科技', color: '#4f46e5' },
  { value: 'culture', label: '文化', color: '#db2777' },
  { value: 'politics', label: '政治', color: '#0891b2' },
  { value: 'sports', label: '体育', color: '#16a34a' },
  { value: 'nature', label: '自然', color: '#ca8a04' },
];
