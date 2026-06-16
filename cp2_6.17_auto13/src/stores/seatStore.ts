import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  Employee,
  Seat,
  SwapRequest,
  INITIAL_SEATS,
  EMPLOYEES,
  DEFAULT_SEAT_ASSIGNMENTS,
} from '../assets/data';

const DB_NAME = 'seatsync-db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('seats')) {
        db.createObjectStore('seats', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('employees')) {
        db.createObjectStore('employees', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('swapRequests')) {
        db.createObjectStore('swapRequests', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGetAll<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPutAll<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function persistSeats(seats: Seat[]): Promise<void> {
  await dbPutAll('seats', seats);
}

async function persistSwapRequests(requests: SwapRequest[]): Promise<void> {
  await dbPutAll('swapRequests', requests);
}

async function persistEmployees(employees: Employee[]): Promise<void> {
  await dbPutAll('employees', employees);
}

export interface SeatState {
  seats: Seat[];
  employees: Employee[];
  swapRequests: SwapRequest[];
  initialized: boolean;
  initialize: () => Promise<void>;
  assignSeat: (seatId: string, employeeId: string) => void;
  removeSeat: (seatId: string) => void;
  submitSwap: (employeeId: string, fromSeatId: string, toSeatId: string) => void;
  approveSwap: (requestId: string) => void;
  rejectSwap: (requestId: string) => void;
}

export const useSeatStore = create<SeatState>((set, get) => ({
  seats: [],
  employees: [],
  swapRequests: [],
  initialized: false,

  initialize: async () => {
    try {
      const savedSeats = await dbGetAll<Seat>('seats');
      const savedRequests = await dbGetAll<SwapRequest>('swapRequests');

      let seats: Seat[];
      if (savedSeats.length > 0) {
        seats = savedSeats;
      } else {
        seats = INITIAL_SEATS.map((s) => {
          const empId = DEFAULT_SEAT_ASSIGNMENTS[s.id];
          if (empId) {
            return { ...s, employeeId: empId, status: 'occupied' as const };
          }
          return s;
        });
      }

      const swapRequests = savedRequests.length > 0 ? savedRequests : [];

      await persistSeats(seats);
      await persistEmployees(EMPLOYEES);

      set({ seats, employees: EMPLOYEES, swapRequests, initialized: true });
    } catch {
      const seats = INITIAL_SEATS.map((s) => {
        const empId = DEFAULT_SEAT_ASSIGNMENTS[s.id];
        if (empId) {
          return { ...s, employeeId: empId, status: 'occupied' as const };
        }
        return s;
      });
      set({ seats, employees: EMPLOYEES, swapRequests: [], initialized: true });
    }
  },

  assignSeat: (seatId: string, employeeId: string) => {
    const { seats } = get();
    const newSeats = seats.map((s) => {
      if (s.id === seatId && s.status === 'free') {
        return { ...s, employeeId, status: 'occupied' as const };
      }
      return s;
    });
    set({ seats: newSeats });
    persistSeats(newSeats);
  },

  removeSeat: (seatId: string) => {
    const { seats } = get();
    const newSeats = seats.map((s) => {
      if (s.id === seatId) {
        return { ...s, employeeId: null, status: 'free' as const };
      }
      return s;
    });
    set({ seats: newSeats });
    persistSeats(newSeats);
  },

  submitSwap: (employeeId: string, fromSeatId: string, toSeatId: string) => {
    const { seats, swapRequests } = get();
    const fromSeat = seats.find((s) => s.id === fromSeatId);
    const toSeat = seats.find((s) => s.id === toSeatId);
    if (!fromSeat || !toSeat) return;

    const newRequest: SwapRequest = {
      id: uuidv4(),
      employeeId,
      fromSeatId,
      toSeatId,
      status: 'pending',
      createdAt: Date.now(),
    };

    const newSeats = seats.map((s) => {
      if (s.id === fromSeatId) {
        return { ...s, status: 'pending_approval' as const };
      }
      return s;
    });

    const newRequests = [...swapRequests, newRequest];
    set({ seats: newSeats, swapRequests: newRequests });
    persistSeats(newSeats);
    persistSwapRequests(newRequests);
  },

  approveSwap: (requestId: string) => {
    const { seats, swapRequests, employees } = get();
    const request = swapRequests.find((r) => r.id === requestId);
    if (!request || request.status !== 'pending') return;

    const fromSeat = seats.find((s) => s.id === request.fromSeatId);
    const toSeat = seats.find((s) => s.id === request.toSeatId);
    if (!fromSeat || !toSeat) return;

    const fromEmployeeId = fromSeat.employeeId;
    const toEmployeeId = toSeat.employeeId;

    const newSeats = seats.map((s) => {
      if (s.id === request.fromSeatId) {
        return {
          ...s,
          employeeId: toEmployeeId,
          status: toEmployeeId ? ('occupied' as const) : ('free' as const),
        };
      }
      if (s.id === request.toSeatId) {
        return {
          ...s,
          employeeId: fromEmployeeId,
          status: fromEmployeeId ? ('occupied' as const) : ('free' as const),
        };
      }
      return s;
    });

    const newRequests = swapRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'approved' as const } : r
    );

    set({ seats: newSeats, swapRequests: newRequests });
    persistSeats(newSeats);
    persistSwapRequests(newRequests);
    void employees;
  },

  rejectSwap: (requestId: string) => {
    const { seats, swapRequests } = get();
    const request = swapRequests.find((r) => r.id === requestId);
    if (!request || request.status !== 'pending') return;

    const newSeats = seats.map((s) => {
      if (s.id === request.fromSeatId && s.status === 'pending_approval') {
        return { ...s, status: 'occupied' as const };
      }
      return s;
    });

    const newRequests = swapRequests.map((r) =>
      r.id === requestId ? { ...r, status: 'rejected' as const } : r
    );

    set({ seats: newSeats, swapRequests: newRequests });
    persistSeats(newSeats);
    persistSwapRequests(newRequests);
  },
}));
