export type SeatStatus = 'idle' | 'reserved' | 'in-use';

export interface Seat {
  id: string;
  number: number;
  row: number;
  col: number;
  status: SeatStatus;
}

export type ReservationStatus = 'waiting' | 'in-progress' | 'completed' | 'cancelled';

export interface Reservation {
  id: string;
  seatId: string;
  seatNumber: number;
  startTime: number;
  durationMinutes: number;
  status: ReservationStatus;
  createdAt: number;
  focusMinutes: number;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentSeatId: string | null;
  currentReservationId: string | null;
  elapsedSeconds: number;
  totalSeconds: number;
  startedAt: number | null;
}

export interface DailyStats {
  date: string;
  totalFocusMinutes: number;
  sessions: number;
  completedReservations: number;
  onTimeCheckIns: number;
  totalReservations: number;
}

export interface Stats {
  today: DailyStats;
  weeklyDaysStudied: number;
  totalFocusHours: number;
  scores: {
    focus: number;
    duration: number;
    attendance: number;
    punctuality: number;
    completion: number;
  };
}
