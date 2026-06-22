import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PawnItem, PawnStoreState, ValuationResult } from '../types';

interface PawnStore extends PawnStoreState {
  setCurrentItem: (item: PawnItem | null) => void;
  setCurrentStep: (step: PawnStoreState['currentStep']) => void;
  addPawn: (item: PawnItem) => void;
  redeem: (itemId: string) => void;
  markDead: (itemId: string) => void;
  moveToMarket: (itemId: string, price: number) => void;
  sellItem: (itemId: string) => void;
  updateItemValuation: (itemId: string, valuation: ValuationResult) => void;
  checkDeadPawns: () => void;
  setBalance: (balance: number) => void;
  loadItems: (items: PawnItem[]) => void;
}

export const usePawnStore = create<PawnStore>()(
  persist(
    (set, get) => ({
      items: [],
      currentItem: null,
      balance: 10000,
      deadPawnItems: [],
      marketItems: [],
      currentStep: 'idle',

      setCurrentItem: (item) => set({ currentItem: item, currentStep: 'idle' }),
      setCurrentStep: (step) => set({ currentStep: step }),

      addPawn: (item) => {
        const { items, balance } = get();
        set({
          items: [...items, item],
          balance: balance - item.pawnAmount,
          currentItem: null,
          currentStep: 'idle'
        });
      },

      redeem: (itemId) => {
        const { items } = get();
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const monthsPaid = 6;
        const interest = item.pawnAmount * item.monthlyInterest * monthsPaid;
        const totalRedeem = item.pawnAmount + interest;

        set({
          items: items.map(i => 
            i.id === itemId 
              ? { ...i, status: 'redeemed' as const }
              : i
          ),
          balance: get().balance + totalRedeem
        });
      },

      markDead: (itemId) => {
        const { items, deadPawnItems } = get();
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        set({
          items: items.map(i => 
            i.id === itemId 
              ? { ...i, status: 'dead' as const }
              : i
          ),
          deadPawnItems: [...deadPawnItems, { ...item, status: 'dead' as const }]
        });
      },

      moveToMarket: (itemId, price) => {
        const { deadPawnItems, marketItems } = get();
        const item = deadPawnItems.find(i => i.id === itemId);
        if (!item) return;

        const updatedItem = { ...item, marketPrice: price, status: 'dead' as const };
        set({
          deadPawnItems: deadPawnItems.filter(i => i.id !== itemId),
          marketItems: [...marketItems, updatedItem]
        });
      },

      sellItem: (itemId) => {
        const { marketItems, items, balance } = get();
        const item = marketItems.find(i => i.id === itemId);
        if (!item || !item.marketPrice) return;

        set({
          marketItems: marketItems.filter(i => i.id !== itemId),
          items: items.map(i => 
            i.id === itemId 
              ? { ...i, status: 'sold' as const, sellDate: new Date().toISOString() }
              : i
          ),
          balance: balance + item.marketPrice
        });
      },

      updateItemValuation: (itemId, valuation) => {
        const { currentItem, items } = get();
        if (currentItem && currentItem.id === itemId) {
          set({
            currentItem: {
              ...currentItem,
              pawnAmount: valuation.pawnAmount,
              originalValue: valuation.baseValue
            }
          });
        }
        set({
          items: items.map(i => 
            i.id === itemId 
              ? { ...i, pawnAmount: valuation.pawnAmount, originalValue: valuation.baseValue }
              : i
          )
        });
      },

      checkDeadPawns: () => {
        const { items } = get();
        const now = new Date();
        const gracePeriod = 30 * 24 * 60 * 60 * 1000;

        items.forEach(item => {
          if (item.status === 'active') {
            const expireDate = new Date(item.expireDate);
            const daysSinceExpire = now.getTime() - expireDate.getTime();
            
            if (daysSinceExpire > gracePeriod) {
              get().markDead(item.id);
            }
          }
        });
      },

      setBalance: (balance) => set({ balance }),

      loadItems: (items) => set({ items })
    }),
    {
      name: 'pawnshop-storage',
      partialize: (state) => ({
        items: state.items,
        balance: state.balance,
        deadPawnItems: state.deadPawnItems,
        marketItems: state.marketItems
      })
    }
  )
);
