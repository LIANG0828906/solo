import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Position, Trade, Portfolio, CandleData } from '../services/types';
import { marketSimulator } from '../data/marketSimulator';

interface TradeStore extends Portfolio {
  addPosition: (symbol: string, quantity: number, price: number) => void;
  closePosition: (positionId: string) => void;
  updatePrices: (price: number) => void;
  setBalance: (balance: number) => void;
  buy: (symbol: string, quantity: number) => void;
  sell: (positionId: string) => void;
}

const initialBalance = 100000;

export const useTradeStore = create<TradeStore>((set, get) => ({
  balance: initialBalance,
  positions: [],
  trades: [],
  totalPnl: 0,

  addPosition: (symbol: string, quantity: number, price: number) => {
    const cost = quantity * price;
    const { balance } = get();
    if (cost > balance) return;

    const position: Position = {
      id: uuidv4(),
      symbol,
      quantity,
      avgCost: price,
      currentPrice: price,
      openTime: Date.now(),
    };

    const trade: Trade = {
      id: uuidv4(),
      type: 'BUY',
      symbol,
      quantity,
      price,
      timestamp: Date.now(),
    };

    set((state) => ({
      balance: state.balance - cost,
      positions: [...state.positions, position],
      trades: [trade, ...state.trades].slice(0, 50),
    }));
  },

  closePosition: (positionId: string) => {
    const { positions } = get();
    const position = positions.find((p) => p.id === positionId);
    if (!position) return;

    const currentPrice = marketSimulator.getCurrentPrice();
    const revenue = position.quantity * currentPrice;
    const pnl = revenue - position.quantity * position.avgCost;

    const trade: Trade = {
      id: uuidv4(),
      type: 'SELL',
      symbol: position.symbol,
      quantity: position.quantity,
      price: currentPrice,
      timestamp: Date.now(),
      pnl,
    };

    set((state) => ({
      balance: state.balance + revenue,
      positions: state.positions.filter((p) => p.id !== positionId),
      trades: [trade, ...state.trades].slice(0, 50),
      totalPnl: state.totalPnl + pnl,
    }));
  },

  updatePrices: (price: number) => {
    set((state) => ({
      positions: state.positions.map((p) => ({
        ...p,
        currentPrice: price,
      })),
    }));
  },

  setBalance: (balance: number) => {
    set({ balance });
  },

  buy: (symbol: string, quantity: number) => {
    const price = marketSimulator.getCurrentPrice();
    get().addPosition(symbol, quantity, price);
  },

  sell: (positionId: string) => {
    get().closePosition(positionId);
  },
}));
