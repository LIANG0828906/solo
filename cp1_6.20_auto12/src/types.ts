export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  lat: number;
  lng: number;
  description: string;
  category: 'war' | 'culture' | 'tech' | 'politics';
  importance: number;
}

export interface TimeRange {
  min: number;
  max: number;
}

export type CategoryFilter = Set<string>;

export const CATEGORY_COLORS: Record<string, string> = {
  war: '#e94560',
  culture: '#533483',
  tech: '#0fbcf9',
  politics: '#ffd32a',
};

export const CATEGORY_LABELS: Record<string, string> = {
  war: '战争',
  culture: '文化',
  tech: '科技',
  politics: '政治',
};

export function dateToYear(dateStr: string): number {
  const match = dateStr.match(/^(-?\d+)/);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

export function formatYear(year: number): string {
  if (year < 0) {
    return `${Math.abs(year)} BC`;
  }
  return `${year} AD`;
}
