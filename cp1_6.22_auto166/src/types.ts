export type SeatStatus = 'available' | 'reserved' | 'in-use';

export interface Seat {
  id: string;
  number: number;
  x: number;
  y: number;
  status: SeatStatus;
}

export interface Reservation {
  id: string;
  seatId: string;
  seatNumber: number;
  userId: string;
  startTime: string;
  endTime: string;
  duration: number;
  createdAt: string;
}

export interface CheckInRecord {
  id: string;
  seatId: string;
  seatNumber: number;
  userId: string;
  reservationId: string;
  checkInTime: string;
  checkOutTime: string | null;
  actualDuration: number;
  reservedDuration: number;
  deviation: number;
  date: string;
  status: 'active' | 'completed';
}

export interface User {
  id: string;
  name: string;
}

export type PageType = 'main' | 'history';

export interface AppState {
  seats: Seat[];
  reservations: Reservation[];
  checkInRecords: CheckInRecord[];
  currentUser: User;
  activeReservation: Reservation | null;
  activeCheckIn: CheckInRecord | null;
  currentPage: PageType;
  selectedSeat: Seat | null;
  showModal: boolean;
  showDateTimePicker: boolean;
  currentTime: number;
  roomLocation: {
    latitude: number;
    longitude: number;
  };
}
