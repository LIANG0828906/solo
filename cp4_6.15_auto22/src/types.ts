export type BrewMethod = 'pourover' | 'espresso' | 'frenchPress' | 'aeropress';

export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  roastLevel: string;
}

export interface LogEntry {
  id: string;
  bean: CoffeeBean;
  brewMethod: BrewMethod;
  grindSize: number;
  waterTemp: number;
  ratio: number;
  brewTimeSeconds: number;
  rating: number;
  flavorTags: string[];
  customDescription: string;
  createdAt: number;
}

export interface FilterState {
  beanId: string | null;
  brewMethod: BrewMethod | null;
  minRating: number | null;
  timeRange: '7d' | '30d' | 'all';
  sortBy: 'date' | 'rating';
  sortOrder: 'asc' | 'desc';
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
}

export const BREW_METHOD_LABELS: Record<BrewMethod, string> = {
  pourover: '手冲',
  espresso: '意式',
  frenchPress: '法压',
  aeropress: '爱乐压',
};

export const FLAVOR_TAGS = [
  { id: 'floral', label: '花香' },
  { id: 'fruity', label: '果酸' },
  { id: 'nutty', label: '坚果' },
  { id: 'chocolate', label: '巧克力' },
  { id: 'caramel', label: '焦糖' },
  { id: 'woody', label: '木质' },
  { id: 'earthy', label: '泥土' },
] as const;

export const DEFAULT_FILTER: FilterState = {
  beanId: null,
  brewMethod: null,
  minRating: null,
  timeRange: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};
