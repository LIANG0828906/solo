import { create } from 'zustand';
import type { Instrument, Bid, Notification } from '../types';

interface AppState {
  instruments: Instrument[];
  favorites: string[];
  compareIds: string[];
  bids: Bid[];
  notifications: Notification[];
  loading: boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addToCompare: (id: string) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  addInstrument: (instrument: Omit<Instrument, 'id' | 'sellerId' | 'createdAt'>) => void;
  addBid: (bid: Omit<Bid, 'id' | 'status' | 'createdAt'>) => void;
  updateBidStatus: (id: string, status: 'accepted' | 'rejected') => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

const mockInstruments: Instrument[] = [
  {
    id: '1',
    brand: '雅马哈',
    model: 'FG830',
    type: '吉他',
    purchaseYear: 2020,
    yearsUsed: 4,
    condition: 8,
    image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400',
    description: '雅马哈FG830民谣吉他，音质出色，保养良好，有轻微使用痕迹。',
    expectedPrice: 2800,
    estimatedPrice: 2600,
    sellerId: 'seller1',
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    brand: '芬达',
    model: 'Stratocaster',
    type: '吉他',
    purchaseYear: 2019,
    yearsUsed: 5,
    condition: 7,
    image: 'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=400',
    description: '芬达Stratocaster电吉他，经典款式，音色通透，附带原装琴包。',
    expectedPrice: 6500,
    estimatedPrice: 6100,
    sellerId: 'seller2',
    createdAt: '2024-02-20',
  },
  {
    id: '3',
    brand: '罗兰',
    model: 'TD-17KV',
    type: '鼓',
    purchaseYear: 2021,
    yearsUsed: 3,
    condition: 9,
    image: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400',
    description: '罗兰TD-17KV电子鼓，几乎全新，打击手感接近真鼓。',
    expectedPrice: 8500,
    estimatedPrice: 8200,
    sellerId: 'seller3',
    createdAt: '2024-03-10',
  },
  {
    id: '4',
    brand: '卡西欧',
    model: 'PX-S7000',
    type: '钢琴',
    purchaseYear: 2022,
    yearsUsed: 2,
    condition: 9,
    image: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400',
    description: '卡西欧PX-S7000电钢琴，88键逐级配重，音质优美。',
    expectedPrice: 5800,
    estimatedPrice: 5500,
    sellerId: 'seller4',
    createdAt: '2024-03-25',
  },
  {
    id: '5',
    brand: '马丁',
    model: 'D-28',
    type: '吉他',
    purchaseYear: 2018,
    yearsUsed: 6,
    condition: 7,
    image: 'https://images.unsplash.com/photo-1516924962500-2b4b3b99ea02?w=400',
    description: '马丁D-28全单民谣吉他，经典中的经典，开声完美。',
    expectedPrice: 15000,
    estimatedPrice: 14200,
    sellerId: 'seller5',
    createdAt: '2024-04-05',
  },
  {
    id: '6',
    brand: '塞尔玛',
    model: 'Series III',
    type: '萨克斯',
    purchaseYear: 2017,
    yearsUsed: 7,
    condition: 6,
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400',
    description: '塞尔玛Series III中音萨克斯，专业演奏级，音色温暖。',
    expectedPrice: 28000,
    estimatedPrice: 26500,
    sellerId: 'seller6',
    createdAt: '2024-04-18',
  },
  {
    id: '7',
    brand: '泰勒',
    model: '814ce',
    type: '吉他',
    purchaseYear: 2020,
    yearsUsed: 4,
    condition: 8,
    image: 'https://images.unsplash.com/photo-1558098329-a11cff621064?w=400',
    description: '泰勒814ce民谣吉他，做工精致，手感极佳。',
    expectedPrice: 12000,
    estimatedPrice: 11400,
    sellerId: 'seller7',
    createdAt: '2024-05-02',
  },
  {
    id: '8',
    brand: '吉布森',
    model: 'Les Paul',
    type: '吉他',
    purchaseYear: 2016,
    yearsUsed: 8,
    condition: 6,
    image: 'https://images.unsplash.com/photo-1562887284-3ea632b7485a?w=400',
    description: '吉布森Les Paul电吉他，复古音色，品丝有正常磨损。',
    expectedPrice: 18000,
    estimatedPrice: 17000,
    sellerId: 'seller8',
    createdAt: '2024-05-15',
  },
];

const mockBids: Bid[] = [
  {
    id: 'bid1',
    instrumentId: '1',
    instrumentName: '雅马哈 FG830',
    buyerName: '张三',
    amount: 2500,
    status: 'pending',
    createdAt: '2024-05-20',
  },
  {
    id: 'bid2',
    instrumentId: '2',
    instrumentName: '芬达 Stratocaster',
    buyerName: '李四',
    amount: 6000,
    status: 'pending',
    createdAt: '2024-05-21',
  },
  {
    id: 'bid3',
    instrumentId: '1',
    instrumentName: '雅马哈 FG830',
    buyerName: '王五',
    amount: 2700,
    status: 'pending',
    createdAt: '2024-05-22',
  },
];

let idCounter = 100;
const generateId = () => `id_${++idCounter}`;

export const useStore = create<AppState>((set, get) => ({
  instruments: mockInstruments,
  favorites: ['1', '3'],
  compareIds: [],
  bids: mockBids,
  notifications: [],
  loading: false,

  addFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id) ? state.favorites : [...state.favorites, id],
    })),

  removeFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.filter((fid) => fid !== id),
      compareIds: state.compareIds.filter((cid) => cid !== id),
    })),

  toggleFavorite: (id) =>
    set((state) => {
      if (state.favorites.includes(id)) {
        return {
          favorites: state.favorites.filter((fid) => fid !== id),
          compareIds: state.compareIds.filter((cid) => cid !== id),
        };
      }
      return { favorites: [...state.favorites, id] };
    }),

  addToCompare: (id) =>
    set((state) => {
      if (state.compareIds.includes(id)) return state;
      if (state.compareIds.length >= 3) return state;
      return { compareIds: [...state.compareIds, id] };
    }),

  removeFromCompare: (id) =>
    set((state) => ({
      compareIds: state.compareIds.filter((cid) => cid !== id),
    })),

  clearCompare: () => set({ compareIds: [] }),

  addInstrument: (instrument) =>
    set((state) => ({
      instruments: [
        {
          ...instrument,
          id: generateId(),
          sellerId: 'currentUser',
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...state.instruments,
      ],
    })),

  addBid: (bid) =>
    set((state) => ({
      bids: [
        {
          ...bid,
          id: generateId(),
          status: 'pending',
          createdAt: new Date().toISOString().split('T')[0],
        },
        ...state.bids,
      ],
    })),

  updateBidStatus: (id, status) =>
    set((state) => ({
      bids: state.bids.map((bid) => (bid.id === id ? { ...bid, status } : bid)),
    })),

  addNotification: (notification) => {
    const id = generateId();
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    setTimeout(() => {
      get().removeNotification(id);
    }, 3000);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  setLoading: (loading) => set({ loading }),
}));
