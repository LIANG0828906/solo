import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Property, Booking, DashboardStats, MonthlyStats, BookingStatus } from '@/types';
import { getAllProperties, saveProperties, getAllBookings, saveBookings } from '@/utils/db';

const generateMockData = () => {
  const properties: Property[] = [
    { id: uuidv4(), name: '海景公寓·蓝湾', address: '三亚市海棠湾', roomType: '两室一厅', maxGuests: 4, pricePerNight: 680 },
    { id: uuidv4(), name: '山景别墅·翠谷', address: '杭州市西湖区', roomType: '三室两厅', maxGuests: 6, pricePerNight: 1280 },
    { id: uuidv4(), name: '城市loft·星光', address: '上海市静安区', roomType: '复式loft', maxGuests: 3, pricePerNight: 520 },
    { id: uuidv4(), name: '古镇民宿·听雨', address: '苏州市吴中区', roomType: '一室一厅', maxGuests: 2, pricePerNight: 380 },
  ];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const bookings: Booking[] = [];
  const customerNames = ['张先生', '李女士', '王先生', '赵女士', '陈先生', '刘女士', '杨先生', '黄女士'];
  const statuses: BookingStatus[] = ['booked', 'pending', 'booked', 'booked'];

  properties.forEach((prop) => {
    for (let m = 0; m < 6; m++) {
      const offsetMonth = currentMonth - 5 + m;
      const d = new Date(currentYear, offsetMonth, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const bookedCount = Math.floor(daysInMonth * (0.4 + Math.random() * 0.3));
      const usedDays = new Set<number>();

      for (let i = 0; i < bookedCount; i++) {
        let day: number;
        do {
          day = Math.floor(Math.random() * daysInMonth) + 1;
        } while (usedDays.has(day));
        usedDays.add(day);

        const nights = 1 + Math.floor(Math.random() * 4);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        bookings.push({
          id: uuidv4(),
          propertyId: prop.id,
          customerName: customerNames[Math.floor(Math.random() * customerNames.length)],
          date: dateStr,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          nights,
          totalPrice: nights * prop.pricePerNight,
        });
      }
    }
  });

  return { properties, bookings };
};

interface PropertyState {
  properties: Property[];
  bookings: Booking[];
  selectedPropertyId: string | null;
  searchQuery: string;
  sortByRevenue: boolean;
  initialized: boolean;

  initData: () => Promise<void>;
  addProperty: (p: Omit<Property, 'id'>) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  filterByProperty: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  toggleSortByRevenue: () => void;

  getFilteredProperties: () => Property[];
  getDashboardStats: () => DashboardStats;
  getMonthlyStats: () => MonthlyStats[];
  getBookingsForDate: (dateStr: string, propertyId?: string) => Booking[];
}

export const usePropertyStore = create<PropertyState>((set, get) => ({
  properties: [],
  bookings: [],
  selectedPropertyId: null,
  searchQuery: '',
  sortByRevenue: false,
  initialized: false,

  initData: async () => {
    const savedProps = await getAllProperties();
    const savedBookings = await getAllBookings();
    const now = new Date();
    const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const fiveMonthsAgoStr = `${fiveMonthsAgo.getFullYear()}-${String(fiveMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    const hasOldData = savedBookings.some((b) => b.date.startsWith(fiveMonthsAgoStr));

    if (savedProps.length === 0 || !hasOldData) {
      const { properties, bookings } = generateMockData();
      await saveProperties(properties);
      await saveBookings(bookings);
      set({ properties, bookings, initialized: true });
    } else {
      set({ properties: savedProps, bookings: savedBookings, initialized: true });
    }
  },

  addProperty: (p) => {
    const newProp: Property = { ...p, id: uuidv4() };
    set((state) => {
      const newProperties = [...state.properties, newProp];
      saveProperties(newProperties);
      return { properties: newProperties };
    });
  },

  updateBooking: (bookingId, updates) => {
    set((state) => {
      const newBookings = state.bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates } : b
      );
      saveBookings(newBookings);
      return { bookings: newBookings };
    });
  },

  filterByProperty: (id) => set({ selectedPropertyId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  toggleSortByRevenue: () => set((s) => ({ sortByRevenue: !s.sortByRevenue })),

  getFilteredProperties: () => {
    const { properties, bookings, searchQuery, sortByRevenue, selectedPropertyId } = get();
    let result = properties.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortByRevenue) {
      const propRevenue = properties.map((p) => {
        const revenue = bookings
          .filter((b) => b.propertyId === p.id && b.status === 'booked')
          .reduce((sum, b) => sum + b.totalPrice, 0);
        return { id: p.id, revenue };
      });
      result = [...result].sort(
        (a, b) => (propRevenue.find((r) => r.id === b.id)?.revenue || 0) -
                   (propRevenue.find((r) => r.id === a.id)?.revenue || 0)
      );
    }
    return result;
  },

  getDashboardStats: () => {
    const { properties, bookings, selectedPropertyId } = get();
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const filteredBookings = selectedPropertyId
      ? bookings.filter((b) => b.propertyId === selectedPropertyId)
      : bookings;

    const filteredProps = selectedPropertyId
      ? properties.filter((p) => p.id === selectedPropertyId)
      : properties;

    const monthlyBooked = filteredBookings.filter(
      (b) => b.date.startsWith(currentMonthStr) && b.status === 'booked'
    );

    const monthlyRevenue = monthlyBooked.reduce((sum, b) => sum + b.totalPrice, 0);
    const pendingCount = filteredBookings.filter((b) => b.status === 'pending').length;

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalAvailableDays = filteredProps.length * daysInMonth;
    const occupancyRate = totalAvailableDays > 0
      ? Math.round((monthlyBooked.length / totalAvailableDays) * 100)
      : 0;

    return {
      totalProperties: filteredProps.length,
      monthlyRevenue,
      averageOccupancy: occupancyRate,
      pendingBookings: pendingCount,
    };
  },

  getMonthlyStats: () => {
    const { properties, bookings, selectedPropertyId } = get();
    const now = new Date();
    const result: MonthlyStats[] = [];

    const filteredBookings = selectedPropertyId
      ? bookings.filter((b) => b.propertyId === selectedPropertyId)
      : bookings;

    const filteredProps = selectedPropertyId
      ? properties.filter((p) => p.id === selectedPropertyId)
      : properties;

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${d.getMonth() + 1}月`;
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

      const monthBookings = filteredBookings.filter(
        (b) => b.date.startsWith(monthStr) && b.status === 'booked'
      );
      const revenue = monthBookings.reduce((sum, b) => sum + b.totalPrice, 0);
      const totalAvailableDays = filteredProps.length * daysInMonth;
      const occupancyRate = totalAvailableDays > 0
        ? Math.round((monthBookings.length / totalAvailableDays) * 100)
        : 0;

      result.push({ month: monthLabel, revenue, occupancyRate });
    }

    return result;
  },

  getBookingsForDate: (dateStr, propertyId) => {
    const { bookings, selectedPropertyId } = get();
    const pid = propertyId || selectedPropertyId;
    return bookings.filter((b) => {
      if (b.date !== dateStr) return false;
      if (pid && b.propertyId !== pid) return false;
      return true;
    });
  },
}));
