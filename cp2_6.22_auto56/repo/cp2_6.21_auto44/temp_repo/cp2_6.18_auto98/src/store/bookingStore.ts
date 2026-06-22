import { create } from 'zustand';

export interface Booking {
  id: string;
  resourceType: 'desk' | 'room';
  resourceId: string;
  userName: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

interface BookingState {
  bookings: Booking[];
  error: string | null;
  fetchBookings: () => Promise<void>;
  addBooking: (data: Omit<Booking, 'id'>) => Promise<boolean>;
  removeBooking: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],
  error: null,

  fetchBookings: async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      set({ bookings: data });
    } catch (e) {
      console.error('Failed to fetch bookings:', e);
    }
  },

  addBooking: async (data) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.status === 409 || res.status === 400) {
        const errData = await res.json();
        set({ error: errData.error });
        return false;
      }

      if (res.ok) {
        set({ error: null });
        await useBookingStore.getState().fetchBookings();
        return true;
      }

      return false;
    } catch (e) {
      console.error('Failed to add booking:', e);
      set({ error: '网络错误，请稍后重试' });
      return false;
    }
  },

  removeBooking: async (id) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await useBookingStore.getState().fetchBookings();
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to remove booking:', e);
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));
