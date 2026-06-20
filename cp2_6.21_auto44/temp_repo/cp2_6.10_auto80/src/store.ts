import { create } from 'zustand';
import { Drink, Vessel, Shichen, TransactionRecord, OrderResponse, GambleResult } from './types';

interface TavernState {
  drinks: Drink[];
  vessels: Vessel[];
  shichens: Shichen[];
  records: TransactionRecord[];
  selectedDrink: string | null;
  selectedVessel: string | null;
  selectedShichen: string | null;
  quantity: number;
  ivoryChips: number;
  silkBolts: number;
  customerName: string;
  lastBill: OrderResponse['bill'] | null;
  errorMessage: string | null;
  gamblePopup: GambleResult | null;
  newRecordId: string | null;
  fetchDrinks: () => Promise<void>;
  fetchVessels: () => Promise<void>;
  fetchShichens: () => Promise<void>;
  fetchRecords: (startDate?: string, endDate?: string) => Promise<void>;
  submitOrder: () => Promise<void>;
  triggerGamble: () => Promise<void>;
  setSelectedDrink: (id: string | null) => void;
  setSelectedVessel: (id: string | null) => void;
  setSelectedShichen: (id: string | null) => void;
  setQuantity: (q: number) => void;
  setIvoryChips: (n: number) => void;
  setSilkBolts: (n: number) => void;
  setCustomerName: (name: string) => void;
  clearBill: () => void;
  clearGamble: () => void;
  clearNewRecord: () => void;
  updateInventory: () => Promise<void>;
}

export const useTavernStore = create<TavernState>((set, get) => ({
  drinks: [],
  vessels: [],
  shichens: [],
  records: [],
  selectedDrink: null,
  selectedVessel: 'porcelain',
  selectedShichen: null,
  quantity: 1,
  ivoryChips: 0,
  silkBolts: 0,
  customerName: '',
  lastBill: null,
  errorMessage: null,
  gamblePopup: null,
  newRecordId: null,

  fetchDrinks: async () => {
    const res = await fetch('/api/drinks');
    const data = await res.json();
    set({ drinks: data });
  },

  fetchVessels: async () => {
    const res = await fetch('/api/items');
    const data = await res.json();
    set({ vessels: data });
  },

  fetchShichens: async () => {
    const res = await fetch('/api/shichens');
    const data = await res.json();
    const hour = new Date().getHours();
    const shichenIndex = ((hour + 1) % 24) >> 1;
    set({ shichens: data, selectedShichen: data[shichenIndex]?.id || null });
  },

  fetchRecords: async (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const res = await fetch(`/api/records?${params.toString()}`);
    const data = await res.json();
    set({ records: data });
  },

  submitOrder: async () => {
    const { selectedDrink, selectedVessel, selectedShichen, quantity, ivoryChips, silkBolts, customerName } = get();
    
    if (!selectedDrink || !selectedVessel || !selectedShichen) {
      set({ errorMessage: '请选择酒水、器皿和时辰' });
      return;
    }

    if (quantity <= 0) {
      set({ errorMessage: '请输入有效数量' });
      return;
    }

    set({ errorMessage: null });

    const res = await fetch('/api/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        drinkId: selectedDrink,
        quantity,
        vesselId: selectedVessel,
        shichenId: selectedShichen,
        customerName,
        payment: { ivoryChips, silkBolts }
      })
    });

    const data: OrderResponse = await res.json();
    
    if (data.success && data.bill && data.record) {
      set({ 
        lastBill: data.bill, 
        newRecordId: data.record.id,
        ivoryChips: 0,
        silkBolts: 0
      });
      get().fetchDrinks();
      get().fetchRecords();
    } else {
      set({ errorMessage: data.message || '下单失败' });
    }
  },

  triggerGamble: async () => {
    const res = await fetch('/api/gamble', { method: 'POST' });
    const data: GambleResult = await res.json();
    set({ gamblePopup: data, newRecordId: data.record.id });
    get().fetchRecords();
  },

  setSelectedDrink: (id) => set({ selectedDrink: id }),
  setSelectedVessel: (id) => set({ selectedVessel: id }),
  setSelectedShichen: (id) => set({ selectedShichen: id }),
  setQuantity: (q) => set({ quantity: q }),
  setIvoryChips: (n) => set({ ivoryChips: Math.max(0, Math.min(100, n)) }),
  setSilkBolts: (n) => set({ silkBolts: Math.max(0, Math.min(10, n)) }),
  setCustomerName: (name) => set({ customerName: name }),
  clearBill: () => set({ lastBill: null }),
  clearGamble: () => set({ gamblePopup: null }),
  clearNewRecord: () => set({ newRecordId: null }),

  updateInventory: async () => {
    const res = await fetch('/api/inventory');
    const data = await res.json();
    set({ drinks: data });
  }
}));
