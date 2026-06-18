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
  fetchBookings: () => Promise<void>;
  addBooking: (data: Omit<Booking, 'id'>) => Promise<{ success: boolean; error?: string }>;
  removeBooking: (id: string) => Promise<boolean>;
}

export const useBookingStore = create<BookingState>((set) => ({
  bookings: [],

  fetchBookings: async () => {
    try {
      const res = await fetch('/api/bookings');
      if (res.ok) {
        const data: Booking[] = await res.json();
        set({ bookings: data });
      }
    } catch (e) {
      console.error('获取预订列表失败', e);
    }
  },

  addBooking: async (data) => {
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.status === 201) {
        await useBookingStore.getState().fetchBookings();
        return { success: true };
      } else {
        const err = await res.json();
        return { success: false, error: err.error || '预订失败' };
      }
    } catch (e) {
      return { success: false, error: '网络错误，请稍后重试' };
    }
  },

  removeBooking: async (id) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await useBookingStore.getState().fetchBookings();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },
}));
