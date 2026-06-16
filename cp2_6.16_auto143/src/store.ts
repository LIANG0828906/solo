import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { Market, Booth, DateFilter, TypeFilter, AppState, AppActions } from '@/types';
import { mockMarkets } from '@/data/mockData';

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name);
    return value ? String(value) : null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

type StoreState = AppState & AppActions;

export const useAppStore = create<StoreState>()(
  persist(
    (set, get) => ({
      markets: mockMarkets,
      favorites: [],
      selectedMarketId: null,
      dateFilter: 'all',
      typeFilter: 'all',
      isAdmin: false,
      sidebarOpen: true,
      routeBooths: [],
      showRoute: false,

      toggleFavorite: (marketId: string) => {
        const { favorites } = get();
        const newFavorites = favorites.includes(marketId)
          ? favorites.filter(id => id !== marketId)
          : [...favorites, marketId];
        set({ favorites: newFavorites });
      },

      setSelectedMarket: (marketId: string | null) => {
        set({ selectedMarketId: marketId, routeBooths: [], showRoute: false });
      },

      setDateFilter: (filter: DateFilter) => {
        set({ dateFilter: filter });
      },

      setTypeFilter: (filter: TypeFilter) => {
        set({ typeFilter: filter });
      },

      toggleAdmin: () => {
        set({ isAdmin: !get().isAdmin });
      },

      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },

      addBooth: (marketId: string, booth: Omit<Booth, 'id'>) => {
        const newBooth: Booth = {
          ...booth,
          id: uuidv4(),
        };
        set(state => ({
          markets: state.markets.map(market =>
            market.id === marketId
              ? { ...market, booths: [...market.booths, newBooth] }
              : market
          ),
        }));
      },

      approveBooth: (marketId: string, boothId: string) => {
        set(state => ({
          markets: state.markets.map(market =>
            market.id === marketId
              ? {
                  ...market,
                  booths: market.booths.map(booth =>
                    booth.id === boothId ? { ...booth, status: 'approved' as const } : booth
                  ),
                }
              : market
          ),
        }));
      },

      rejectBooth: (marketId: string, boothId: string) => {
        set(state => ({
          markets: state.markets.map(market =>
            market.id === marketId
              ? {
                  ...market,
                  booths: market.booths.map(booth =>
                    booth.id === boothId ? { ...booth, status: 'rejected' as const } : booth
                  ),
                }
              : market
          ),
        }));
      },

      toggleRouteBooth: (boothId: string) => {
        const { routeBooths } = get();
        const newRouteBooths = routeBooths.includes(boothId)
          ? routeBooths.filter(id => id !== boothId)
          : [...routeBooths, boothId];
        set({ routeBooths: newRouteBooths });
      },

      setShowRoute: (show: boolean) => {
        set({ showRoute: show });
      },

      clearRouteBooths: () => {
        set({ routeBooths: [], showRoute: false });
      },
    }),
    {
      name: 'bazaar-hub-storage',
      storage: createJSONStorage(() => idbStorage),
      partialize: state => ({
        favorites: state.favorites,
        markets: state.markets,
        isAdmin: state.isAdmin,
      }),
    }
  )
);

export const selectFilteredMarkets = (state: StoreState): Market[] => {
  const { markets, dateFilter, typeFilter } = state;
  const today = new Date('2026-06-16');
  
  return markets.filter(market => {
    if (typeFilter !== 'all' && market.type !== typeFilter && typeFilter !== 'all') {
      if (market.type !== typeFilter) return false;
    }
    
    const marketDate = new Date(market.date);
    const diffTime = marketDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (dateFilter === 'thisWeekend') {
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      const thisSaturday = new Date(today);
      thisSaturday.setDate(today.getDate() + daysUntilSaturday);
      const thisSunday = new Date(thisSaturday);
      thisSunday.setDate(thisSaturday.getDate() + 1);
      
      return marketDate >= thisSaturday && marketDate <= thisSunday;
    }
    
    if (dateFilter === 'nextWeekend') {
      const dayOfWeek = today.getDay();
      const daysUntilSaturday = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      const nextSaturday = new Date(today);
      nextSaturday.setDate(today.getDate() + daysUntilSaturday + 7);
      const nextSunday = new Date(nextSaturday);
      nextSunday.setDate(nextSaturday.getDate() + 1);
      
      return marketDate >= nextSaturday && marketDate <= nextSunday;
    }
    
    if (dateFilter === 'thisMonth') {
      return diffDays <= 30 && diffDays >= 0;
    }
    
    return true;
  });
};
