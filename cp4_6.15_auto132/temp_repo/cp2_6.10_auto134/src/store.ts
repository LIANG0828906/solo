import { create } from 'zustand';
import type { Goods, Transaction, CurrencyRate } from './types';
import { generateId, calculateTax, formatTangTime, convertFromCopper } from './utils';

interface LedgerState {
  goods: Goods[];
  transactions: Transaction[];
  selectedGoodsId: string | null;
  currencyRates: Record<string, CurrencyRate>;
  taxRate: number;
  loading: boolean;
  hasStamp: boolean;
  filters: {
    goodsName: string;
    buyerOrigin: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  setFilters: (filters: Partial<LedgerState['filters']>) => void;
  fetchGoods: () => Promise<void>;
  fetchTransactions: (page?: number) => Promise<void>;
  selectGoods: (id: string | null) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'timeStr' | 'tax'>) => Promise<void>;
  toggleStamp: () => void;
  getSafeStock: (goods: Goods) => number;
  isLowStock: (goods: Goods) => boolean;
  getDailyStats: () => {
    totalRevenue: number;
    totalTax: number;
    totalProfit: number;
    stockChanges: { goods: Goods; change: number; initialStock: number }[];
  };
}

const initialCurrencyRates: Record<string, CurrencyRate> = {
  '铜钱': { name: '铜钱', rate: 1, symbol: '文' },
  '波斯银币': { name: '波斯银币', rate: 80, symbol: '银币' },
  '拜占庭金币': { name: '拜占庭金币', rate: 420, symbol: '金币' },
};

export const useLedgerStore = create<LedgerState>((set, get) => ({
  goods: [],
  transactions: [],
  selectedGoodsId: null,
  currencyRates: initialCurrencyRates,
  taxRate: 0.02,
  loading: false,
  hasStamp: false,
  filters: {
    goodsName: '',
    buyerOrigin: '',
  },
  pagination: {
    page: 1,
    pageSize: 200,
    total: 0,
  },

  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
    pagination: { ...state.pagination, page: 1 },
  })),

  fetchGoods: async () => {
    set({ loading: true });
    try {
      const res = await fetch('/api/goods');
      const data = await res.json();
      set({ goods: data, loading: false });
    } catch (e) {
      console.error('Failed to fetch goods:', e);
      set({ loading: false });
    }
  },

  fetchTransactions: async (page = 1) => {
    set({ loading: true });
    try {
      const { goodsName, buyerOrigin } = get().filters;
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(get().pagination.pageSize),
        goodsName,
        buyerOrigin,
      });
      const res = await fetch(`/api/transactions?${params}`);
      const data = await res.json();
      set({
        transactions: data.transactions,
        pagination: {
          ...get().pagination,
          page,
          total: data.total,
        },
        loading: false,
      });
    } catch (e) {
      console.error('Failed to fetch transactions:', e);
      set({ loading: false });
    }
  },

  selectGoods: (id) => set({ selectedGoodsId: id }),

  addTransaction: async (txData) => {
    const now = Date.now();
    const tax = calculateTax(txData.totalPrice, get().taxRate);
    
    const tx: Transaction = {
      ...txData,
      id: generateId(),
      timestamp: now,
      timeStr: formatTangTime(now),
      tax,
    };

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      const savedTx = await res.json();

      set((state) => ({
        transactions: [savedTx, ...state.transactions],
        goods: state.goods.map((g) =>
          g.id === txData.goodsId
            ? { ...g, stock: g.stock - txData.quantity, quarterSales: g.quarterSales + txData.quantity }
            : g
        ),
      }));
    } catch (e) {
      console.error('Failed to save transaction:', e);
    }
  },

  toggleStamp: () => set((state) => ({ hasStamp: !state.hasStamp })),

  getSafeStock: (goods) => Math.round(goods.quarterSales * 0.2),

  isLowStock: (goods) => goods.stock <= Math.round(goods.quarterSales * 0.2),

  getDailyStats: () => {
    const { transactions, goods } = get();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    const todayTxs = transactions.filter((t) => t.timestamp >= todayStart);
    const totalRevenue = todayTxs.reduce((sum, t) => sum + t.totalPrice, 0);
    const totalTax = todayTxs.reduce((sum, t) => sum + t.tax, 0);
    const totalProfit = totalRevenue - totalTax;

    const stockChanges = goods.map((g) => {
      const sold = todayTxs
        .filter((t) => t.goodsId === g.id)
        .reduce((sum, t) => sum + t.quantity, 0);
      return {
        goods: g,
        change: -sold,
        initialStock: g.stock + sold,
      };
    });

    return { totalRevenue, totalTax, totalProfit, stockChanges };
  },
}));
