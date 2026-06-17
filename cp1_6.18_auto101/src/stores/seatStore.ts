import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Seat,
  SeatZone,
  SeatStatus,
  SeatTags,
  Booking,
  BookingDuration,
  SeatFilter,
  NotificationItem,
} from '../types';
import { generateQRData } from '../utils/QRGenerator';

const CURRENT_USER_ID = 'user-001';

interface ZoneLayout {
  zone: SeatZone;
  startRow: number;
  endRow: number;
  count: number;
}

const ZONE_LAYOUTS: ZoneLayout[] = [
  { zone: 'A', startRow: 0, endRow: 2, count: 30 },
  { zone: 'B', startRow: 3, endRow: 5, count: 30 },
  { zone: 'C', startRow: 6, endRow: 7, count: 20 },
];

const TOTAL_COLS = 10;

function generateInitialSeats(): Seat[] {
  const seats: Seat[] = [];

  for (const layout of ZONE_LAYOUTS) {
    let seatIdx = 0;
    for (let row = layout.startRow; row <= layout.endRow && seatIdx < layout.count; row++) {
      for (let col = 0; col < TOTAL_COLS && seatIdx < layout.count; col++) {
        seatIdx++;
        const tags: SeatTags = {};
        if (col === 0 || col === TOTAL_COLS - 1) tags.windowView = true;
        if (col % 3 === 0) tags.powerOutlet = true;
        if (row === layout.endRow) tags.quietZone = true;

        seats.push({
          id: `seat-${layout.zone}-${row}-${col}`,
          seatNumber: `${layout.zone}-${String(seatIdx).padStart(2, '0')}`,
          zone: layout.zone,
          row,
          col,
          status: 'available',
          tags,
        });
      }
    }
  }

  const allIndices = seats.map((_, i) => i);
  for (let i = 0; i < 5; i++) {
    const randIdx = Math.floor(Math.random() * allIndices.length);
    const targetIdx = allIndices.splice(randIdx, 1)[0];
    seats[targetIdx].status = 'maintenance';
  }

  return seats;
}

function getZoneSeatCount(zone: SeatZone): number {
  const layout = ZONE_LAYOUTS.find((z) => z.zone === zone);
  return layout ? layout.count : 0;
}

interface SeatStore {
  seats: Seat[];
  bookings: Booking[];
  notifications: NotificationItem[];
  selectedSeatId: string | null;
  isBookingModalOpen: boolean;
  isSidebarOpen: boolean;
  filter: SeatFilter;

  setSelectedSeat: (seatId: string | null) => void;
  openBookingModal: (seatId: string) => void;
  closeBookingModal: () => void;
  toggleSidebar: (open?: boolean) => void;
  setFilter: (filter: Partial<SeatFilter>) => void;

  bookSeat: (seatId: string, duration: BookingDuration) => Booking | null;
  cancelBooking: (bookingId: string) => void;
  cleanupExpiredBookings: () => void;

  markReminderSent: (bookingId: string) => void;
  pushNotification: (notification: NotificationItem) => void;
  dismissNotification: (notificationId: string) => void;

  getZoneStats: () => Record<SeatZone, { total: number; available: number; occupied: number; maintenance: number }>;
  getActiveBookings: () => Booking[];
  getFilteredSeats: () => Seat[];
}

export const useSeatStore = create<SeatStore>()(
  persist(
    (set, get) => ({
      seats: [],
      bookings: [],
      notifications: [],
      selectedSeatId: null,
      isBookingModalOpen: false,
      isSidebarOpen: false,
      filter: {
        zone: 'all',
        windowView: false,
        powerOutlet: false,
        quietZone: false,
      },

      setSelectedSeat: (seatId) => set({ selectedSeatId: seatId }),

      openBookingModal: (seatId) =>
        set({
          selectedSeatId: seatId,
          isBookingModalOpen: true,
        }),

      closeBookingModal: () =>
        set({
          isBookingModalOpen: false,
          selectedSeatId: null,
        }),

      toggleSidebar: (open) =>
        set((state) => ({
          isSidebarOpen: typeof open === 'boolean' ? open : !state.isSidebarOpen,
        })),

      setFilter: (filter) =>
        set((state) => ({
          filter: { ...state.filter, ...filter },
        })),

      bookSeat: (seatId, duration) => {
        const { seats, bookings } = get();
        const seat = seats.find((s) => s.id === seatId);
        if (!seat || seat.status !== 'available') return null;

        const hasConflict = bookings.some(
          (b) => b.seatId === seatId && b.endTime > Date.now()
        );
        if (hasConflict) return null;

        const startTime = Date.now();
        const endTime = startTime + duration * 60 * 60 * 1000;
        const bookingId = uuidv4();

        const booking: Booking = {
          id: bookingId,
          seatId,
          seatNumber: seat.seatNumber,
          zone: seat.zone,
          userId: CURRENT_USER_ID,
          startTime,
          duration,
          endTime,
          qrCodeData: generateQRData(bookingId),
          reminderSent: false,
          createdAt: Date.now(),
        };

        set({
          seats: seats.map((s) =>
            s.id === seatId ? { ...s, status: 'occupied' as SeatStatus } : s
          ),
          bookings: [...bookings, booking],
          isBookingModalOpen: false,
          selectedSeatId: null,
          isSidebarOpen: true,
        });

        return booking;
      },

      cancelBooking: (bookingId) => {
        const { seats, bookings } = get();
        const booking = bookings.find((b) => b.id === bookingId);
        if (!booking) return;

        set({
          seats: seats.map((s) =>
            s.id === booking.seatId && s.status === 'occupied'
              ? { ...s, status: 'available' as SeatStatus }
              : s
          ),
          bookings: bookings.filter((b) => b.id !== bookingId),
        });
      },

      cleanupExpiredBookings: () => {
        const now = Date.now();
        const { seats, bookings } = get();
        const expiredSeatIds = bookings
          .filter((b) => b.endTime <= now)
          .map((b) => b.seatId);

        if (expiredSeatIds.length === 0) return;

        set({
          seats: seats.map((s) =>
            expiredSeatIds.includes(s.id) && s.status === 'occupied'
              ? { ...s, status: 'available' as SeatStatus }
              : s
          ),
          bookings: bookings.filter((b) => b.endTime > now),
        });
      },

      markReminderSent: (bookingId) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.id === bookingId ? { ...b, reminderSent: true } : b
          ),
        })),

      pushNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),

      dismissNotification: (notificationId) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== notificationId),
        })),

      getZoneStats: () => {
        const { seats } = get();
        const zones: SeatZone[] = ['A', 'B', 'C'];
        const stats = {} as Record<
          SeatZone,
          { total: number; available: number; occupied: number; maintenance: number }
        >;

        for (const zone of zones) {
          const zoneSeats = seats.filter((s) => s.zone === zone);
          stats[zone] = {
            total: getZoneSeatCount(zone),
            available: zoneSeats.filter((s) => s.status === 'available').length,
            occupied: zoneSeats.filter((s) => s.status === 'occupied').length,
            maintenance: zoneSeats.filter((s) => s.status === 'maintenance').length,
          };
        }

        return stats;
      },

      getActiveBookings: () => {
        const { bookings } = get();
        const now = Date.now();
        return bookings
          .filter((b) => b.userId === CURRENT_USER_ID && b.endTime > now)
          .sort((a, b) => a.startTime - b.startTime);
      },

      getFilteredSeats: () => {
        const { seats, filter } = get();
        return seats.filter((seat) => {
          if (filter.zone !== 'all' && seat.zone !== filter.zone) return false;
          if (filter.windowView && !seat.tags.windowView) return false;
          if (filter.powerOutlet && !seat.tags.powerOutlet) return false;
          if (filter.quietZone && !seat.tags.quietZone) return false;
          return true;
        });
      },
    }),
    {
      name: 'zhixuan-seat-store',
      partialize: (state) => ({
        seats: state.seats,
        bookings: state.bookings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.seats.length === 0) {
          state.seats = generateInitialSeats();
        }
        if (state) {
          state.notifications = [];
          state.isBookingModalOpen = false;
          state.isSidebarOpen = false;
          state.selectedSeatId = null;
          state.filter = {
            zone: 'all',
            windowView: false,
            powerOutlet: false,
            quietZone: false,
          };
          state.cleanupExpiredBookings();
        }
      },
    }
  )
);
