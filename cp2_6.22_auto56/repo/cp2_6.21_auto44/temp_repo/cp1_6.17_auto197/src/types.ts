export type CardType = 'article' | 'painting' | 'music' | 'video';

export interface CreativeCard {
  id: string;
  year: number;
  type: CardType;
  title: string;
  summary: string;
  thumbnail: string;
  detailImage: string;
  content: string;
  order: number;
  createdAt: string;
}

export type SortType = 'newest' | 'oldest' | 'title';

export interface TimelineState {
  cards: CreativeCard[];
  filteredTypes: CardType[];
  sortType: SortType;
  expandedYears: number[];
  selectedCard: CreativeCard | null;
}

export interface TimelineActions {
  setFilteredTypes: (types: CardType[]) => void;
  setSortType: (sort: SortType) => void;
  toggleYear: (year: number) => void;
  setSelectedCard: (card: CreativeCard | null) => void;
  reorderCards: (year: number, fromIndex: number, toIndex: number) => void;
}

export const TYPE_COLORS: Record<CardType, string> = {
  article: '#5A189A',
  painting: '#E0AAFF',
  music: '#7B2CBF',
  video: '#3C096C',
};

export const TYPE_LABELS: Record<CardType, string> = {
  article: '文章',
  painting: '画作',
  music: '音乐',
  video: '视频',
};
