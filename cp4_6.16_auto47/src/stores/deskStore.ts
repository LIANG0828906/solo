import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInMinutes, isSameDay, isToday } from 'date-fns';
import type { Desk, CheckinRecord, TimeSlot } from '@/types';

const ROWS = 5;
const COLS = 6;
const STORAGE_KEY_DESKS = 'deskhive_desks';
const STORAGE_KEY_RECORDS = 'deskhive_records';
const CURRENT_USER_ID = 'user_001';

function generateInitialDesks(): Desk[] {
  const desks: Desk[] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const index = row * COLS + col + 1;
      desks.push({
        id: `D${index.toString().padStart(2, '0')}`,
        row: row + 1,
        col: col + 1,
        status: 'free',
        bookedBy: null,
        timeSlot: null,
        bookedDate: null,
        checkinTime: null,
      });
    }
  }
  return desks;
}

function isBookingExpired(desk: Desk): boolean {
  if (desk.status === 'free' || !desk.bookedDate) return false;
  if (desk.status === 'checked-in') return false;
  const today = format(new Date(), 'yyyy-MM-dd');
  return desk.bookedDate < today;
}

function cleanupExpiredBookings(desks: Desk[]): Desk[] {
  return desks.map((desk) => {
    if (isBookingExpired(desk)) {
      return {
        ...desk,
        status: 'free',
        bookedBy: null,
        timeSlot: null,
        bookedDate: null,
      };
    }
    return desk;
  });
}

interface DeskState {
  currentUserId: string;
  desks: Desk[];
  checkinRecords: CheckinRecord[];
  initialized: boolean;
  initializeData: () => Promise<void>;
  bookDesk: (deskId: string, date: string, timeSlot: TimeSlot) => Promise<void>;
  checkin: (deskId: string) => Promise<void>;
  checkout: (deskId: string) => Promise<void>;
  getTodayRecords: (userId: string) => CheckinRecord[];
  getRecordsByDate: (userId: string, date: string) => CheckinRecord[];
}

export const useDeskStore = create<DeskState>((set, get) => ({
  currentUserId: CURRENT_USER_ID,
  desks: [],
  checkinRecords: [],
  initialized: false,

  initializeData: async () => {
    if (get().initialized) return;

    let storedDesks = await idbGet(STORAGE_KEY_DESKS) as Desk[] | undefined;
    if (!storedDesks || storedDesks.length === 0) {
      storedDesks = generateInitialDesks();
    }
    storedDesks = cleanupExpiredBookings(storedDesks);

    let storedRecords = await idbGet(STORAGE_KEY_RECORDS) as CheckinRecord[] | undefined;
    if (!storedRecords) {
      storedRecords = [];
    }

    set({ desks: storedDesks, checkinRecords: storedRecords, initialized: true });
  },

  bookDesk: async (deskId: string, date: string, timeSlot: TimeSlot) => {
    const { currentUserId, desks } = get();
    const newDesks = desks.map((desk) => {
      if (desk.id === deskId && desk.status === 'free') {
        return {
          ...desk,
          status: 'booked' as const,
          bookedBy: currentUserId,
          timeSlot,
          bookedDate: date,
        };
      }
      return desk;
    });
    set({ desks: newDesks });
    await idbSet(STORAGE_KEY_DESKS, newDesks);
  },

  checkin: async (deskId: string) => {
    const { currentUserId, desks, checkinRecords } = get();
    const now = new Date();
    const dateStr = format(now, 'yyyy-MM-dd');
    const isoTime = now.toISOString();

    const newDesks = desks.map((desk) => {
      if (desk.id === deskId && desk.status === 'booked') {
        return {
          ...desk,
          status: 'checked-in' as const,
          checkinTime: isoTime,
        };
      }
      return desk;
    });

    const newRecord: CheckinRecord = {
      id: uuidv4(),
      userId: currentUserId,
      deskId,
      date: dateStr,
      checkinTime: isoTime,
      checkoutTime: null,
      workMinutes: 0,
      operationType: 'checkin',
      timestamp: isoTime,
    };

    const newRecords = [...checkinRecords, newRecord];

    set({ desks: newDesks, checkinRecords: newRecords });
    await idbSet(STORAGE_KEY_DESKS, newDesks);
    await idbSet(STORAGE_KEY_RECORDS, newRecords);
  },

  checkout: async (deskId: string) => {
    const { currentUserId, desks, checkinRecords } = get();
    const now = new Date();
    const isoTime = now.toISOString();

    const desk = desks.find((d) => d.id === deskId);
    if (!desk || !desk.checkinTime) return;

    const workMinutes = differenceInMinutes(now, new Date(desk.checkinTime));

    const newDesks = desks.map((d) => {
      if (d.id === deskId && d.status === 'checked-in') {
        return {
          ...d,
          status: 'free' as const,
          bookedBy: null,
          timeSlot: null,
          bookedDate: null,
          checkinTime: null,
        };
      }
      return d;
    });

    const existingRecord = checkinRecords.find(
      (r) => r.deskId === deskId && r.operationType === 'checkin' && r.checkoutTime === null && isSameDay(new Date(r.timestamp), now)
    );

    let newRecords: CheckinRecord[];
    if (existingRecord) {
      newRecords = checkinRecords.map((r) =>
        r.id === existingRecord.id
          ? { ...r, checkoutTime: isoTime, workMinutes, operationType: 'checkout', timestamp: isoTime }
          : r
      );
    } else {
      const checkoutRecord: CheckinRecord = {
        id: uuidv4(),
        userId: currentUserId,
        deskId,
        date: format(now, 'yyyy-MM-dd'),
        checkinTime: desk.checkinTime,
        checkoutTime: isoTime,
        workMinutes,
        operationType: 'checkout',
        timestamp: isoTime,
      };
      newRecords = [...checkinRecords, checkoutRecord];
    }

    set({ desks: newDesks, checkinRecords: newRecords });
    await idbSet(STORAGE_KEY_DESKS, newDesks);
    await idbSet(STORAGE_KEY_RECORDS, newRecords);
  },

  getTodayRecords: (userId: string) => {
    return get()
      .checkinRecords.filter((r) => r.userId === userId && isToday(new Date(r.timestamp)))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  getRecordsByDate: (userId: string, date: string) => {
    return get()
      .checkinRecords.filter(
        (r) => r.userId === userId && r.date === date
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },
}));
