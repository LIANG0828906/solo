import { create } from 'zustand';
import { MenuItem, Booking, BookingItem, PurchaseList } from '../../types';

interface MenuState {
  menuItems: MenuItem[];
  bookings: Booking[];
  purchaseList: PurchaseList | null;
  selectedBookingItems: BookingItem[];
  isLoading: boolean;
  error: string | null;

  setMenuItems: (items: MenuItem[]) => void;
  addMenuItem: (item: MenuItem) => void;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  removeMenuItem: (id: string) => void;

  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;

  setPurchaseList: (list: PurchaseList | null) => void;

  addBookingItem: (item: BookingItem) => void;
  removeBookingItem: (menuItemId: string) => void;
  updateBookingItemQuantity: (menuItemId: string, quantity: number) => void;
  clearBookingItems: () => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  menuItems: [],
  bookings: [],
  purchaseList: null,
  selectedBookingItems: [],
  isLoading: false,
  error: null,

  setMenuItems: (items) => set({ menuItems: items }),
  addMenuItem: (item) =>
    set((state) => ({ menuItems: [...state.menuItems, item] })),
  updateMenuItem: (id, updates) =>
    set((state) => ({
      menuItems: state.menuItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),
  removeMenuItem: (id) =>
    set((state) => ({
      menuItems: state.menuItems.filter((item) => item.id !== id),
    })),

  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) =>
    set((state) => ({ bookings: [...state.bookings, booking] })),
  updateBooking: (id, updates) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  setPurchaseList: (list) => set({ purchaseList: list }),

  addBookingItem: (item) =>
    set((state) => {
      const existing = state.selectedBookingItems.find(
        (i) => i.menuItemId === item.menuItemId
      );
      if (existing) {
        return {
          selectedBookingItems: state.selectedBookingItems.map((i) =>
            i.menuItemId === item.menuItemId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { selectedBookingItems: [...state.selectedBookingItems, item] };
    }),
  removeBookingItem: (menuItemId) =>
    set((state) => ({
      selectedBookingItems: state.selectedBookingItems.filter(
        (i) => i.menuItemId !== menuItemId
      ),
    })),
  updateBookingItemQuantity: (menuItemId, quantity) =>
    set((state) => ({
      selectedBookingItems: state.selectedBookingItems.map((i) =>
        i.menuItemId === menuItemId ? { ...i, quantity } : i
      ),
    })),
  clearBookingItems: () => set({ selectedBookingItems: [] }),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
