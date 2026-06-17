import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type TagType = '创意' | '工作' | '学习' | '生活';

export interface Card {
  id: string;
  content: string;
  tag: TagType;
  x: number;
  y: number;
  isNew?: boolean;
}

interface CardStore {
  cards: Card[];
  searchQuery: string;
  addCard: (content: string, tag: TagType) => void;
  removeCard: (id: string) => void;
  updateCardPosition: (id: string, x: number, y: number) => void;
  setSearchQuery: (query: string) => void;
  clearNewFlag: (id: string) => void;
  exportToJson: () => string;
}

const CARD_WIDTH = 220;
const CARD_MIN_HEIGHT = 120;
const GAP = 40;

const TAG_COLORS: Record<TagType, { bg: string; text: string }> = {
  '创意': { bg: '#FFE2E2', text: '#C62828' },
  '工作': { bg: '#E2F0FF', text: '#1565C0' },
  '学习': { bg: '#FFF3E0', text: '#E65100' },
  '生活': { bg: '#E8F5E9', text: '#2E7D32' },
};

const generateRandomPosition = (existingCards: Card[]): { x: number; y: number } => {
  const padding = 60;
  const maxAttempts = 100;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const x = padding + Math.random() * (window.innerWidth - CARD_WIDTH - padding * 2);
    const y = 100 + Math.random() * (window.innerHeight - CARD_MIN_HEIGHT - 160);
    
    let overlaps = false;
    for (const card of existingCards) {
      if (
        x < card.x + CARD_WIDTH + GAP &&
        x + CARD_WIDTH + GAP > card.x &&
        y < card.y + CARD_MIN_HEIGHT + GAP &&
        y + CARD_MIN_HEIGHT + GAP > card.y
      ) {
        overlaps = true;
        break;
      }
    }
    
    if (!overlaps) {
      return { x, y };
    }
  }
  
  return {
    x: padding + Math.random() * (window.innerWidth - CARD_WIDTH - padding * 2),
    y: 100 + Math.random() * (window.innerHeight - CARD_MIN_HEIGHT - 160),
  };
};

const initialCards: Card[] = [
  { id: uuidv4(), content: '开发一个可以自动生成创意的AI助手', tag: '创意', x: 80, y: 100, isNew: false },
  { id: uuidv4(), content: '完成季度产品规划文档', tag: '工作', x: 340, y: 100, isNew: false },
  { id: uuidv4(), content: '学习React 19的新特性', tag: '学习', x: 600, y: 100, isNew: false },
  { id: uuidv4(), content: '周末去爬山，放松一下', tag: '生活', x: 860, y: 100, isNew: false },
  { id: uuidv4(), content: '用WebGL做一个粒子效果的背景', tag: '创意', x: 80, y: 280, isNew: false },
  { id: uuidv4(), content: '准备下周的技术分享会', tag: '工作', x: 340, y: 280, isNew: false },
];

export const useCardStore = create<CardStore>((set, get) => ({
  cards: initialCards,
  searchQuery: '',
  
  addCard: (content: string, tag: TagType) => {
    const { cards } = get();
    const { x, y } = generateRandomPosition(cards);
    const newCard: Card = {
      id: uuidv4(),
      content,
      tag,
      x,
      y,
      isNew: true,
    };
    set((state) => ({ cards: [...state.cards, newCard] }));
  },
  
  removeCard: (id: string) => {
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== id),
    }));
  },
  
  updateCardPosition: (id: string, x: number, y: number) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, x, y } : card
      ),
    }));
  },
  
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },
  
  clearNewFlag: (id: string) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === id ? { ...card, isNew: false } : card
      ),
    }));
  },
  
  exportToJson: () => {
    const { cards } = get();
    return JSON.stringify(cards, null, 2);
  },
}));

export { TAG_COLORS };
