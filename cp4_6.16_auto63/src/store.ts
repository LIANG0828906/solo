import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { format, startOfWeek, addDays, isWithinInterval } from 'date-fns';
import type { Seat, Reservation, TimerState, Stats, DailyStats, SeatStatus } from './types';

interface AppState {
  seats: Seat[];
  reservations: Reservation[];
  timer: TimerState;
  stats: Stats;
  initStore: () => Promise<void>;
  addReservation: (seatId: string, durationHours: number) => Promise<Reservation>;
  cancelReservation: (reservationId: string) => Promise<void>;
  startTimer: (reservationId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<void>;
  tickTimer: () => void;
  updateReservationStatus: () => void;
}

const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  let number = 1;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      seats.push({
        id: `seat-${row}-${col}`,
        number: number++,
        row,
        col,
        status: 'idle'
      });
    }
  }
  return seats;
};

const getEmptyDailyStats = (date: string): DailyStats => ({
  date,
  totalFocusMinutes: 0,
  sessions: 0,
  completedReservations: 0,
  onTimeCheckIns: 0,
  totalReservations: 0
});

const calculateScores = (stats: Stats) => {
  const { today, weeklyDaysStudied, totalFocusHours } = stats;
  const focus = today.totalFocusMinutes > 0 ? Math.min(100, Math.round((today.totalFocusMinutes / 240) * 100)) : 50;
  const duration = totalFocusHours > 0 ? Math.min(100, Math.round((Math.min(totalFocusHours, 50) / 50) * 100)) : 50;
  const attendance = weeklyDaysStudied > 0 ? Math.min(100, Math.round((weeklyDaysStudied / 7) * 100)) : 50;
  const punctuality = today.totalReservations > 0
    ? Math.round((today.onTimeCheckIns / today.totalReservations) * 100)
    : 50;
  const completion = today.totalReservations > 0
    ? Math.round((today.completedReservations / today.totalReservations) * 100)
    : 50;
  return { focus, duration, attendance, punctuality, completion };
};

export const useAppStore = create<AppState>((zSet, zGet) => ({
  seats: [],
  reservations: [],
  timer: {
    isRunning: false,
    isPaused: false,
    currentSeatId: null,
    currentReservationId: null,
    elapsedSeconds: 0,
    totalSeconds: 0,
    startedAt: null
  },
  stats: {
    today: getEmptyDailyStats(format(new Date(), 'yyyy-MM-dd')),
    weeklyDaysStudied: 0,
    totalFocusHours: 0,
    scores: { focus: 50, duration: 50, attendance: 50, punctuality: 50, completion: 50 }
  },

  initStore: async () => {
    const savedSeats = await idbGet<Seat[]>('focushub_seats');
    const savedReservations = await idbGet<Reservation[]>('focushub_reservations');
    const savedStats = await idbGet<Stats>('focushub_stats');

    const seats: Seat[] = savedSeats || generateSeats();
    const reservations: Reservation[] = savedReservations || [];
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    let stats: Stats;
    if (savedStats) {
      stats = savedStats;
      if (stats.today.date !== todayStr) {
        stats.today = getEmptyDailyStats(todayStr);
      }
    } else {
      stats = {
        today: getEmptyDailyStats(todayStr),
        weeklyDaysStudied: 0,
        totalFocusHours: 0,
        scores: { focus: 50, duration: 50, attendance: 50, punctuality: 50, completion: 50 }
      };
    }
    stats.scores = calculateScores(stats);

    const now = Date.now();
    reservations.forEach(r => {
      if (r.status === 'waiting' && r.startTime <= now) {
        r.status = 'in-progress';
      }
      if ((r.status === 'waiting' || r.status === 'in-progress') &&
          r.startTime + r.durationMinutes * 60 * 1000 <= now) {
        if (r.status === 'waiting') r.status = 'cancelled';
        else r.status = 'completed';
      }
    });

    const seatStatusMap: Record<string, SeatStatus> = {};
    reservations.forEach(r => {
      if (r.status === 'waiting') seatStatusMap[r.seatId] = 'reserved';
      else if (r.status === 'in-progress') seatStatusMap[r.seatId] = 'in-use';
    });
    seats.forEach(s => {
      s.status = seatStatusMap[s.id] || 'idle';
    });

    zSet({ seats, reservations, stats });
    await idbSet('focushub_seats', seats);
    await idbSet('focushub_reservations', reservations);
    await idbSet('focushub_stats', stats);
  },

  addReservation: async (seatId: string, durationHours: number) => {
    const state = zGet();
    const seats = [...state.seats];
    const reservations = [...state.reservations];
    const stats = { ...state.stats, today: { ...state.stats.today }, scores: { ...state.stats.scores } };

    const seat = seats.find(s => s.id === seatId);
    if (!seat || seat.status !== 'idle') {
      throw new Error('座位不可预约');
    }

    const now = Date.now();
    const WAIT_SECONDS = 15;
    const reservation: Reservation = {
      id: uuidv4(),
      seatId,
      seatNumber: seat.number,
      startTime: now + WAIT_SECONDS * 1000,
      durationMinutes: Math.round(durationHours * 60),
      status: 'waiting',
      createdAt: now,
      focusMinutes: 0
    };

    seat.status = 'reserved';
    stats.today.totalReservations += 1;
    stats.scores = calculateScores(stats);

    reservations.push(reservation);

    zSet({ seats, reservations, stats });
    await idbSet('focushub_seats', seats);
    await idbSet('focushub_reservations', reservations);
    await idbSet('focushub_stats', stats);

    return reservation;
  },

  cancelReservation: async (reservationId: string) => {
    const state = zGet();
    const seats = [...state.seats];
    const reservations = [...state.reservations];

    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation || reservation.status !== 'waiting') {
      throw new Error('无法取消该预约');
    }

    reservation.status = 'cancelled';
    const seat = seats.find(s => s.id === reservation.seatId);
    if (seat) seat.status = 'idle';

    zSet({ seats, reservations });
    await idbSet('focushub_seats', seats);
    await idbSet('focushub_reservations', reservations);
  },

  startTimer: (reservationId: string) => {
    const state = zGet();
    const reservation = state.reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    zSet({
      timer: {
        isRunning: true,
        isPaused: false,
        currentSeatId: reservation.seatId,
        currentReservationId: reservationId,
        elapsedSeconds: 0,
        totalSeconds: reservation.durationMinutes * 60,
        startedAt: Date.now()
      }
    });
  },

  pauseTimer: () => {
    const state = zGet();
    zSet({
      timer: { ...state.timer, isPaused: true }
    });
  },

  resumeTimer: () => {
    const state = zGet();
    zSet({
      timer: { ...state.timer, isPaused: false }
    });
  },

  stopTimer: async () => {
    const state = zGet();
    const { timer } = state;
    if (!timer.currentReservationId) return;

    const focusMinutes = Math.floor(timer.elapsedSeconds / 60);
    const reservations = [...state.reservations];
    const seats = [...state.seats];
    const stats = {
      ...state.stats,
      today: { ...state.stats.today },
      scores: { ...state.stats.scores }
    };

    const reservation = reservations.find(r => r.id === timer.currentReservationId);
    if (reservation) {
      reservation.focusMinutes = focusMinutes;
      if (reservation.status === 'in-progress') {
        reservation.status = 'completed';
        stats.today.completedReservations += 1;
      }
    }

    stats.today.totalFocusMinutes += focusMinutes;
    stats.today.sessions += 1;
    stats.totalFocusHours = parseFloat((stats.totalFocusHours + focusMinutes / 60).toFixed(2));

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const uniqueDays = new Set<string>();
    reservations.forEach(r => {
      if (r.focusMinutes > 0) {
        const date = new Date(r.createdAt);
        if (isWithinInterval(date, { start: weekStart, end: addDays(weekStart, 6) })) {
          uniqueDays.add(format(date, 'yyyy-MM-dd'));
        }
      }
    });
    if (focusMinutes > 0) uniqueDays.add(format(new Date(), 'yyyy-MM-dd'));
    stats.weeklyDaysStudied = uniqueDays.size;

    stats.scores = calculateScores(stats);

    const seatId = timer.currentSeatId;
    const finalSeats = seats.map(s =>
      s.id === seatId ? { ...s, status: 'idle' as SeatStatus } : s
    );

    zSet({
      seats: finalSeats,
      reservations,
      stats,
      timer: {
        isRunning: false,
        isPaused: false,
        currentSeatId: null,
        currentReservationId: null,
        elapsedSeconds: 0,
        totalSeconds: 0,
        startedAt: null
      }
    });

    await idbSet('focushub_seats', finalSeats);
    await idbSet('focushub_reservations', reservations);
    await idbSet('focushub_stats', stats);
  },

  tickTimer: () => {
    const state = zGet();
    const { timer } = state;
    if (!timer.isRunning || timer.isPaused) return;
    const newElapsed = timer.elapsedSeconds + 1;
    if (newElapsed >= timer.totalSeconds) {
      return;
    }
    zSet({
      timer: { ...timer, elapsedSeconds: newElapsed }
    });
  },

  updateReservationStatus: () => {
    const state = zGet();
    const { reservations, seats } = state;
    const now = Date.now();
    let changed = false;

    const newReservations = reservations.map(r => {
      if (r.status === 'waiting' && r.startTime <= now) {
        changed = true;
        return { ...r, status: 'in-progress' as const };
      }
      return r;
    });

    if (changed) {
      const seatStatusMap: Record<string, SeatStatus> = {};
      newReservations.forEach(r => {
        if (r.status === 'waiting') seatStatusMap[r.seatId] = 'reserved';
        else if (r.status === 'in-progress') seatStatusMap[r.seatId] = 'in-use';
      });
      const newSeats = seats.map(s => ({
        ...s,
        status: seatStatusMap[s.id] || 'idle'
      }));

      zSet({ reservations: newReservations, seats: newSeats });
    }
  }
}));
