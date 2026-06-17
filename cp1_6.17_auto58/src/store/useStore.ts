import { create } from 'zustand';
import type { Work, Booking, Category, BookingRequest } from '../types';
import * as api from '../services/api';

interface State {
  works: Work[];
  bookings: Booking[];
  selectedCategory: Category;
  selectedWork: Work | null;
  isModalOpen: boolean;
  isSuccessModalOpen: boolean;
  loading: boolean;
  error: string | null;
}

interface Actions {
  fetchWorks: () => Promise<void>;
  fetchBookings: () => Promise<void>;
  setSelectedCategory: (category: Category) => void;
  openWorkModal: (work: Work) => void;
  closeWorkModal: () => void;
  openSuccessModal: () => void;
  closeSuccessModal: () => void;
  createBooking: (data: BookingRequest) => Promise<boolean>;
  updateBookingStatus: (id: string, status: Booking['status']) => Promise<void>;
}

const useStore = create<State & Actions>((set, get) => ({
  works: [],
  bookings: [],
  selectedCategory: 'all',
  selectedWork: null,
  isModalOpen: false,
  isSuccessModalOpen: false,
  loading: false,
  error: null,

  fetchWorks: async () => {
    set({ loading: true, error: null });
    try {
      const { selectedCategory } = get();
      const works = await api.fetchWorks(selectedCategory);
      set({ works, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch works', loading: false });
    }
  },

  fetchBookings: async () => {
    set({ loading: true, error: null });
    try {
      const bookings = await api.fetchBookings();
      set({ bookings, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch bookings', loading: false });
    }
  },

  setSelectedCategory: (category: Category) => {
    set({ selectedCategory: category });
  },

  openWorkModal: (work: Work) => {
    set({ selectedWork: work, isModalOpen: true });
  },

  closeWorkModal: () => {
    set({ isModalOpen: false, selectedWork: null });
  },

  openSuccessModal: () => {
    set({ isSuccessModalOpen: true });
  },

  closeSuccessModal: () => {
    set({ isSuccessModalOpen: false });
  },

  createBooking: async (data: BookingRequest) => {
    set({ loading: true, error: null });
    try {
      await api.createBooking(data);
      set({ loading: false });
      get().openSuccessModal();
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create booking', loading: false });
      return false;
    }
  },

  updateBookingStatus: async (id: string, status: Booking['status']) => {
    set({ loading: true, error: null });
    try {
      await api.updateBookingStatus(id, status);
      await get().fetchBookings();
      set({ loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update booking status', loading: false });
    }
  },
}));

export default useStore;
