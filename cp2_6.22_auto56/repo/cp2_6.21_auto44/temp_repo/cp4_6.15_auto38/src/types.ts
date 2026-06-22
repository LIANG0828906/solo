export interface WatchRecord {
  id: string;
  date: string;
  comment: string;
  rating: number;
}

export interface Movie {
  id: string;
  poster: string;
  titleCn: string;
  titleEn: string;
  director: string;
  year: number;
  watchDate: string;
  rating: number;
  comment: string;
  categories: Category[];
  watchHistory: WatchRecord[];
}

export type Category =
  | '动作'
  | '喜剧'
  | '剧情'
  | '科幻'
  | '恐怖'
  | '爱情'
  | '动画'
  | '纪录片';

export const ALL_CATEGORIES: Category[] = [
  '动作',
  '喜剧',
  '剧情',
  '科幻',
  '恐怖',
  '爱情',
  '动画',
  '纪录片',
];

export type PageType = 'list' | 'detail' | 'form' | 'stats';

export interface FilterState {
  search: string;
  yearRange: [number, number];
  ratingRange: [number, number];
  selectedCategories: Category[];
}

export const createDefaultFilterState = (): FilterState => ({
  search: '',
  yearRange: [1980, new Date().getFullYear()],
  ratingRange: [0, 10],
  selectedCategories: [],
});
