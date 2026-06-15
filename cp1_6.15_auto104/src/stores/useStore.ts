import { create } from 'zustand';

export interface Ritual {
  id: string;
  name: string;
  type: 'morning' | 'evening';
}

const INCENTIVE_QUOTES = [
  '每一个微小的坚持，都是对自己的温柔承诺。',
  '仪式感让平凡的日子闪闪发光。',
  '今天的你，又比昨天更靠近理想的自己。',
  '微小习惯的力量，远超你的想象。',
  '每一次打卡，都是与更好自己的相遇。',
  '坚持不需要完美，只需要真心。',
  '你值得为每一天赋予特别的意义。',
  '从一个小仪式开始，改变整个生活。',
  '此刻的你，正在创造未来的自己。',
  '把日常变成仪式，把生活变成艺术。',
];

interface StoreState {
  userId: string | null;
  isOnboarded: boolean;
  morningRituals: Ritual[];
  eveningRituals: Ritual[];
  selectedRitual: Ritual | null;
  checkInSuccess: boolean;
  incentiveQuote: string;

  setUserId: (id: string | null) => void;
  setOnboarded: (value: boolean) => void;
  setRituals: (type: 'morning' | 'evening', rituals: Ritual[]) => void;
  selectRitual: (ritual: Ritual | null) => void;
  setCheckInSuccess: (value: boolean) => void;
  setIncentiveQuote: (quote: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  userId: null,
  isOnboarded: false,
  morningRituals: [],
  eveningRituals: [],
  selectedRitual: null,
  checkInSuccess: false,
  incentiveQuote: INCENTIVE_QUOTES[Math.floor(Math.random() * INCENTIVE_QUOTES.length)],

  setUserId: (id) => set({ userId: id }),
  setOnboarded: (value) => set({ isOnboarded: value }),
  setRituals: (type, rituals) =>
    set((state) => ({
      ...state,
      [type === 'morning' ? 'morningRituals' : 'eveningRituals']: rituals,
    })),
  selectRitual: (ritual) => set({ selectedRitual: ritual }),
  setCheckInSuccess: (value) => set({ checkInSuccess: value }),
  setIncentiveQuote: (quote) => set({ incentiveQuote: quote }),
}));

export { INCENTIVE_QUOTES };
