import { create } from 'zustand';
import { get, set, del, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Facility, Booking, User, FacilityStats, DailyStats } from './types';

const FACILITIES_KEY = 'facilities';
const BOOKINGS_KEY = 'bookings';
const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'currentUser';

interface FacilityStore {
  facilities: Facility[];
  bookings: Booking[];
  users: User[];
  currentUser: User | null;
  loading: boolean;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;

  init: () => Promise<void>;
  setCurrentUser: (userId: string) => Promise<void>;

  addFacility: (facility: Omit<Facility, 'id'>) => Promise<Facility>;
  updateFacility: (id: string, data: Partial<Facility>) => Promise<void>;
  deleteFacility: (id: string) => Promise<void>;

  addBooking: (booking: Omit<Booking, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<Booking>;
  approveBooking: (id: string) => Promise<void>;
  rejectBooking: (id: string, reason: string, suggestion?: string) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;

  getUserBookings: (userId: string) => Booking[];
  getFacilityBookings: (facilityId: string) => Booking[];
  getPendingBookings: () => Booking[];

  getFacilityStats: (days: number) => FacilityStats[];
  getDailyStats: (days: number) => DailyStats[];

  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  clearNotification: () => void;
}

export const useFacilityStore = create<FacilityStore>((set, get) => ({
  facilities: [],
  bookings: [],
  users: [],
  currentUser: null,
  loading: true,
  notification: null,

  init: async () => {
    try {
      const [facilities, bookings, users, currentUserId] = await Promise.all([
        get<Facility[]>(FACILITIES_KEY),
        get<Booking[]>(BOOKINGS_KEY),
        get<User[]>(USERS_KEY),
        get<string>(CURRENT_USER_KEY),
      ]);

      let finalFacilities = facilities || [];
      let finalUsers = users || [];
      let finalBookings = bookings || [];

      if (finalFacilities.length === 0) {
        finalFacilities = [
          {
            id: uuidv4(),
            name: '多功能会议室',
            description: '可容纳20人的会议室，配备投影仪和白板',
            maxCapacity: 20,
            openHour: 8,
            closeHour: 22,
            feePerHour: 50,
            icon: '🏢',
          },
          {
            id: uuidv4(),
            name: '健身房',
            description: '配备有氧器械和力量训练设备',
            maxCapacity: 15,
            openHour: 6,
            closeHour: 22,
            feePerHour: 20,
            icon: '🏋️',
          },
          {
            id: uuidv4(),
            name: '游泳池',
            description: '25米标准泳道，恒温泳池',
            maxCapacity: 30,
            openHour: 7,
            closeHour: 21,
            feePerHour: 30,
            icon: '🏊',
          },
          {
            id: uuidv4(),
            name: '乒乓球室',
            description: '3张标准球台',
            maxCapacity: 12,
            openHour: 8,
            closeHour: 22,
            feePerHour: 15,
            icon: '🏓',
          },
        ];
        await set(FACILITIES_KEY, finalFacilities);
      }

      if (finalUsers.length === 0) {
        finalUsers = [
          { id: 'admin-1', name: '物业管理员', role: 'admin' },
          { id: 'user-1', name: '张三', role: 'resident', roomNumber: 'A栋101' },
          { id: 'user-2', name: '李四', role: 'resident', roomNumber: 'B栋203' },
        ];
        await set(USERS_KEY, finalUsers);
      }

      let currentUser = finalUsers.find((u) => u.id === currentUserId) || null;
      if (!currentUser) {
        currentUser = finalUsers[1];
        await set(CURRENT_USER_KEY, currentUser.id);
      }

      set({
        facilities: finalFacilities,
        bookings: finalBookings,
        users: finalUsers,
        currentUser,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to initialize store:', error);
      set({ loading: false });
    }
  },

  setCurrentUser: async (userId: string) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
      await set(CURRENT_USER_KEY, userId);
    }
  },

  addFacility: async (facility) => {
    const newFacility: Facility = { ...facility, id: uuidv4() };
    const facilities = [...get().facilities, newFacility];
    set({ facilities });
    await set(FACILITIES_KEY, facilities);
    return newFacility;
  },

  updateFacility: async (id, data) => {
    const facilities = get().facilities.map((f) =>
      f.id === id ? { ...f, ...data } : f
    );
    set({ facilities });
    await set(FACILITIES_KEY, facilities);
  },

  deleteFacility: async (id) => {
    const facilities = get().facilities.filter((f) => f.id !== id);
    const bookings = get().bookings.filter((b) => b.facilityId !== id);
    set({ facilities, bookings });
    await Promise.all([set(FACILITIES_KEY, facilities), set(BOOKINGS_KEY, bookings)]);
  },

  addBooking: async (booking) => {
    const newBooking: Booking = {
      ...booking,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const bookings = [...get().bookings, newBooking];
    set({ bookings });
    await set(BOOKINGS_KEY, bookings);
    return newBooking;
  },

  approveBooking: async (id) => {
    const bookings = get().bookings.map((b) =>
      b.id === id
        ? { ...b, status: 'confirmed' as const, updatedAt: new Date().toISOString() }
        : b
    );
    set({ bookings });
    await set(BOOKINGS_KEY, bookings);
  },

  rejectBooking: async (id, reason, suggestion) => {
    const bookings = get().bookings.map((b) =>
      b.id === id
        ? {
            ...b,
            status: 'rejected' as const,
            rejectReason: reason,
            rejectSuggestion: suggestion,
            updatedAt: new Date().toISOString(),
          }
        : b
    );
    set({ bookings });
    await set(BOOKINGS_KEY, bookings);
  },

  deleteBooking: async (id) => {
    const bookings = get().bookings.filter((b) => b.id !== id);
    set({ bookings });
    await set(BOOKINGS_KEY, bookings);
  },

  getUserBookings: (userId) => {
    return get()
      .bookings.filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  getFacilityBookings: (facilityId) => {
    return get().bookings.filter((b) => b.facilityId === facilityId);
  },

  getPendingBookings: () => {
    return get()
      .bookings.filter((b) => b.status === 'pending')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  getFacilityStats: (days) => {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const facilities = get().facilities;

    return facilities.map((f) => {
      const relevantBookings = get().bookings.filter(
        (b) =>
          b.facilityId === f.id &&
          b.status !== 'rejected' &&
          new Date(b.startTime) >= start
      );
      const totalHours = (f.closeHour - f.openHour) * days;
      const bookedHours = relevantBookings.reduce((acc, b) => {
        const s = new Date(b.startTime).getTime();
        const e = new Date(b.endTime).getTime();
        return acc + (e - s) / (1000 * 60 * 60);
      }, 0);
      return {
        facilityId: f.id,
        facilityName: f.name,
        totalBookings: relevantBookings.length,
        utilizationRate: totalHours > 0 ? Math.round((bookedHours / totalHours) * 100) : 0,
      };
    });
  },

  getDailyStats: (days) => {
    const result: DailyStats[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      const count = get().bookings.filter(
        (b) =>
          b.status !== 'rejected' &&
          new Date(b.startTime) >= date &&
          new Date(b.startTime) < nextDay
      ).length;
      result.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }
    return result;
  },

  showNotification: (type, message) => {
    set({ notification: { type, message } });
    setTimeout(() => get().clearNotification(), 2000);
  },

  clearNotification: () => {
    set({ notification: null });
  },
}));
