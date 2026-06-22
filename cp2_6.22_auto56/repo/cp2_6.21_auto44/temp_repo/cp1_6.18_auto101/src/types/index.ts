export type SeatZone = 'A' | 'B' | 'C';

export type SeatStatus = 'available' | 'occupied' | 'maintenance';

export interface SeatTags {
  windowView?: boolean;
  powerOutlet?: boolean;
  quietZone?: boolean;
}

export interface Seat {
  id: string;
  seatNumber: string;
  zone: SeatZone;
  row: number;
  col: number;
  status: SeatStatus;
  tags: SeatTags;
}

export type BookingDuration = 1 | 2 | 4;

export interface Booking {
  id: string;
  seatId: string;
  seatNumber: string;
  zone: SeatZone;
  userId: string;
  startTime: number;
  duration: BookingDuration;
  endTime: number;
  qrCodeData: string;
  reminderSent: boolean;
  createdAt: number;
}

export interface SeatFilter {
  zone: SeatZone | 'all';
  windowView: boolean;
  powerOutlet: boolean;
  quietZone: boolean;
}

export interface NotificationItem {
  id: string;
  bookingId: string;
  message: string;
  seatInfo: string;
  minutesLeft: number;
  createdAt: number;
}
