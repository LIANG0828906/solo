import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';
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

export const useFacilityStore = create<FacilityStore>((setState, getState) => ({
  facilities: [],
  bookings: [],
  users: [],
  currentUser: null,
  loading: true,
  notification: null,

  init: async () => {
    let finalFacilities: Facility[] = [];
    let finalBookings: Booking[] = [];
    let finalUsers: User[] = [];
    let currentUser: User | null = null;

    try {
      const [facilities, bookings, users, currentUserId] = await Promise.all([
        idbGet<Facility[]>(FACILITIES_KEY),
        idbGet<Booking[]>(BOOKINGS_KEY),
        idbGet<User[]>(USERS_KEY),
        idbGet<string>(CURRENT_USER_KEY),
      ]);

      finalFacilities = Array.isArray(facilities) ? facilities : [];
      finalUsers = Array.isArray(users) ? users : [];
      finalBookings = Array.isArray(bookings) ? bookings : [];

      const facilitiesCorrupted = !Array.isArray(facilities);
      const usersCorrupted = !Array.isArray(users);
      const bookingsCorrupted = !Array.isArray(bookings);

      if (finalFacilities.length === 0 || facilitiesCorrupted) {
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
        await idbSet(FACILITIES_KEY, finalFacilities);
      }

      if (finalUsers.length === 0 || usersCorrupted) {
        finalUsers = [
          { id: 'admin-1', name: '物业管理员', role: 'admin' },
          { id: 'user-1', name: '张三', role: 'resident', roomNumber: 'A栋101' },
          { id: 'user-2', name: '李四', role: 'resident', roomNumber: 'B栋203' },
        ];
        await idbSet(USERS_KEY, finalUsers);
      }

      if (bookingsCorrupted) {
        finalBookings = [];
        await idbSet(BOOKINGS_KEY, finalBookings);
      }

      currentUser = finalUsers.find((u) => u.id === currentUserId) || null;
      if (!currentUser) {
        currentUser = finalUsers[1];
        await idbSet(CURRENT_USER_KEY, currentUser.id);
      }
    } catch (error) {
      console.error('Failed to initialize store:', error);
      finalFacilities = [];
      finalBookings = [];
      finalUsers = [
        { id: 'admin-1', name: '物业管理员', role: 'admin' },
        { id: 'user-1', name: '张三', role: 'resident', roomNumber: 'A栋101' },
        { id: 'user-2', name: '李四', role: 'resident', roomNumber: 'B栋203' },
      ];
      currentUser = finalUsers[1];
    } finally {
      setState({
        facilities: finalFacilities,
        bookings: finalBookings,
        users: finalUsers,
        currentUser,
        loading: false,
      });
    }
  },

  setCurrentUser: async (userId: string) => {
    const user = getState().users.find((u) => u.id === userId);
    if (user) {
      setState({ currentUser: user });
      await idbSet(CURRENT_USER_KEY, userId);
    }
  },

  addFacility: async (facility) => {
    const newFacility: Facility = { ...facility, id: uuidv4() };
    const facilities = [...getState().facilities, newFacility];
    setState({ facilities });
    await idbSet(FACILITIES_KEY, facilities);
    return newFacility;
  },

  updateFacility: async (id, data) => {
    const facilities = getState().facilities.map((f) =>
      f.id === id ? { ...f, ...data } : f
    );
    setState({ facilities });
    await idbSet(FACILITIES_KEY, facilities);
  },

  deleteFacility: async (id) => {
    const facilities = getState().facilities.filter((f) => f.id !== id);
    const bookings = getState().bookings.filter((b) => b.facilityId !== id);
    setState({ facilities, bookings });
    await Promise.all([idbSet(FACILITIES_KEY, facilities), idbSet(BOOKINGS_KEY, bookings)]);
  },

  addBooking: async (booking) => {
    const newBooking: Booking = {
      ...booking,
      id: uuidv4(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const bookings = [...getState().bookings, newBooking];
    setState({ bookings });
    await idbSet(BOOKINGS_KEY, bookings);
    return newBooking;
  },

  approveBooking: async (id) => {
    const bookings = getState().bookings.map((b) =>
      b.id === id
        ? { ...b, status: 'confirmed' as const, updatedAt: new Date().toISOString() }
        : b
    );
    setState({ bookings });
    await idbSet(BOOKINGS_KEY, bookings);
  },

  rejectBooking: async (id, reason, suggestion) => {
    const bookings = getState().bookings.map((b) =>
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
    setState({ bookings });
    await idbSet(BOOKINGS_KEY, bookings);
  },

  deleteBooking: async (id) => {
    const bookings = getState().bookings.filter((b) => b.id !== id);
    setState({ bookings });
    await idbSet(BOOKINGS_KEY, bookings);
  },

  getUserBookings: (userId) => {
    return getState()
      .bookings.filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  getFacilityBookings: (facilityId) => {
    return getState().bookings.filter((b) => b.facilityId === facilityId);
  },

  getPendingBookings: () => {
    return getState()
      .bookings.filter((b) => b.status === 'pending')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  },

  getFacilityStats: (days) => {
    const now = new Date();
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const facilities = getState().facilities;

    return facilities.map((f) => {
      const relevantBookings = getState().bookings.filter(
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
      const count = getState().bookings.filter(
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
    setState({ notification: { type, message } });
    setTimeout(() => getState().clearNotification(), 2000);
  },

  clearNotification: () => {
    setState({ notification: null });
  },
}));
