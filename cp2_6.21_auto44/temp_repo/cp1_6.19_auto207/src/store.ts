import { create } from 'zustand';
import { ChargingStation, Booking } from './types';

interface AppState {
  stations: ChargingStation[];
  bookings: Booking[];
  setStations: (stations: ChargingStation[]) => void;
  setBookings: (bookings: Booking[]) => void;
  addBooking: (booking: Booking) => void;
  removeBooking: (id: string) => void;
  fetchData: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  stations: [],
  bookings: [],
  setStations: (stations) => set({ stations }),
  setBookings: (bookings) => set({ bookings }),
  addBooking: (booking) =>
    set((state) => ({ bookings: [booking, ...state.bookings] })),
  removeBooking: (id) =>
    set((state) => ({ bookings: state.bookings.filter((b) => b.id !== id) })),
  fetchData: async () => {
    try {
      const [stationsRes, bookingsRes] = await Promise.all([
        fetch('/api/stations'),
        fetch('/api/bookings'),
      ]);
      const stations = await stationsRes.json();
      const bookings = await bookingsRes.json();
      set({ stations, bookings });
    } catch (e) {
      console.error('Failed to fetch data', e);
    }
  },
}));
