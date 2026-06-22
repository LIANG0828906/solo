import { create } from 'zustand';
import type { ColorCard } from '../types';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
};

const initialCards: ColorCard[] = [
  {
    id: 'card-1',
    name: '落日橙',
    hex: '#E67E22',
    notes: '秋日傍晚的夕阳，温暖而怀旧，像老照片里的黄昏。',
    tags: ['温暖', '怀旧', '秋天'],
    createdAt: '2024-03-15',
  },
  {
    id: 'card-2',
    name: '深海蓝',
    hex: '#2C3E50',
    notes: '深夜书房的静谧，墨水在宣纸上晕开的颜色。',
    tags: ['沉静', '复古', '夜晚'],
    createdAt: '2024-02-20',
  },
  {
    id: 'card-3',
    name: '胭脂红',
    hex: '#C0392B',
    notes: '旧旗袍上的朱砂色，带着东方古典的韵味。',
    tags: ['热情', '古典', '东方'],
    createdAt: '2024-01-10',
  },
  {
    id: 'card-4',
    name: '薄荷绿',
    hex: '#27AE60',
    notes: '老式汽水的玻璃瓶身，夏天的清新记忆。',
    tags: ['清新', '夏天', '怀旧'],
    createdAt: '2024-04-05',
  },
  {
    id: 'card-5',
    name: '柠檬黄',
    hex: '#F1C40F',
    notes: '旧杂志封面上的明黄色，活泼又复古。',
    tags: ['活泼', '复古', '温暖'],
    createdAt: '2024-05-12',
  },
  {
    id: 'card-6',
    name: '雾霾紫',
    hex: '#8E44AD',
    notes: '老式照相馆的背景布，神秘而优雅。',
    tags: ['神秘', '优雅', '夜晚'],
    createdAt: '2024-06-18',
  },
];

interface ColorCardState {
  cards: ColorCard[];
  currentCard: ColorCard | null;
  selectedTags: string[];
  filterKeyword: string;
  addCard: (card: Omit<ColorCard, 'id' | 'createdAt'>) => void;
  removeCard: (id: string) => void;
  setCurrentCard: (card: ColorCard | null) => void;
  setFilter: (keyword: string) => void;
  toggleTag: (tag: string) => void;
  updateCard: (id: string, updates: Partial<ColorCard>) => void;
}

export const useColorCardStore = create<ColorCardState>((set) => ({
  cards: initialCards,
  currentCard: null,
  selectedTags: [],
  filterKeyword: '',

  addCard: (cardData) =>
    set((state) => ({
      cards: [
        {
          ...cardData,
          id: generateId(),
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...state.cards,
      ],
    })),

  removeCard: (id) =>
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
      currentCard: state.currentCard?.id === id ? null : state.currentCard,
    })),

  setCurrentCard: (card) => set({ currentCard: card }),

  setFilter: (keyword) => set({ filterKeyword: keyword }),

  toggleTag: (tag) =>
    set((state) => ({
      selectedTags: state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag],
    })),

  updateCard: (id, updates) =>
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, ...updates } : card
      ),
      currentCard:
        state.currentCard?.id === id
          ? { ...state.currentCard, ...updates }
          : state.currentCard,
    })),
}));
