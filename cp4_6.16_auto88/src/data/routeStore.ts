import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { AppState, RouteActions, Route, Restaurant, GeoPoint, ToastMessage } from '@/types';

const IDBStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const value = await get(name);
      return value ?? null;
    } catch {
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await set(name, value);
    } catch {
      console.error('Failed to save to IndexedDB');
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await set(name, null as unknown as string);
    } catch {
      console.error('Failed to remove from IndexedDB');
    }
  },
};

const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const initialState: AppState = {
  currentRoute: null,
  savedRoutes: [],
  favoriteRestaurants: [],
  origin: null,
  destination: null,
  isPlanning: false,
  toast: null,
};

export const useRouteStore = create<AppState & RouteActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setOrigin: (point: GeoPoint | null) => set({ origin: point }),
      
      setDestination: (point: GeoPoint | null) => set({ destination: point }),
      
      setCurrentRoute: (route: Route | null) => set({ currentRoute: route }),
      
      addRoute: (route: Route) => {
        const { savedRoutes } = get();
        const exists = savedRoutes.some(r => r.id === route.id);
        if (!exists) {
          set({ savedRoutes: [route, ...savedRoutes] });
        }
      },
      
      removeRoute: (routeId: string) => {
        const { savedRoutes, currentRoute } = get();
        set({
          savedRoutes: savedRoutes.filter(r => r.id !== routeId),
          currentRoute: currentRoute?.id === routeId ? null : currentRoute,
        });
      },
      
      toggleFavorite: (restaurant: Restaurant) => {
        const { favoriteRestaurants } = get();
        const exists = favoriteRestaurants.some(r => r.id === restaurant.id);
        if (exists) {
          set({
            favoriteRestaurants: favoriteRestaurants.filter(r => r.id !== restaurant.id),
          });
        } else {
          set({
            favoriteRestaurants: [restaurant, ...favoriteRestaurants],
          });
        }
      },
      
      setIsPlanning: (planning: boolean) => set({ isPlanning: planning }),
      
      showToast: (message: Omit<ToastMessage, 'id'>) => {
        const toast: ToastMessage = {
          id: uuidv4(),
          ...message,
        };
        set({ toast });
        setTimeout(() => {
          if (get().toast?.id === toast.id) {
            set({ toast: null });
          }
        }, 3000);
      },
      
      hideToast: () => set({ toast: null }),
      
      generateShareCode: (routeId: string): string => {
        const { savedRoutes } = get();
        const code = generateShareCode();
        const updatedRoutes = savedRoutes.map(r =>
          r.id === routeId ? { ...r, shareCode: code } : r
        );
        set({ savedRoutes: updatedRoutes });
        return code;
      },
      
      loadFromStorage: async () => {
        try {
          const routesStr = await IDBStorage.getItem('savedRoutes');
          const favoritesStr = await IDBStorage.getItem('favoriteRestaurants');
          
          if (routesStr) {
            set({ savedRoutes: JSON.parse(routesStr) });
          }
          if (favoritesStr) {
            set({ favoriteRestaurants: JSON.parse(favoritesStr) });
          }
        } catch (error) {
          console.error('Failed to load from storage:', error);
        }
      },
    }),
    {
      name: 'roadrecipe-storage',
      storage: createJSONStorage(() => IDBStorage),
      partialize: (state) => ({
        savedRoutes: state.savedRoutes,
        favoriteRestaurants: state.favoriteRestaurants,
      }),
    }
  )
);
